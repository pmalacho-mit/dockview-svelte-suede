<script lang="ts" module>
  import {
    createDockview,
    DockviewGroupPanel,
    PROPERTY_KEYS_DOCKVIEW,
    type DockviewFrameworkOptions,
    type IHeaderActionsRenderer,
  } from "dockview-core";
  import type { RecursivePartial } from "./utils/types.js";
  import {
    createExtendedAPI,
    extractCoreOptions,
    getComponentToMount,
    snippetIntoParams,
    type ComponentsConstraint,
    type CustomComponentConstraint,
    type CustomSnippetsConstraint,
    type DockviewSpecificComponentConstraint,
    type DockviewTabConstraint,
    type ModifiedProps,
    type SnippetsConstraint,
    type ViewAPI,
  } from "./utils/index.js";
  import SnippetRender from "./utils/SnippetRender.svelte";
  import {
    SvelteDockActionsHeaderRenderer,
    SvelteDockHeaderRenderer,
    SvelteWatermarkRenderer,
    SvelteDockComponentRenderer,
  } from "./dock/index.js";

  let dockCount = 0;

  /**
   * Every dockview option that is forwarded straight from props.
   *
   * `theme` is not one of them: it arrives as a theme *name* which this
   * component maps to a theme object, so it is applied by its own effect.
   * Forwarding it here would push `undefined` over that mapped value.
   */
  const forwardedOptionKeys = PROPERTY_KEYS_DOCKVIEW.filter(
    (key): key is Exclude<(typeof PROPERTY_KEYS_DOCKVIEW)[number], "theme"> =>
      key !== "theme",
  );

  type Renderable<Props extends Record<string, any>> =
    | { component: CustomComponentConstraint<Props>[string] }
    | { snippet: CustomSnippetsConstraint<Props>[string] };

  /**
   * What to hand a renderer so it mounts `detail`, whichever of the two
   * shapes it was given. Snippets are mounted through `SnippetRender`.
   */
  const mountable = <Props extends Record<string, any>>(
    detail: Renderable<Props>,
    role: string
  ) => {
    if ("component" in detail)
      return {
        name: detail.component.name,
        svelteComponent: detail.component,
        propsPostProcessor: undefined,
      };

    if ("snippet" in detail)
      return {
        name: role,
        svelteComponent: SnippetRender as any,
        propsPostProcessor: snippetIntoParams(() => detail.snippet),
      };

    throw new Error(`The ${role} is neither a component nor a snippet`);
  };

  type GroupControlElementKey =
    | "leftHeaderActions"
    | "rightHeaderActions"
    | "prefixHeaderActions";

  type CreateGroupControlElement =
    | ((groupPanel: DockviewGroupPanel) => IHeaderActionsRenderer)
    | undefined;

  const createGroupControlElement = <Type extends GroupControlElementKey>(
    viewIndex: number,
    role: Type,
    detail?: DockviewSpecificComponentConstraint[Type]
  ): CreateGroupControlElement =>
    detail
      ? (groupPanel: DockviewGroupPanel) =>
          new SvelteDockActionsHeaderRenderer(groupPanel, {
            viewIndex,
            id: groupPanel.id,
            ...mountable(detail, role),
          })
      : undefined;

  /** The name dockview asks for when a panel does not name its own tab. */
  const defaultTabName = "dockview-svelte-default-tab";
</script>

<script
  lang="ts"
  generics="
  const Components extends ComponentsConstraint<`dock`>,
  const Snippets extends SnippetsConstraint<`dock`>,
  const TabComponent extends DockviewTabConstraint[`components`],
  const TabSnippet extends DockviewTabConstraint[`snippets`],
  const Watermark extends DockviewSpecificComponentConstraint[`watermark`],
  const DefaultTab extends DockviewSpecificComponentConstraint[`defaultTab`],
  const RightHeaderActions extends DockviewSpecificComponentConstraint[`rightHeaderActions`],
  const LeftHeaderActions extends DockviewSpecificComponentConstraint[`leftHeaderActions`],
  const PrefixHeaderActions extends DockviewSpecificComponentConstraint[`prefixHeaderActions`],
"
>
  import { onDestroy, onMount } from "svelte";
  import { resolveTheme } from "./utils/themes.js";

  type DockSpecific = {
    tabs: {
      components: TabComponent;
      snippets: TabSnippet;
    };
    watermark: Watermark;
    defaultTab: DefaultTab;
    rightHeaderActions: RightHeaderActions;
    leftHeaderActions: LeftHeaderActions;
    prefixHeaderActions: PrefixHeaderActions;
  };

  type Props = RecursivePartial<DockSpecific> &
    ModifiedProps<"dock", Components, Snippets, DockSpecific>;

  const index = dockCount++;

  let {
    components,
    snippets,
    tabs,
    theme: _theme,
    watermark,
    defaultTab,
    rightHeaderActions,
    leftHeaderActions,
    prefixHeaderActions,
    onReady,
    onDidDrop,
    onWillDrop,
    ...props
  }: Props = $props();

  const theme = $derived(resolveTheme(_theme));

  let dockView: ViewAPI<"dock", Components, Snippets>;

  for (const key of forwardedOptionKeys)
    $effect(() => dockView!?.updateOptions({ [key]: props[key] }));

  const createTabComponent = (
    options: Parameters<
      Required<DockviewFrameworkOptions>["createTabComponent"]
    >[0]
  ) => {
    if (defaultTab && options.name === defaultTabName)
      return new SvelteDockHeaderRenderer({
        id: options.id,
        viewIndex: index,
        ...mountable(defaultTab as DefaultTab, "defaultTab"),
      });

    const { component, propsPostProcessor, name } = getComponentToMount(
      "dock",
      tabs?.components as ComponentsConstraint<"dock">,
      tabs?.snippets as SnippetsConstraint<"dock">,
      options
    );

    return new SvelteDockHeaderRenderer({
      name,
      id: options.id,
      viewIndex: index,
      svelteComponent: component,
      propsPostProcessor,
    });
  };

  const frameworkOptions: DockviewFrameworkOptions = {
    createLeftHeaderActionComponent: createGroupControlElement(
      index,
      "leftHeaderActions",
      leftHeaderActions as LeftHeaderActions
    ),
    createRightHeaderActionComponent: createGroupControlElement(
      index,
      "rightHeaderActions",
      rightHeaderActions as RightHeaderActions
    ),
    createPrefixHeaderActionComponent: createGroupControlElement(
      index,
      "prefixHeaderActions",
      prefixHeaderActions as PrefixHeaderActions
    ),
    createComponent: (options) => {
      const { component, propsPostProcessor, name } = getComponentToMount(
        "dock",
        components,
        snippets,
        options
      );

      return new SvelteDockComponentRenderer({
        name,
        id: options.id,
        viewIndex: index,
        svelteComponent: component,
        propsPostProcessor,
      });
    },
    createTabComponent: tabs || defaultTab ? createTabComponent : undefined,
    createWatermarkComponent: watermark
      ? () =>
          new SvelteWatermarkRenderer({
            id: "watermark",
            viewIndex: index,
            ...mountable(watermark as Watermark, "watermark"),
          })
      : undefined,
  };

  let element = $state<HTMLElement>();

  onMount(() => {
    const api = createDockview(element!, {
      ...extractCoreOptions(props, forwardedOptionKeys),
      ...frameworkOptions,
      defaultTabComponent: defaultTab ? defaultTabName : undefined,
      theme,
    });

    dockView = Object.assign(
      api,
      createExtendedAPI<"dock", Components, Snippets>("dock", api, index)
    );

    const { clientWidth, clientHeight } = element!;
    dockView.layout(clientWidth, clientHeight);

    onReady?.({ api: dockView });
  });

  $effect(() => {
    if (onDidDrop) dockView?.onDidDrop(onDidDrop);
  });

  $effect(() => {
    if (onWillDrop) dockView?.onWillDrop(onWillDrop);
  });

  onDestroy(() => {
    dockView?.dispose();
  });

  $effect(() => {
    dockView?.updateOptions({ theme });
  });
</script>

<div
  id={`dock${index}`}
  bind:this={element}
  style:width="100%"
  style:height="100%"
></div>

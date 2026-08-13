<script lang="ts" module>
  import type {
    IDockviewHeaderActionsProps,
    IDockviewPanelHeaderProps,
    IDockviewPanel,
    IWatermarkPanelProps,
  } from "dockview";
  import { Sweater } from "../../sweater-vest-suede";
  import {
    DefaultDockTab,
    DockView,
    themes,
    type DockviewTheme,
    type ITabGroupChipProps,
    type Theme,
    type ViewAPI,
  } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import type { Params } from "./fixtures/Label.svelte";
  import DockLabel from "./fixtures/DockLabel.svelte";
  import DockTab from "./fixtures/DockTab.svelte";
  import { labels, rendered, themeNames, ViewPocket } from "./support.svelte";

  type Api = ViewAPI<"dock", { Label: typeof DockLabel }>;

  type Pocket = ViewPocket<Api>;

  class Restyled extends ViewPocket<Api> {
    theme = $state<Theme>("dark");
  }

  /** Settings like `tabAnimation` are reachable only through a theme object. */
  const handRolled = {
    ...themes.dark,
    tabAnimation: "smooth",
  } satisfies DockviewTheme;

  /** A tab group is named by the panel group it lives in, then filled. */
  const intoTabGroup = (api: Api, panel: IDockviewPanel, label: string) => {
    const groupId = panel.api.group.id;
    const { id: tabGroupId } = api.createTabGroup({ groupId, label });
    api.addPanelToTabGroup({ groupId, tabGroupId, panelId: panel.id });
  };

  const withTab = (name: string, id: string) =>
    panel("dock").id(id).tabComponent(name)();

  /**
   * A tab cancels `pointerdown` to keep focus where it was, and `userEvent`
   * answers that by cancelling the click it would otherwise emulate.
   */
  const clickThroughPointerdownGuard = (element: HTMLElement) => element.click();

  const closeButton = (container: HTMLElement) => {
    const tab = rendered.only(container, "dockview-dv-default-tab");
    const button = tab.querySelector(".dv-default-tab-action");
    if (!(button instanceof HTMLElement))
      throw new Error("The default tab rendered without a close button");
    return button;
  };
</script>

<Sweater config category="DockView chrome" orientation="vertical" />

<Sweater
  name="a tab component renders in place of the default tab"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel(
      "Label",
      { text: "first" },
      withTab("Tab", "first")
    );

    harness.capture("png");
    harness.expect(rendered.texts(harness.container, "tab")).toEqual([
      "tab for first",
    ]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render tabbed(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="a tab component is told where it is rendered"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel(
      "Label",
      { text: "first" },
      withTab("Tab", "first")
    );

    harness.expect(rendered.texts(harness.container, "tab-location")).toEqual([
      "header",
    ]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render tabbed(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="a tab snippet renders in place of the default tab"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel(
      "Label",
      { text: "first" },
      withTab("tab", "first")
    );

    harness.expect(rendered.texts(harness.container, "tab")).toEqual([
      "snippet tab for first",
    ]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render tabbed(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="the default tab covers panels that do not name a tab"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel("Label", { text: "first" });

    harness.expect(rendered.texts(harness.container, "tab")).toEqual([
      "tab for first",
    ]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render defaultTabbed(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="the default tab closes the panel it belongs to"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel(
      "Label",
      { text: "first" },
      withTab("Default", "first")
    );

    clickThroughPointerdownGuard(closeButton(harness.container));
    await harness.delay({ frames: 2 });

    harness.expect(api.panels).toHaveLength(0);
    harness.expect(labels(harness.container)).toEqual([]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render tabbed(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="the default tab closes the panel it belongs to from the keyboard"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel(
      "Label",
      { text: "first" },
      withTab("Default", "first")
    );

    await harness.withUserFocus(async (user) => {
      closeButton(harness.container).focus();
      await user.keyboard("{Enter}");
    });
    await harness.delay({ frames: 2 });

    harness.expect(api.panels).toHaveLength(0);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render tabbed(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="the watermark shows until the first panel is added"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    harness.capture("png");
    harness.expect(rendered.texts(harness.container, "watermark")).toEqual([
      "nothing open",
    ]);

    await api.addComponentPanel("Label", { text: "first" });

    harness.expect(rendered.all(harness.container, "watermark")).toEqual([]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render watermarked(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="header actions follow the panels of their group"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel("Label", { text: "first" }, panel("dock").id("first")());
    harness.expect(rendered.texts(harness.container, "panel-count")).toEqual([
      "1 panel(s)",
    ]);

    await api.addComponentPanel("Label", { text: "second" }, panel("dock").id("second")());
    await harness.delay({ frames: 2 });

    harness.capture("png");
    harness.expect(rendered.texts(harness.container, "panel-count")).toEqual([
      "2 panel(s)",
    ]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render withHeaderActions(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="the theme class follows the theme prop"
  body={async (harness) => {
    const pocket = harness.set(new Restyled());
    await harness.definition("api");

    harness.expect(themeNames(harness.container)).toEqual([
      "dockview-theme-dark",
    ]);

    pocket.theme = "dracula";
    await harness.delay({ frames: 2 });

    harness.expect(themeNames(harness.container)).toEqual([
      "dockview-theme-dracula",
    ]);
  }}
>
  {#snippet vest(pocket: Restyled)}
    <div style:width="100%" style:height="100%">
      <DockView
        theme={pocket.theme}
        components={{ Label: DockLabel }}
        onReady={pocket.ready}
      />
    </div>
  {/snippet}
</Sweater>

<Sweater
  name="the theme prop also takes a theme object"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel("Label", { text: "first" });

    harness.expect(themeNames(harness.container)).toEqual([
      handRolled.className,
    ]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    <div style:width="100%" style:height="100%">
      <DockView
        theme={handRolled}
        components={{ Label: DockLabel }}
        onReady={pocket.ready}
      />
    </div>
  {/snippet}
</Sweater>

<Sweater
  name="a tab group chip renders for the group it labels"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    const { panel } = await api.addComponentPanel("Label", { text: "first" });
    intoTabGroup(api, panel, "work");
    await harness.delay({ frames: 2 });

    harness.capture("png");
    harness.expect(rendered.texts(harness.container, "chip")).toEqual([
      "chip for work",
    ]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    <div style:width="100%" style:height="100%">
      <DockView
        theme="dark"
        components={{ Label: DockLabel }}
        tabGroupChip={{ snippet: chip }}
        onReady={pocket.ready}
      />
    </div>
  {/snippet}
</Sweater>

{#snippet chip({ tabGroup }: ITabGroupChipProps)}
  <span data-testid="chip">chip for {tabGroup.label}</span>
{/snippet}

{#snippet tab({ params }: IDockviewPanelHeaderProps<Params>)}
  <span data-testid="tab">snippet tab for {params.text}</span>
{/snippet}

{#snippet watermark(_: IWatermarkPanelProps)}
  <span data-testid="watermark">nothing open</span>
{/snippet}

{#snippet headerActions({ panels }: IDockviewHeaderActionsProps)}
  <span data-testid="panel-count">{panels.length} panel(s)</span>
{/snippet}

{#snippet tabbed(onReady: Pocket["ready"])}
  <div style:width="100%" style:height="100%">
    <DockView
      theme="dark"
      components={{ Label: DockLabel }}
      tabs={{
        components: { Tab: DockTab, Default: DefaultDockTab },
        snippets: { tab },
      }}
      {onReady}
    />
  </div>
{/snippet}

{#snippet defaultTabbed(onReady: Pocket["ready"])}
  <div style:width="100%" style:height="100%">
    <DockView
      theme="dark"
      components={{ Label: DockLabel }}
      defaultTab={{ component: DockTab }}
      {onReady}
    />
  </div>
{/snippet}

{#snippet watermarked(onReady: Pocket["ready"])}
  <div style:width="100%" style:height="100%">
    <DockView
      theme="dark"
      components={{ Label: DockLabel }}
      watermark={{ snippet: watermark }}
      {onReady}
    />
  </div>
{/snippet}

{#snippet withHeaderActions(onReady: Pocket["ready"])}
  <div style:width="100%" style:height="100%">
    <DockView
      theme="dark"
      components={{ Label: DockLabel }}
      rightHeaderActions={{ snippet: headerActions }}
      {onReady}
    />
  </div>
{/snippet}

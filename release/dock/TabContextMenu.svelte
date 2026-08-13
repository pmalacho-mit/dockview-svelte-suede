<script lang="ts" module>
  import { createDismissableLayer } from "dockview";
  import type {
    DockviewSpecificComponentConstraint,
    ITabContextMenuProps,
  } from "../utils/index.js";

  /** Where the pointer was when the menu was asked for. */
  export type At = { x: number; y: number };
</script>

<script lang="ts">
  type Props = {
    at: At;
    menu: DockviewSpecificComponentConstraint["tabContextMenu"];
    target: ITabContextMenuProps;
  };

  let { at, menu, target }: Props = $props();

  let element = $state<HTMLElement>();

  $effect(() => {
    const layer = createDismissableLayer({
      elements: () => (element ? [element] : []),
      onDismiss: target.close,
    });

    return () => layer.dispose();
  });
</script>

<div
  bind:this={element}
  role="menu"
  tabindex="-1"
  data-dockview-svelte="dockcontextmenu"
  style:position="fixed"
  style:left={`${at.x}px`}
  style:top={`${at.y}px`}
  style:z-index="99"
>
  {#if "component" in menu}
    <menu.component {...target} />
  {:else}
    {@render menu.snippet(target)}
  {/if}
</div>

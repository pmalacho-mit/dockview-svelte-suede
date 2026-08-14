<script lang="ts">
  import type { ITabGroupChipProps } from "../../../release";

  let { tabGroup }: ITabGroupChipProps = $props();

  /**
   * A chip is handed the live tab group, which is a dockview object rather
   * than reactive state, so it follows the group's own events.
   */
  let label = $state(tabGroup.label);
  let color = $state(tabGroup.color);
  let collapsed = $state(tabGroup.collapsed);
  let size = $state(tabGroup.size);

  $effect(() => {
    const read = () => {
      label = tabGroup.label;
      color = tabGroup.color;
      collapsed = tabGroup.collapsed;
      size = tabGroup.size;
    };

    const subscriptions = [
      tabGroup.onDidChange(read),
      tabGroup.onDidPanelChange(read),
      tabGroup.onDidCollapseChange(read),
    ];

    return () => {
      for (const subscription of subscriptions) subscription.dispose();
    };
  });
</script>

<span data-testid="chip" style:--chip-color={color ?? "#7aa2f7"}>
  <span data-testid="chip-label">{label}</span>
  <span data-testid="chip-size">{size}</span>
  {#if collapsed}<span data-testid="chip-collapsed">▸</span>{/if}
</span>

<style>
  span[data-testid="chip"] {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1px 6px;
    border-radius: 8px;
    border: 1px solid var(--chip-color);
    color: var(--chip-color);
    font-size: 11px;
    white-space: nowrap;
  }

  span[data-testid="chip-size"] {
    opacity: 0.7;
  }
</style>

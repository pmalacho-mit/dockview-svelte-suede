<script lang="ts" module>
  import type { IDockviewPanel } from "dockview";
  import type { ITabContextMenuProps } from "../../../release";

  type Ordered = readonly IDockviewPanel[];
  type Select = (panels: Ordered, panel: IDockviewPanel) => Ordered;

  /**
   * Which of a group's ordered panels each "close…" item acts on. Every
   * built-in dockview close item is a selection over the same list.
   */
  const closes = {
    Close: (_, panel) => [panel],
    "Close others": (panels, panel) => panels.filter((it) => it !== panel),
    "Close all": (panels) => panels,
    "Close to the left": (panels, panel) =>
      panels.slice(0, panels.indexOf(panel)),
    "Close to the right": (panels, panel) =>
      panels.slice(panels.indexOf(panel) + 1),
  } as const satisfies Record<string, Select>;
</script>

<script lang="ts">
  let { panel, group, api, close }: ITabContextMenuProps = $props();

  /** Read once per opening: a fresh menu is built on every right-click. */
  const maximized = panel.api.isMaximized();

  const acting = (act: () => void) => () => {
    act();
    close();
  };

  const closing = (select: Select) =>
    acting(() => {
      for (const it of [...select(group.panels, panel)]) it.api.close();
    });

  const maximize = acting(() =>
    maximized ? panel.api.exitMaximized() : panel.api.maximize()
  );

  const float = acting(() => api.addFloatingGroup(panel));

  const popout = acting(() => void api.addPopoutGroup(panel));
</script>

<ul role="menu">
  {#each Object.entries(closes) as [label, select] (label)}
    <li>
      <button type="button" data-testid="menu-item" onclick={closing(select)}>
        {label}
      </button>
    </li>
  {/each}

  <li role="separator"></li>

  <li>
    <button type="button" data-testid="menu-item" onclick={maximize}>
      {maximized ? "Restore" : "Maximize"}
    </button>
  </li>
  <li>
    <button type="button" data-testid="menu-item" onclick={float}>
      Float
    </button>
  </li>
  <li>
    <button type="button" data-testid="menu-item" onclick={popout}>
      Open in a new window
    </button>
  </li>
</ul>

<style>
  ul {
    margin: 0;
    padding: 4px 0;
    list-style: none;
    min-width: 180px;
    border: 1px solid var(--dv-tab-divider-color, #444);
    border-radius: 4px;
    background: var(--dv-group-view-background-color, #1e1e1e);
    color: var(--dv-activegroup-visiblepanel-tab-color, #eee);
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.4);
    font-size: 13px;
  }

  li[role="separator"] {
    height: 1px;
    margin: 4px 0;
    background: var(--dv-tab-divider-color, #444);
  }

  button {
    display: block;
    width: 100%;
    padding: 4px 12px;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  button:hover {
    background: var(--dv-activegroup-visiblepanel-tab-background-color, #333);
  }
</style>

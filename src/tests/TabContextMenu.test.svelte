<script lang="ts" module>
  import { Sweater } from "../../sweater-vest-suede";
  import { DockView, type ViewAPI } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import DockLabel from "./fixtures/DockLabel.svelte";
  import TabMenu from "./fixtures/TabMenu.svelte";
  import { labels, rendered, ViewPocket } from "./support.svelte";

  type Api = ViewAPI<"dock", { Label: typeof DockLabel }>;

  type Pocket = ViewPocket<Api>;

  const named = (id: string) => panel("dock").id(id).title(id)();

  const stacked = async (api: Api, ...texts: string[]) => {
    for (const text of texts)
      await api.addComponentPanel("Label", { text }, named(text));
  };

  /** The tabs are ours to instrument, so a right-click on one is ours to hook. */
  const rightClickTab = (
    container: HTMLElement,
    title: string,
    at?: { x: number; y: number }
  ) => {
    const tab = rendered
      .all(container, "dockview-dv-default-tab")
      .find((it) => it.textContent?.trim().startsWith(title));

    if (!tab) throw new Error(`No tab titled "${title}"`);

    const { left, bottom } = tab.getBoundingClientRect();
    tab.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: at?.x ?? left,
        clientY: at?.y ?? bottom,
      })
    );
  };

  const menuBox = (container: HTMLElement) => {
    const menu = container.querySelector('[data-dockview-svelte="dockcontextmenu"]');
    if (!menu) throw new Error("The context menu is not open");
    return menu.getBoundingClientRect();
  };

  const menuItems = (container: HTMLElement) =>
    rendered.texts(container, "menu-item");

  const clickMenuItem = (container: HTMLElement, label: string) => {
    const item = rendered
      .all(container, "menu-item")
      .find((it) => it.textContent?.trim() === label);

    if (!item) throw new Error(`No menu item labelled "${label}"`);
    item.click();
  };
</script>

<Sweater config category="Tab context menu" orientation="vertical" />

<Sweater
  name="right-clicking a tab opens the menu at the pointer"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await stacked(api, "first", "second", "third");

    rightClickTab(harness.container, "first");
    await harness.delay({ frames: 2 });

    harness.note("every item maps to a public, free api call");
    harness.capture("png");
    harness.expect(menuItems(harness.container)).toEqual([
      "Close",
      "Close others",
      "Close all",
      "Close to the left",
      "Close to the right",
      "Maximize",
      "Float",
      "Open in a new window",
    ]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="close others keeps the panel the menu was opened from"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await stacked(api, "first", "second", "third");

    rightClickTab(harness.container, "first");
    await harness.delay({ frames: 2 });
    clickMenuItem(harness.container, "Close others");
    await harness.delay({ frames: 2 });

    harness.expect(api.panels.map(({ id }) => id)).toEqual(["first"]);
    harness.expect(labels(harness.container)).toEqual(["first"]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="close to the right leaves the panels before it"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await stacked(api, "first", "second", "third");

    rightClickTab(harness.container, "second");
    await harness.delay({ frames: 2 });
    clickMenuItem(harness.container, "Close to the right");
    await harness.delay({ frames: 2 });

    harness.expect(api.panels.map(({ id }) => id)).toEqual(["first", "second"]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="the menu maximizes the group its panel belongs to"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await stacked(api, "first");
    await api.addComponentPanel(
      "Label",
      { text: "beside" },
      panel("dock").id("beside").title("beside").direction("right")()
    );

    rightClickTab(harness.container, "first");
    await harness.delay({ frames: 2 });
    clickMenuItem(harness.container, "Maximize");
    await harness.delay({ frames: 2 });

    harness.capture("png");
    harness.expect(api.hasMaximizedGroup()).toBe(true);
    harness.expect(api.getPanel("first")?.api.group.api.isMaximized()).toBe(
      true
    );
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="the menu is dismissed by Escape"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await stacked(api, "first");

    rightClickTab(harness.container, "first");
    await harness.delay({ frames: 2 });
    harness.expect(menuItems(harness.container)).not.toEqual([]);

    await harness.withUserFocus(async (user) => {
      await user.keyboard("{Escape}");
    });
    await harness.delay({ frames: 2 });

    harness.expect(menuItems(harness.container)).toEqual([]);
    harness.expect(api.panels).toHaveLength(1);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="a menu asked for near an edge opens back from it"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await stacked(api, "first");

    const corner = { x: window.innerWidth - 2, y: window.innerHeight - 2 };
    rightClickTab(harness.container, "first", corner);
    await harness.delay({ frames: 2 });

    const box = menuBox(harness.container);

    harness.note("the pointer was 2px from the bottom-right corner");
    harness.expect(box.right).toBeLessThanOrEqual(window.innerWidth);
    harness.expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

{#snippet dock(onReady: Pocket["ready"])}
  <div style:width="100%" style:height="100%">
    <DockView
      theme="dark"
      components={{ Label: DockLabel }}
      tabContextMenu={{ component: TabMenu }}
      {onReady}
    />
  </div>
{/snippet}

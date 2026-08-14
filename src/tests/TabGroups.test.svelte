<script lang="ts" module>
  import type { ITabGroup } from "dockview";
  import { Sweater } from "../../sweater-vest-suede";
  import { DockView, type ViewAPI } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import DockLabel from "./fixtures/DockLabel.svelte";
  import TabGroupChip from "./fixtures/TabGroupChip.svelte";
  import { rendered, ViewPocket } from "./support.svelte";

  type Api = ViewAPI<"dock", { Label: typeof DockLabel }>;

  const colors = ["#7aa2f7", "#9ece6a", "#f7768e"];

  /**
   * The whole tab group api is free and arrives with the upgrade; the only
   * thing this library adds is the chip renderer. These are the calls the
   * buttons below make.
   */
  class Grouped extends ViewPocket<Api> {
    tabGroup = $state.raw<ITabGroup>();
    private color = 0;

    add = async (text: string) => {
      const { api } = this;
      await api?.addComponentPanel(
        "Label",
        { text },
        panel("dock").id(text).title(text)()
      );
    };

    group = (label: string) => {
      const { api } = this;
      const [first, ...rest] = api?.panels ?? [];
      if (!first) return;

      const groupId = first.api.group.id;
      const tabGroup = api!.createTabGroup({ groupId, label });

      for (const it of [first, ...rest])
        api!.addPanelToTabGroup({
          groupId,
          tabGroupId: tabGroup.id,
          panelId: it.id,
        });

      this.tabGroup = tabGroup;
    };

    rename = (label: string) => this.tabGroup?.setLabel(label);

    recolor = () => this.tabGroup?.setColor(colors[++this.color % colors.length]);

    toggle = () => this.tabGroup?.toggle();
  }

  const click = (container: HTMLElement, testId: string) =>
    rendered.only(container, testId).click();

  const chip = (container: HTMLElement) => ({
    label: rendered.texts(container, "chip-label"),
    size: rendered.texts(container, "chip-size"),
    collapsed: rendered.all(container, "chip-collapsed").length > 0,
  });
</script>

<Sweater config category="Tab groups" orientation="vertical" />

<Sweater
  name="a chip renders for the tab group it labels"
  body={async (harness) => {
    const pocket = harness.set(new Grouped());
    await harness.definition("api");

    await pocket.add("readme");
    await pocket.add("changelog");
    click(harness.container, "group");
    await harness.delay({ frames: 2 });

    harness.capture("png");
    harness.expect(chip(harness.container).label).toEqual(["Docs"]);
    harness.expect(chip(harness.container).size).toEqual(["2"]);
  }}
>
  {#snippet vest(pocket: Grouped)}
    {@render dock(pocket)}
  {/snippet}
</Sweater>

<Sweater
  name="the chip follows the group it was given"
  body={async (harness) => {
    const pocket = harness.set(new Grouped());
    await harness.definition("api");

    await pocket.add("readme");
    await pocket.add("changelog");
    click(harness.container, "group");
    await harness.delay({ frames: 2 });

    click(harness.container, "rename");
    await harness.delay({ frames: 2 });
    harness.expect(chip(harness.container).label).toEqual(["Notes"]);

    click(harness.container, "toggle");
    await harness.delay({ frames: 2 });

    harness.note("the chip is handed a live tab group, so it follows its events");
    harness.capture("png");
    harness.expect(chip(harness.container).collapsed).toBe(true);
  }}
>
  {#snippet vest(pocket: Grouped)}
    {@render dock(pocket)}
  {/snippet}
</Sweater>

<Sweater
  name="a panel leaves the tab group when it is removed from it"
  body={async (harness) => {
    const pocket = harness.set(new Grouped());
    const { api } = await harness.definition("api");

    await pocket.add("readme");
    await pocket.add("changelog");
    click(harness.container, "group");
    await harness.delay({ frames: 2 });

    api.removePanelFromTabGroup({
      groupId: api.panels[0].api.group.id,
      panelId: "changelog",
    });
    await harness.delay({ frames: 2 });

    harness.expect(chip(harness.container).size).toEqual(["1"]);
    harness.expect(
      api.getTabGroupForPanel({
        groupId: api.panels[0].api.group.id,
        panelId: "readme",
      })?.label
    ).toBe("Docs");
  }}
>
  {#snippet vest(pocket: Grouped)}
    {@render dock(pocket)}
  {/snippet}
</Sweater>

{#snippet dock(pocket: Grouped)}
  <div
    style:display="flex"
    style:flex-direction="column"
    style:width="100%"
    style:height="100%"
  >
    <div class="toolbar">
      <button
        type="button"
        data-testid="add"
        onclick={() => pocket.add(`panel ${(pocket.api?.panels.length ?? 0) + 1}`)}
      >
        Add a panel
      </button>
      <button
        type="button"
        data-testid="group"
        onclick={() => pocket.group("Docs")}
      >
        Group the open tabs
      </button>
      <button
        type="button"
        data-testid="rename"
        onclick={() => pocket.rename("Notes")}
      >
        Rename
      </button>
      <button type="button" data-testid="recolor" onclick={pocket.recolor}>
        Recolor
      </button>
      <button type="button" data-testid="toggle" onclick={pocket.toggle}>
        Collapse / expand
      </button>
    </div>

    <div style:flex="1" style:min-height="0">
      <DockView
        theme="dark"
        components={{ Label: DockLabel }}
        tabGroupChip={{ component: TabGroupChip }}
        onReady={pocket.ready}
      />
    </div>
  </div>
{/snippet}

<style>
  .toolbar {
    display: flex;
    gap: 6px;
    padding: 6px;
    background: #1a1a1a;
    border-bottom: 1px solid #333;
  }

  .toolbar button {
    padding: 3px 8px;
    border: 1px solid #444;
    border-radius: 3px;
    background: #262626;
    color: #ddd;
    font-size: 12px;
    cursor: pointer;
  }

  .toolbar button:hover:not(:disabled) {
    background: #333;
  }
</style>

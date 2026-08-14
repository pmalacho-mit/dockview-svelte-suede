<script lang="ts" module>
  import type { Snippet } from "svelte";
  import { Sweater } from "../../sweater-vest-suede";
  import { DockView, type PanelProps, type ViewAPI } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import { type Params } from "./fixtures/Label.svelte";
  import DockLabel from "./fixtures/DockLabel.svelte";
  import DockCounter from "./fixtures/DockCounter.svelte";
  import DockNested from "./fixtures/DockNested.svelte";
  import { labels, rendered, ViewPocket } from "./support.svelte";

  type Api = ViewAPI<
    "dock",
    {
      Label: typeof DockLabel;
      Counter: typeof DockCounter;
      Nested: typeof DockNested;
      label: Snippet<[PanelProps<"dock", Params>]>;
    }
  >;

  type Pocket = ViewPocket<Api>;

  class Renamed extends ViewPocket<Api> {
    text = $state("before");
  }

  const at = (id: string) => panel("dock").id(id)();

  const rightOf = (reference: { reference: string }, id: string) =>
    panel("dock").id(id).reference(reference).direction("right")();
</script>

<Sweater config category="DockView" orientation="vertical" />

<Sweater
  name="component panels render their params"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      at("first")
    );
    await api.addComponentPanel(
      "Label",
      { text: "second" },
      rightOf(first, "second")
    );

    harness.capture("png");
    harness.expect(labels(harness.container)).toEqual(["first", "second"]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="snippet panels render their params"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addSnippetPanel("label", { text: "from a snippet" });

    harness.capture("png");
    harness.expect(labels(harness.container)).toEqual(["from a snippet"]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="panels of the same component need distinct ids"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel("Label", { text: "first" });
    const duplicate = api.addComponentPanel("Label", { text: "second" });

    await harness
      .expect(duplicate)
      .rejects.toThrow("panel with id c_Label already exists");
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="panels stacked in one group render only the active tab"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      at("first")
    );
    await api.addComponentPanel("Label", { text: "second" }, at("second"));
    harness.expect(labels(harness.container)).toEqual(["second"]);

    first.panel.api.setActive();
    await harness.delay({ frames: 2 });

    harness.expect(api.groups).toHaveLength(1);
    harness.expect(labels(harness.container)).toEqual(["first"]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="component exports are handed back by addComponentPanel"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    const { exports } = await api.addComponentPanel("Counter", { start: 41 });
    exports.increment();
    await harness.delay({ frames: 2 });

    harness.expect(exports.read()).toBe(42);
    harness
      .expect(rendered.only(harness.container, "count"))
      .toHaveTextContent("42");
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="reactive params keep a mounted panel in sync"
  body={async (harness) => {
    const pocket = harness.set(new Renamed());
    const { api } = await harness.definition("api");

    await api.addComponentPanel("Label", {
      text: api.reactive(() => pocket.text),
    });
    harness.expect(labels(harness.container)).toEqual(["before"]);

    pocket.text = "after";
    await harness.delay({ frames: 2 });

    harness.note(`the panel re-rendered as "${labels(harness.container)}"`);
    harness.expect(labels(harness.container)).toEqual(["after"]);
  }}
>
  {#snippet vest(pocket: Renamed)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="a removed panel stops listening to its reactive params"
  body={async (harness) => {
    const pocket = harness.set(new Renamed());
    const { api } = await harness.definition("api");

    const { panel } = await api.addComponentPanel("Label", {
      text: api.reactive(() => pocket.text),
    });
    api.removePanel(panel);
    pocket.text = "after";
    await harness.delay({ frames: 2 });

    harness.expect(labels(harness.container)).toEqual([]);
    harness.expect(api.panels).toHaveLength(0);
  }}
>
  {#snippet vest(pocket: Renamed)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="the panel builder titles a panel and places it beside another"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      panel("dock").id("first").title("The first one")()
    );
    await api.addComponentPanel(
      "Label",
      { text: "second" },
      rightOf(first, "second")
    );

    const [firstLabel, secondLabel] = rendered.rects(harness.container, "label");

    harness.capture("png");
    harness.expect(api.getPanel("first")?.title).toBe("The first one");
    harness.expect(api.groups).toHaveLength(2);
    harness.expect(firstLabel.left).toBeLessThan(secondLabel.left);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="a reactive param nested inside another param keeps its panel in sync"
  body={async (harness) => {
    const pocket = harness.set(new Renamed());
    const { api } = await harness.definition("api");

    await api.addComponentPanel("Nested", {
      label: { text: api.reactive(() => pocket.text) },
      rows: ["a", "b"],
    });
    harness.expect(labels(harness.container)).toEqual(["before"]);

    pocket.text = "after";
    await harness.delay({ frames: 2 });

    harness.note("dockview merges params one level deep, so the whole `label` is re-sent");
    harness.expect(labels(harness.container)).toEqual(["after"]);
  }}
>
  {#snippet vest(pocket: Renamed)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="a param that did not change is not written again"
  body={async (harness) => {
    const pocket = harness.set(new Renamed());
    const { api } = await harness.definition("api");

    const { exports } = await api.addComponentPanel("Nested", {
      label: { text: api.reactive(() => pocket.text) },
      rows: ["a", "b"],
    });
    harness.expect(exports.rowRenderCount()).toBe(1);

    pocket.text = "after";
    await harness.delay({ frames: 2 });
    pocket.text = "later";
    await harness.delay({ frames: 2 });

    harness.note(
      "`rows` is handed back unchanged on every update; rewriting it would re-proxy it and invalidate its readers"
    );
    harness.expect(labels(harness.container)).toEqual(["later"]);
    harness.expect(exports.rowRenderCount()).toBe(1);
  }}
>
  {#snippet vest(pocket: Renamed)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="one reactive value keeps every panel holding it in sync"
  body={async (harness) => {
    const pocket = harness.set(new Renamed());
    const { api } = await harness.definition("api");

    const shared = api.reactive(() => pocket.text);
    const first = await api.addComponentPanel("Label", { text: shared }, at("first"));
    await api.addComponentPanel("Label", { text: shared }, rightOf(first, "second"));

    pocket.text = "after";
    await harness.delay({ frames: 2 });

    harness.expect(labels(harness.container)).toEqual(["after", "after"]);
  }}
>
  {#snippet vest(pocket: Renamed)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="a reactive value cannot stand in for the whole params object"
  body={async (harness) => {
    const pocket = harness.set(new Renamed());
    const { api } = await harness.definition("api");

    const wrongly = api.reactive(() => ({ text: pocket.text })) as Params;

    await harness
      .expect(api.addComponentPanel("Label", wrongly))
      .rejects.toThrow("wraps a single param value");
  }}
>
  {#snippet vest(pocket: Renamed)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="the panel builder places a panel into an edge group"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    const edge = api.addEdgeGroup("left", {
      id: "activity-bar",
      initialSize: 120,
    });
    await api.addComponentPanel(
      "Label",
      { text: "in the edge" },
      panel("dock").group(edge).id("explorer")()
    );
    await api.addComponentPanel(
      "Label",
      { text: "in the dock" },
      panel("dock").id("main").direction("right")()
    );

    const [edgeLabel, dockLabel] = rendered.rects(harness.container, "label");

    harness.capture("png");
    harness.expect(api.getEdgeGroup("left")?.id).toBe(edge.id);
    harness.expect(api.getPanel("explorer")?.api.group.id).toBe(edge.id);
    harness.expect(edgeLabel.left).toBeLessThan(dockLabel.left);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render dock(pocket.ready)}
  {/snippet}
</Sweater>

{#snippet label({ params }: PanelProps<"dock", Params>)}
  <span data-testid="label">{params.text}</span>
{/snippet}

{#snippet dock(onReady: Pocket["ready"])}
  <div style:width="100%" style:height="100%">
    <DockView
      theme="dark"
      components={{ Label: DockLabel, Counter: DockCounter, Nested: DockNested }}
      snippets={{ label }}
      {onReady}
    />
  </div>
{/snippet}

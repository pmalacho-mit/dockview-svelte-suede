<script lang="ts" module>
  import type { Snippet } from "svelte";
  import { Sweater } from "../../sweater-vest-suede";
  import { SplitView, type PanelProps, type ViewAPI } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import type { Params } from "./fixtures/Label.svelte";
  import SplitLabel from "./fixtures/SplitLabel.svelte";
  import { labels, mounted, ViewPocket } from "./support.svelte";

  type Api = ViewAPI<
    "split",
    {
      Label: typeof SplitLabel;
      label: Snippet<[PanelProps<"split", Params>]>;
    }
  >;

  type Pocket = ViewPocket<Api>;

  const at = (id: string) => panel("split").id(id)();

  const first = (id: string) => panel("split").id(id).index(0)();

  const sized = (id: string, size: number) =>
    panel("split").id(id).size(size)();
</script>

<Sweater config category="SplitView" orientation="vertical" />

<Sweater
  name="component and snippet panels fill the view in order"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel("Label", { text: "first" }, at("first"));
    await api.addSnippetPanel("label", { text: "second" }, at("second"));

    const [left, right] = mounted.rects(harness.container, "split");

    harness.capture("png");
    harness.expect(labels(harness.container)).toEqual(["first", "second"]);
    harness.expect(left.left).toBeLessThan(right.left);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render split(pocket.ready, "HORIZONTAL")}
  {/snippet}
</Sweater>

<Sweater
  name="index puts a panel ahead of its siblings"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel("Label", { text: "second" }, at("second"));
    await api.addComponentPanel("Label", { text: "first" }, first("first"));

    harness.expect(labels(harness.container)).toEqual(["first", "second"]);
    harness.expect(api.panels.map(({ id }) => id)).toEqual([
      "first",
      "second",
    ]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render split(pocket.ready, "HORIZONTAL")}
  {/snippet}
</Sweater>

<Sweater
  name="size decides how much room a panel takes"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel("Label", { text: "first" }, at("first"));
    await api.addComponentPanel("Label", { text: "second" }, sized("second", 150));

    const [, second] = mounted.rects(harness.container, "split");

    harness.expect(Math.round(second.width)).toBe(150);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render split(pocket.ready, "HORIZONTAL")}
  {/snippet}
</Sweater>

<Sweater
  name="a vertical splitview stacks its panels"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel("Label", { text: "first" }, at("first"));
    await api.addComponentPanel("Label", { text: "second" }, at("second"));

    const [above, below] = mounted.rects(harness.container, "split");

    harness.expect(above.top).toBeLessThan(below.top);
    harness.expect(above.left).toBe(below.left);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render split(pocket.ready, "VERTICAL")}
  {/snippet}
</Sweater>

<Sweater
  name="removePanel takes a panel back out of the view"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel("Label", { text: "first" }, at("first"));
    const second = await api.addComponentPanel(
      "Label",
      { text: "second" },
      at("second")
    );

    api.removePanel(second.panel);
    await harness.delay({ frames: 2 });

    harness.expect(api.panels).toHaveLength(1);
    harness.expect(labels(harness.container)).toEqual(["first"]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render split(pocket.ready, "HORIZONTAL")}
  {/snippet}
</Sweater>

{#snippet label({ params }: PanelProps<"split", Params>)}
  <span data-testid="label">{params.text}</span>
{/snippet}

{#snippet split(
  onReady: Pocket["ready"],
  orientation: "HORIZONTAL" | "VERTICAL"
)}
  <div style:width="100%" style:height="100%">
    <SplitView
      {orientation}
      components={{ Label: SplitLabel }}
      snippets={{ label }}
      {onReady}
    />
  </div>
{/snippet}

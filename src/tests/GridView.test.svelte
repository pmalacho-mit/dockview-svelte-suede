<script lang="ts" module>
  import type { Snippet } from "svelte";
  import { Sweater } from "../../sweater-vest-suede";
  import { GridView, type PanelProps, type ViewAPI } from "../../release";
  import { panel } from "../../release/config";
  import { animateEntry, animateExit, animateSize } from "../../release/animate";
  import "../../release/styles/dockview.css";
  import type { Params } from "./fixtures/Label.svelte";
  import GridLabel from "./fixtures/GridLabel.svelte";
  import { labels, mounted, ViewPocket } from "./support.svelte";

  type Api = ViewAPI<
    "grid",
    {
      Label: typeof GridLabel;
      label: Snippet<[PanelProps<"grid", Params>]>;
    }
  >;

  type Pocket = ViewPocket<Api>;

  const at = (id: string) => panel("grid").id(id)();

  const beside = (reference: { reference: string }, id: string) =>
    panel("grid").id(id).reference(reference).direction("right")();

  const beneath = (reference: { reference: string }, id: string) =>
    panel("grid").id(id).reference(reference).direction("below")();

  const widths = (container: HTMLElement) =>
    mounted.rects(container, "grid").map(({ width }) => Math.round(width));

  const animationFinished = (start: (onComplete: () => void) => void) =>
    new Promise<void>((resolve) => start(resolve));
</script>

<Sweater config category="GridView" orientation="vertical" />

<Sweater
  name="component and snippet panels sit side by side"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      at("first")
    );
    await api.addSnippetPanel(
      "label",
      { text: "second" },
      beside(first, "second")
    );

    const [left, right] = mounted.rects(harness.container, "grid");

    harness.capture("png");
    harness.expect(labels(harness.container)).toEqual(["first", "second"]);
    harness.expect(left.left).toBeLessThan(right.left);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render grid(pocket.ready, "HORIZONTAL")}
  {/snippet}
</Sweater>

<Sweater
  name="a vertical grid stacks its panels"
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
      beneath(first, "second")
    );

    const [above, below] = mounted.rects(harness.container, "grid");

    harness.expect(above.top).toBeLessThan(below.top);
    harness.expect(above.left).toBe(below.left);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render grid(pocket.ready, "VERTICAL")}
  {/snippet}
</Sweater>

<Sweater
  name="animateSize settles a panel on its target width"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      at("first")
    );
    const second = await api.addComponentPanel(
      "Label",
      { text: "second" },
      beside(first, "second")
    );

    await animationFinished((onComplete) =>
      animateSize(second.panel, "width", {
        from: 100,
        to: 300,
        duration: 100,
        onComplete,
      })
    );

    harness.expect(second.panel.width).toBe(300);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render grid(pocket.ready, "HORIZONTAL")}
  {/snippet}
</Sweater>

<Sweater
  name="animateEntry settles the arriving panel on an equal share"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      at("first")
    );
    const second = await api.addComponentPanel(
      "Label",
      { text: "second" },
      beside(first, "second")
    );
    const third = await api.addComponentPanel(
      "Label",
      { text: "third" },
      beside(second, "third")
    );

    const share = api.width / api.panels.length;
    animateEntry(api, third.panel);
    await harness.delay({ milliseconds: 700 });

    harness.capture("png");
    harness.expect(third.panel.width).toBeCloseTo(share, 0);
    harness.expect(Math.min(...widths(harness.container))).toBeGreaterThan(0);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render grid(pocket.ready, "HORIZONTAL")}
  {/snippet}
</Sweater>

<Sweater
  name="animateExit removes the panel it collapses"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      at("first")
    );
    const second = await api.addComponentPanel(
      "Label",
      { text: "second" },
      beside(first, "second")
    );

    await animationFinished((onComplete) =>
      animateExit(api, second.panel, onComplete)
    );
    await harness.delay({ frames: 2 });

    harness.expect(api.panels).toHaveLength(1);
    harness.expect(labels(harness.container)).toEqual(["first"]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render grid(pocket.ready, "HORIZONTAL")}
  {/snippet}
</Sweater>

{#snippet label({ params }: PanelProps<"grid", Params>)}
  <span data-testid="label">{params.text}</span>
{/snippet}

{#snippet grid(
  onReady: Pocket["ready"],
  orientation: "HORIZONTAL" | "VERTICAL"
)}
  <div style:width="100%" style:height="100%">
    <GridView
      {orientation}
      components={{ Label: GridLabel }}
      snippets={{ label }}
      {onReady}
    />
  </div>
{/snippet}

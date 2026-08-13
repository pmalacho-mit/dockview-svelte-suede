<script lang="ts" module>
  import type { Snippet } from "svelte";
  import { Sweater } from "../../sweater-vest-suede";
  import { PaneView, type PanelProps, type ViewAPI } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import type { Params } from "./fixtures/Label.svelte";
  import PaneLabel from "./fixtures/PaneLabel.svelte";
  import PaneHeader from "./fixtures/PaneHeader.svelte";
  import { labels, mounted, rendered, ViewPocket } from "./support.svelte";

  type Api = ViewAPI<
    "pane",
    {
      Label: typeof PaneLabel;
      label: Snippet<[PanelProps<"pane", Params>]>;
    }
  >;

  type Pocket = ViewPocket<Api>;

  const titled = (id: string, title: string) =>
    panel("pane").id(id).title(title)();

  const expanded = (id: string, title: string) =>
    panel("pane").id(id).title(title).isExpanded(true)();

  const headed = (id: string, title: string, headerComponent: string) =>
    panel("pane").id(id).title(title).headerComponent(headerComponent)();

  const bodyHeights = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLElement>(".dv-pane-body")).map(
      (body) => Math.round(body.getBoundingClientRect().height)
    );
</script>

<Sweater config category="PaneView" orientation="vertical" />

<Sweater
  name="panels stack in the order they are added"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel(
      "Label",
      { text: "first" },
      expanded("first", "First")
    );
    await api.addSnippetPanel(
      "label",
      { text: "second" },
      expanded("second", "Second")
    );

    const [above, below] = mounted.rects(harness.container, "pane");

    harness.capture("png");
    harness.expect(labels(harness.container)).toEqual(["first", "second"]);
    harness.expect(above.top).toBeLessThan(below.top);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render pane(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="the panel title reaches the default header"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel(
      "Label",
      { text: "first" },
      titled("first", "A section")
    );

    harness.expect(harness.container.textContent).toContain("A section");
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render pane(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="a header component renders in place of the default header"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel(
      "Label",
      { text: "first" },
      headed("first", "A section", "Header")
    );

    harness.capture("png");
    harness.expect(rendered.texts(harness.container, "header")).toEqual([
      "A section holds first",
    ]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render pane(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="a header snippet renders in place of the default header"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    await api.addComponentPanel(
      "Label",
      { text: "first" },
      headed("first", "A section", "header")
    );

    harness.expect(rendered.texts(harness.container, "header")).toEqual([
      "snippet header for A section",
    ]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render pane(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="a panel arrives collapsed unless it asks to be expanded"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      titled("first", "First")
    );

    harness.expect(first.panel.api.isExpanded).toBe(false);
    harness.expect(bodyHeights(harness.container)).toEqual([0]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render pane(pocket.ready)}
  {/snippet}
</Sweater>

<Sweater
  name="collapsing a panel closes its body"
  body={async (harness) => {
    harness.set(new ViewPocket<Api>());
    const { api } = await harness.definition("api");

    const first = await api.addComponentPanel(
      "Label",
      { text: "first" },
      expanded("first", "First")
    );
    harness.expect(bodyHeights(harness.container)[0]).toBeGreaterThan(0);

    first.panel.api.setExpanded(false);
    await harness.delay({ frames: 2 });

    harness.capture("png");
    harness.expect(first.panel.api.isExpanded).toBe(false);
    harness.expect(bodyHeights(harness.container)).toEqual([0]);
  }}
>
  {#snippet vest(pocket: Pocket)}
    {@render pane(pocket.ready)}
  {/snippet}
</Sweater>

{#snippet label({ params }: PanelProps<"pane", Params>)}
  <span data-testid="label">{params.text}</span>
{/snippet}

{#snippet header({ title }: PanelProps<"pane", Params>)}
  <span data-testid="header">snippet header for {title}</span>
{/snippet}

{#snippet pane(onReady: Pocket["ready"])}
  <div style:width="100%" style:height="100%">
    <PaneView
      components={{ Label: PaneLabel }}
      snippets={{ label }}
      headers={{ components: { Header: PaneHeader }, snippets: { header } }}
      {onReady}
    />
  </div>
{/snippet}

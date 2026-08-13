<script lang="ts" module>
  import { Sweater } from "../../sweater-vest-suede";
  import {
    DockView,
    themes,
    themeOptions,
    type Theme,
    type ViewAPI,
  } from "../../release";
  import { panel } from "../../release/config";
  import "../../release/styles/dockview.css";
  import ThemedLabel from "./fixtures/ThemedLabel.svelte";
  import { labels, themeNames, ViewPocket } from "./support.svelte";

  type Api = ViewAPI<"dock", { Label: typeof ThemedLabel }>;

  type Pocket = ViewPocket<Api>;

  const at = (id: string) => panel("dock").id(id)();

  const rightOf = (reference: { reference: string }, id: string) =>
    panel("dock").id(id).reference(reference).direction("right")();

  /**
   * Two groups, one of them tabbed: enough chrome for a capture to show what a
   * theme does to tabs, sashes, borders and the gap between groups.
   */
  const showcase = async (api: Api) => {
    const first = await api.addComponentPanel(
      "Label",
      { text: "left panel" },
      at("first")
    );
    await api.addComponentPanel(
      "Label",
      { text: "right panel" },
      rightOf(first, "second")
    );
    await api.addComponentPanel(
      "Label",
      { text: "tabbed alongside it" },
      at("third")
    );
  };
</script>

<Sweater config category="Themes" orientation="vertical" />

{#each themeOptions as theme (theme)}
  <Sweater
    name={`the ${theme} theme`}
    id={`theme-${theme}`}
    body={async (harness) => {
      harness.set(new ViewPocket<Api>());
      const { api } = await harness.definition("api");

      await showcase(api);
      harness.capture("png");

      harness.note(`${theme} → .${themes[theme].className}`);
      harness.expect(themeNames(harness.container)).toEqual([
        themes[theme].className,
      ]);
      harness.expect(labels(harness.container)).toEqual([
        "left panel",
        "tabbed alongside it",
      ]);
    }}
  >
    {#snippet vest(pocket: Pocket)}
      {@render dock(pocket.ready, theme)}
    {/snippet}
  </Sweater>
{/each}

{#snippet dock(onReady: Pocket["ready"], theme: Theme)}
  <div style:width="100%" style:height="100%">
    <DockView {theme} components={{ Label: ThemedLabel }} {onReady} />
  </div>
{/snippet}

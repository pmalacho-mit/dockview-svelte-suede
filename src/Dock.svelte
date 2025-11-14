<script lang="ts">
  import {
    DockView,
    themeOptions,
    type PanelProps,
    type ViewsHelper,
  } from "../dist/index";
  import { panel } from "../dist/config";
  import { animateSize } from "../dist/animate";
  import "../dist/styles/dockview.css";
  import Dummy from "./dummy/Wrapped.svelte";

  let name = $state(Math.random().toString(36).substring(2, 15));

  let theme = $state(themeOptions[0]);

  type X = ViewsHelper<{
    dock: {
      type: "dock";
      Dummy: typeof Dummy;
    };
  }>;
</script>

{#snippet x({ params }: PanelProps<"dock", { name: string }>)}
  Hello, {params.name}!!!
{/snippet}

<div style:width="100%" style:height="100%">
  <label for="theme">Theme:</label>

  <select name="theme" id="theme" bind:value={theme}>
    {#each themeOptions as theme}
      <option value={theme}>{theme}</option>
    {/each}
  </select>

  <DockView
    {theme}
    components={{ Dummy }}
    snippets={{ x }}
    tabs={{
      components: {},
      snippets: {},
    }}
    onReady={async ({ api }) => {
      const signal = api.reactive(() => name);
      const first = await api.addComponentPanel(
        "Dummy",
        { name: signal },
        panel("dock").title("first")()
      );

      api.addSnippetPanel("x", { name: signal });

      const second = await api.addComponentPanel(
        "Dummy",
        { name: api.reactive(() => name) },
        panel("dock").reference(first).id("second").direction("left")()
      );

      animateSize(second.panel, "width", {
        from: 100,
        to: 300,
        duration: 2000,
      });

      setInterval(() => {
        name = Math.random().toString(36).substring(2, 15);
      }, 1000);
    }}
  />
</div>

<style>
  :global(body, #app) {
    margin: 0;
    width: 100%;
    height: 100vh;
  }
</style>

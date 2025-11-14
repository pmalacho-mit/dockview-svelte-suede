<script lang="ts">
  import { DockView, themeOptions } from "../dist/index";
  import "../dist/styles/dockview.css";
  import Dummy from "./dummy/Wrapped.svelte";

  let name = $state(Math.random().toString(36).substring(2, 15));

  let theme = $state(themeOptions[0]);
</script>

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
    snippets={{}}
    onReady={({ api }) => {
      api.addComponentPanel("Dummy", { name: api.signal(() => name) });
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

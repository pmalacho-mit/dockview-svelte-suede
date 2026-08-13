<script lang="ts">
  import type { PanelProps } from "../../../release";
  import Label, { type Params } from "./Label.svelte";

  let { params }: PanelProps<"dock", Params> = $props();
</script>

<div class="content">
  <Label {...params} />
</div>

<style>
  /** The theme's variables resolve here, inside the themed subtree. */
  .content {
    height: 100%;
    padding: 8px;
    box-sizing: border-box;
    color: var(--dv-activegroup-visiblepanel-tab-color);
    background-color: var(--dv-group-view-background-color);
  }
</style>

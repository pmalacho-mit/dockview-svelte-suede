<script lang="ts">
  import type { IDockviewPanelHeaderProps } from "dockview";
  import type { Params } from "./Label.svelte";

  let { params, tabLocation }: IDockviewPanelHeaderProps<Params> = $props();
</script>

<span data-testid="tab">tab for {params.text}</span>
<span data-testid="tab-location">{tabLocation}</span>

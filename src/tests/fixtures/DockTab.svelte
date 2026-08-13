<script lang="ts">
  import type { IDockviewPanelHeaderProps } from "dockview-core";
  import type { Params } from "./Label.svelte";

  let { params }: IDockviewPanelHeaderProps<Params> = $props();
</script>

<span data-testid="tab">tab for {params.text}</span>

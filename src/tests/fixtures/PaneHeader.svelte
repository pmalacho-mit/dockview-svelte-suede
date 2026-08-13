<script lang="ts">
  import type { PanelProps } from "../../../release";
  import type { Params } from "./Label.svelte";

  let { title, params }: PanelProps<"pane", Params> = $props();
</script>

<span data-testid="header">{title} holds {params.text}</span>

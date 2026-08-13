<script lang="ts">
  import type { PanelProps } from "../../../release";
  import Label, { type Params } from "./Label.svelte";

  let { params }: PanelProps<"pane", Params> = $props();
</script>

<Label {...params} />

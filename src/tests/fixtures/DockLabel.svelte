<script lang="ts">
  import type { PanelProps } from "../../../release";
  import Label, { type Params } from "./Label.svelte";

  let { params }: PanelProps<"dock", Params> = $props();
</script>

<Label {...params} />

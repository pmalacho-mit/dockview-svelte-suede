<script lang="ts">
  import type { PanelProps } from "../../release";
  import Dummy, { type Props } from "./Component.svelte";

  let { params }: PanelProps<"dock", Props> = $props();
</script>

<Dummy {...params} />

<script lang="ts" module>
  export type Params = { label: { text: string }; rows: string[] };
</script>

<script lang="ts">
  import { untrack } from "svelte";
  import type { PanelProps } from "../../../release";

  let { params }: PanelProps<"dock", Params> = $props();

  /** How many times the panel has been handed a different `rows`. */
  let rowRenders = $state(0);

  $effect(() => {
    params.rows;
    untrack(() => rowRenders++);
  });

  export const rowRenderCount = () => rowRenders;
</script>

<span data-testid="label">{params.label.text}</span>
<span data-testid="rows">{params.rows.join(",")}</span>

<script lang="ts" module>
  export type Params = { start: number };
</script>

<script lang="ts">
  import type { PanelProps } from "../../../release";

  let { params }: PanelProps<"dock", Params> = $props();

  let count = $state(params.start);

  export const increment = () => count++;
  export const read = () => count;
</script>

<span data-testid="count">{count}</span>

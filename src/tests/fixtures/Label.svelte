<script lang="ts" module>
  export type Params = { text: string };
</script>

<script lang="ts">
  let { text }: Params = $props();
</script>

<span data-testid="label">{text}</span>

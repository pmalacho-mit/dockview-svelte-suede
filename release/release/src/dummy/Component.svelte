<script lang="ts" module>
  export type Props = { name: string };
</script>

<script lang="ts">
  let { name }: Props = $props();
</script>

Hello, {name}!

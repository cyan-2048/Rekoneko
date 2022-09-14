<script>
  import "./assets/global.css"; // importing it will make terser be able to minify it
  import { settings } from "./lib/shared";
  import Home from "./routes/Home.svelte";
  import Loading from "./routes/Loading.svelte";

  let done = false;
</script>

{#if !done}
  <Loading bind:done />
{:else}
  <Home />
{/if}

<style>
</style>

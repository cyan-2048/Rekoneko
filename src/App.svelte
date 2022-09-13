<script>
  import "./assets/global.css"; // importing it will make terser be able to minify it
  import { settings } from "./lib/shared";
  import Home from "./routes/Home.svelte";
</script>

<main>
  {#await settings.init}
    <p>Loading Settings...</p>
  {:then}
    <Home />
  {/await}
</main>

<style>
</style>

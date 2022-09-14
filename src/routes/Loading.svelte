<script>
  import { onMount } from "svelte";
  import { delay, testInternet } from "../lib/helper";
  import { settings } from "../lib/shared";
  import { login } from "./stores";

  export let done = false;
  let status = "Loading...";

  onMount(async () => {
    status = "Loading Settings...";
    await settings.init;
    await delay(1000);
    status = "Checking Internet...";
    let internet = false;

    while (internet === false) {
      internet = await testInternet($settings.devmode);
    }

    await delay(1000);

    if ($settings.refresh_token) {
      status = "Logging in...";
      await login();
    }

    status = "Done!!!";
    await delay(2000);
    done = true;
  });
</script>

<main>
  <div>
    <img src="/icons/bongocat.gif" alt="bongocat" />
    <div>{status}</div>
  </div>
</main>

<style>
  main {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    background-color: white;
  }
  img {
    width: 100vw;
    height: 100vw;
    text-align: center;
    display: block;
    line-height: 100vw;
  }
  main > div {
    width: 100vw;
    height: 100vh;
  }
  div > div {
    text-align: center;
    font-weight: 600;
    font-size: 16px;
  }
</style>

<script>
  import { reddit } from "./stores";
  import Reddit from "../lib/Reddit";
  import * as __shared from "../lib/shared";
  import { settings } from "../lib/shared";
  import { client_id } from "../lib/config.json";
  import { testInternet } from "../lib/helper";

  window.changeSettings = (obj) => ($settings = { ...$settings, ...obj });

  async function login() {
    await settings.init;

    let internet = false;

    while (internet === false) {
      internet = await testInternet($settings.devmode);
    }

    const { hash: state, last_token, refresh_token, devmode: debug } = $settings;
    const _reddit = new Reddit({ client_id, state, last_token, refresh_token, debug });
    $reddit = _reddit;
    _reddit.on("token", ({ detail }) => {
      const { refresh_token, ...last_token } = detail;
      if (refresh_token) {
        $settings.refresh_token = refresh_token;
      }
      $settings.last_token = last_token;
    });
    if ($settings.devmode) {
      define("dev:shared", __shared);
      define("dev:Reddit", _reddit);
    }
    await _reddit.login();
  }
</script>

{#if $reddit === null}
  <button on:click={login}> Login </button>{/if}

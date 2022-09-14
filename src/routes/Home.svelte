<script>
  import { loggedIn, login, logout, reddit } from "./stores";
  import { settings } from "../lib/shared";

  window.changeSettings = (obj) => ($settings = { ...$settings, ...obj });

  let login_busy = false;
  let logout_busy = false;
</script>

{#if !$loggedIn}
  <button
    disabled={login_busy}
    on:click={async function () {
      login_busy = true;
      await login();
      login_busy = false;
    }}>{login_busy ? "Loading..." : "Login"}</button
  >
{:else}
  <button
    disabled={logout_busy}
    on:click={async function () {
      logout_busy = true;
      await logout();
      logout_busy = false;
    }}>{logout_busy ? "Loading..." : "Logout"}</button
  >
{/if}

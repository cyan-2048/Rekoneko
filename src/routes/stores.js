import { get, writable } from "svelte/store";
import Reddit from "../lib/Reddit";
import * as __shared from "../lib/shared";
import { settings, resetTokens } from "../lib/shared";
import { client_id } from "../lib/config.json";

export const loggedOut = new Reddit({ loggedOut: true });

export const loggedIn = writable(false);

export const reddit = writable(loggedOut);

let destroy_reddit = () => {};
let _reddit = null;

export async function login() {
  destroy_reddit();

  const { hash: state, last_token, refresh_token, devmode: debug } = get(settings);
  _reddit = new Reddit({ client_id, state, last_token, refresh_token, debug });

  reddit.set(_reddit);

  const cb = ({ detail }) => {
    const { refresh_token, ...last_token } = detail;
    const { assign } = Object;
    if (refresh_token) {
      settings.update((obj) => assign(obj, { refresh_token }));
    }
    settings.update((obj) => assign(obj, { last_token }));
  };

  _reddit.on("token", cb);
  destroy_reddit = () => _reddit.off("token", cb);

  if (debug) {
    define("dev:shared", __shared);
    define("dev:reddit", _reddit);
  }

  try {
    await _reddit.login();
    loggedIn.set(true);
  } catch (xhr) {
    if (xhr?.status >= 400) {
      console.error(xhr);
    }
  }
}

export async function logout() {
  destroy_reddit();
  try {
    const _reddit = get(reddit);
    if (_reddit !== loggedOut) {
      await _reddit.logout();
    }
  } catch (e) {}
  resetTokens();
  loggedIn.set(false);
  reddit.set(loggedOut);
}

import localforage from "localforage";
import { writable } from "svelte/store";
import { hashCode } from "./helper";

function writableLF(name, defaultValue, checkUpdate = false, instance = null) {
  if (!instance) instance = localforage;
  let fromStorage = null;
  function _check() {
    if (fromStorage) {
      for (const key in defaultValue) {
        if (!(key in fromStorage)) {
          fromStorage[key] = defaultValue[key];
        }
      }
      for (const key in fromStorage) {
        if (!(key in defaultValue)) {
          delete fromStorage[key];
        }
      }
      instance.setItem(name, fromStorage);
      return fromStorage;
    } else {
      return { ...defaultValue };
    }
  }

  const _writable = writable(null);

  const init = (async () => {
    fromStorage = await instance.getItem(name);
    _writable.set((checkUpdate ? _check() : fromStorage) || defaultValue);
    _writable.subscribe((n) => {
      instance.setItem(name, n);
    });
  })();

  return { ..._writable, init };
}

export const settings = writableLF(
  "settings",
  {
    notification_interval: 1,
    show_notifications: true,
    last_token: null,
    refresh_token: null,
    hash: generateHash(),
    devmode: !PRODUCTION,
  },
  true
);

function generateHash(returnHash = false) {
  return hashCode(navigator.userAgent) + hashCode(Math.floor(Math.random() * 69420));
}

export function resetTokens() {
  settings.update((obj) => ({ ...obj, refresh_token: null, last_token: null, hash: generateHash() }));
}

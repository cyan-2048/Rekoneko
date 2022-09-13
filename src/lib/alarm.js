import { get } from "svelte/store";
import { settings } from "./shared";
import main from "../main";

let loaded = false;

export default async function () {
  if (loaded) return;
  await settings.init;

  let wakelock = null;

  navigator.mozSetMessageHandler("alarm", function (mozAlarm) {
    wakelock = navigator.requestWakeLock("cpu");
    const notif = new Notification("hewo there", { silent: true, icon: "/favicon.png" });
    const { hash, show_notifications: notify } = get(settings);
    if (notify && mozAlarm.data.id === hash) {
      console.error("same hash!");
    }
    notif.onclick = function () {
      navigator.mozApps.getSelf().onsuccess = function () {
        if (document.visibilityState === "hidden" && document.body.childElementCount === 0) main();
        this.result.launch();
      };
    };
    wakelock.unlock();
    wakelock = null;
  });

  loaded = true;
}

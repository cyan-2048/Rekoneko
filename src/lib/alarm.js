import { get } from "svelte/store";
import { settings } from "./shared";
import main from "../main";

export default async function () {
  await settings.init;

  let notify = false;

  settings.subscribe(({ show_notifications }) => {
    notify = show_notifications;
  });

  const appHash = get(settings).hash;

  let wakelock = null;

  navigator.mozSetMessageHandler("alarm", function (mozAlarm) {
    wakelock = navigator.requestWakeLock("cpu");
    const notif = new Notification("hewo there" + !!document.body, { silent: true, icon: "/favicon.png" });
    if (notify && mozAlarm.data.id === appHash) {
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
}

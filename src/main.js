import App from "./App.svelte";
import alarm from "./lib/alarm";

export default (async function () {
  PRODUCTION && alarm();

  if (document.visibilityState !== "visible") return;

  new App({ target: document.body });
  /*
  if (PRODUCTION) {
    const notif = new Notification("title", {
      tag: "playback",
      body: "body",
      icon: "/favicon.png",
      silent: true,
      renotify: false,
    });
    notif.onclick = function () {
      if (navigator.mozApps?.getSelf)
        navigator.mozApps.getSelf().onsuccess = function () {
          this.result.launch();
        };
      notif.close();
    };
  }
  */
});

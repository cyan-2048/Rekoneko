import App from "./App.svelte";

export default (async function () {
  new App({ target: document.body });

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
});

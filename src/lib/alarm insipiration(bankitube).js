var checkingSubs = false,
  su = null,
  cpuWakelock = null,
  startupWhileCheckingCheck = null,
  alarmUniqueIdent = "BankiTube ~ Sekibanki's flying head watching videos";

function pageIsVisibleFromStartup() {
  return window.innerWidth !== 0;
}

navigator.mozSetMessageHandler("alarm", function (mozAlarm) {
  if (mozAlarm.data.application === alarmUniqueIdent) {
    console.log("recieved alarm.");

    var alarmDone = () => {
      if (
        /* check subscriptions if
         * the setting for foreground check is enabled and the app is running, or
         * the app is not running, or
         * the document is hidden (in the background),
         * AND we are online
         */

        ((getSettingValue("notification-check-while-app-running") === 1 && sessionStorage.getItem("apprunning")) ||
          !sessionStorage.getItem("apprunning") ||
          document.visibilityState === "hidden") &&
        navigator.onLine
      ) {
        var checkingNotif = null;

        if (getSettingValue("notification-checking-subscriptions") === 1) {
          checkingNotif = new Notification(
            //channelsUpdated.length,
            i18n("notification-checking"),
            {
              icon: ["/img/icon/112.png", "/img/bankihead.png", "/img/channel-with-shadow.png", ""][
                getSettingValue("notification-icon")
              ],
              silent: true,
            }
          );
        }

        cpuWakelock = navigator.requestWakeLock("cpu");

        checkingSubs = true;

        var subscriptionsTimes = {};

        channelSubscriptions
          .iterate((t, k) => {
            subscriptionsTimes[k] = t;
          })
          .then(() => {
            getLatestFromSubscriptions(
              (d) => {
                //console.log('got the latest subscription updates. (new / old):', d.channelUpdated, subscriptionsTimes);

                checkingSubs = false;
                d = d.channelUpdated;

                var channelsUpdated = [];

                Object.keys(subscriptionsTimes).forEach((k) => {
                  //console.log(k, ' - new/old: ', d[k], subscriptionsTimes[k]);
                  if (k in d) {
                    if (d[k] > subscriptionsTimes[k]) {
                      channelsUpdated.push(k);
                    }
                  }
                });

                //console.log('result:', channelsUpdated);

                var finishFn = () => {
                  if (cpuWakelock) {
                    cpuWakelock.unlock();
                    cpuWakelock = null;
                  }

                  if (checkingNotif) {
                    checkingNotif.close();
                  }

                  if (!sessionStorage.getItem("apprunning")) {
                    window.close();
                  }
                };

                if (channelsUpdated.length !== 0) {
                  channelsUpdated = randomizeArray(channelsUpdated);

                  var chnms = {},
                    nameGetCur = 0,
                    nameGetMax = Math.min(3, channelsUpdated.length),
                    nameGet = () => {
                      mdataStore.getItem(channelsUpdated[nameGetCur]).then((result) => {
                        chnms["n" + nameGetCur] = result.name || i18n("nanashi");
                        if (nameGetCur !== nameGetMax - 1) {
                          nameGetCur++;
                          nameGet();
                        } else {
                          new Notification(i18n("notification-text-title"), {
                            body: i18n("notification-text-body", channelsUpdated.length, chnms),
                            requireInteraction: getSettingValue("notification-display-style") === 1,
                            icon: ["/img/icon/112.png", "/img/bankihead.png", "/img/channel-with-shadow.png", ""][
                              getSettingValue("notification-icon")
                            ],
                          });
                        }

                        finishFn();
                      });
                    }; //end nameGet

                  nameGet();
                } else {
                  //^^ if channelsUpdated.length === 0
                  finishFn();
                }
              },
              emptyFn,
              3
            );
            //console.log('chanellSubscriptions times done.');
          });
      } else {
        if (!sessionStorage.getItem("apprunning")) {
          window.close();
        }
      }
    };

    postAlarm(alarmDone, alarmDone);
  } else {
    if (!sessionStorage.getItem("apprunning") && !checkingSubs) {
      window.close();
    }
  }
});

window.addEventListener("DOMContentLoaded", () => {
  var selLang = getSettingValue("language");
  if (selLang === null) {
    localizationUpdateObjects();
    localizationInit();
    start();
  } else {
    var lpe = ["/common/lang/", ".json"];
    freedatagrab(
      lpe[0] + ["en", "pig-latin", "ru", "ko", "bg", "it", "de"][getSettingValue("language")] + lpe[1],
      (d) => {
        //console.log(d);

        localizationUpdateObjects(d);
        localizationInit();

        startupWhileCheckingCheck = setInterval(() => {
          start();
        }, 500);
        start();
      },
      (e) => {},
      false,
      true
    );
  }

  mdataStoreRmnr();

  window.addEventListener("keydown", (k) => {
    if (keyisnav(k)) {
      k.preventDefault();
    }

    if (appIframe) {
      appIframe.focus();
    }
  });
});

function notifToggle() {
  navigator.mozAlarms.getAll().then((e) => {
    e.forEach((alarm) => {
      navigator.mozAlarms.remove(alarm.id);
    });
    if (getSettingValue("notification-enabled") === 1) {
      postAlarm(emptyFn, emptyFn);
      console.log("notifications enabled.");
    } else {
      console.log("notifications disabled.");
    }
  });
}

function postAlarm(s, f) {
  alarmSet = false;

  var alarmInt = [0.25, 0.5, 1, 2, 4, 6, 12, 24, 48][getSettingValue("notification-check-interval")];

  alarmRq = navigator.mozAlarms.add(
    new Date(new Date().getTime() + 1000 * 60 * 60 * alarmInt),
    //new Date((new Date()).getTime() + (1000 * 60)),
    "ignoreTimezone",
    { application: alarmUniqueIdent }
  );

  alarmRq.onsuccess = function () {
    alarmSet = true;
    s();
  };

  alarmRq.onerror = function () {
    console.log(this.error);
    alarmSet = true;
    f();
  };
}

var appIframe = null;
function start() {
  if (!sessionStorage.getItem("apprunning") && pageIsVisibleFromStartup()) {
    if (startupWhileCheckingCheck !== null) {
      clearInterval(startupWhileCheckingCheck);
    }

    var sif = document.createElement("iframe");
    sif.src = "/settings/index.html#bootup";
    sif.width = window.innerWidth;
    sif.height = window.innerHeight;
    sif.allowFullscreen = true;
    sif.frameBorder = 0;
    document.body.appendChild(sif);

    //due to lazyness i will just set interval this to make sure it is focused
    var focusInt = setInterval(() => {
      sif.focus();
      console.log("focus!!!");
    }, 250);
    setTimeout(() => {
      clearInterval(focusInt);
    }, 2000);
    sif.focus();

    appIframe = sif;

    eid("loading-indicator").remove();

    start = undefined;
  }
}

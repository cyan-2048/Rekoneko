import "./assets/global.css";
import manifest from "./assets/manifest.json";

if (PRODUCTION) {
  new Promise((res) => {
    const { mozApps } = navigator;
    if (!mozApps) return res(null);
    mozApps.getSelf().onsuccess = function () {
      res(this.result);
    };
  }).then((self) => {
    function error(warning) {
      alert(warning);
      window.close();
      throw Error(warning);
    }
    if (self)
      for (const key in manifest) {
        if (typeof manifest[key] === "string" && self.manifest[key] !== manifest[key]) {
          error("cannot guarantee the authenticity of this app, the app will now close!");
        }
      }
    else error("this app is supposed to be used on a KaiOS phone");
  });
}

import localforage from "localforage";
import * as helper from "./lib/helper";
import main from "./main";
import alarm from "./lib/alarm";
import Reddit from "./lib/Reddit";

define("localforage", localforage);
define("helper", Object.assign({}, helper));
define("alarm", alarm);
define("App", main);

define("async", (generator, __arguments = null, __this = this) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => (x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected));
    step((generator = generator.apply(__this, __arguments)).next());
  });
});

define("Reddit", Reddit);

const callback = document.querySelector("head meta[name='callback']")?.content;
if (callback) require(callback)();

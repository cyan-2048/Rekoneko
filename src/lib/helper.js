import { tick } from "svelte";

export const last = (e) => e[e.length - 1];

export async function delay(ms = 1000) {
  return new Promise((res) => setTimeout(res, ms));
}

export { navigate } from "svelte-routing";

export async function back() {
  window.history.back();
  await tick();
}

export function hashCode(string, seed = 0) {
  const str = String(string);
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export function findScrollParent(node) {
  if (node == null) return null;
  if (node.scrollHeight > node.clientHeight) return node;
  else return findScrollParent(node.parentNode);
}

import scrollIntoView from "scroll-into-view";

export async function centerScroll(el, sync) {
  return new Promise((res) => {
    scrollIntoView(el, { time: sync ? 0 : 200, align: { left: 0 }, ease: (e) => e }, (type) =>
      res(type === "complete")
    );
  });
}

/*
export function decimal2rgb(ns, arr) {
	let r = Math.floor(ns / (256 * 256)),
		g = Math.floor(ns / 256) % 256,
		b = ns % 256;
	return arr ? [r, g, b] : { r, g, b };
}
*/

export const toHTML = (text) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }

  return array;
}

export function niceBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function inViewport(element, partial) {
  if (!(element && element instanceof Element)) return null;
  let bounding = element.getBoundingClientRect();
  let height = element.offsetHeight;
  let width = element.offsetWidth;
  return partial
    ? !!(
        bounding.top >= -height &&
        bounding.left >= -width &&
        bounding.right <= window.innerWidth + width &&
        bounding.bottom <= window.innerHeight + height
      )
    : !!(
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        bounding.right <= window.innerWidth &&
        bounding.bottom <= window.innerHeight
      );
}

export function getTopBottom(el) {
  let bounding = el.getBoundingClientRect();
  return {
    top: bounding.top,
    bottom: window.innerHeight - bounding.top - el.offsetHeight,
  };
}

export function getScrollBottom(el) {
  return el.scrollHeight - el.offsetHeight - el.scrollTop;
}

/*
// calculate the outputed color if a color has opacity
// returns a color in hex
export function rgbaToHex(d = [0, 0, 0], b = [0, 0, 0], a = 1) {
	var r = Math.floor(d[0] * a + b[0] * (1 - a));
	var g = Math.floor(d[1] * a + b[1] * (1 - a));
	var b = Math.floor(d[2] * a + b[2] * (1 - a));
	return "#" + ((r << 16) | (g << 8) | b).toString(16);
}
*/

export const decideHeight = (e, size, minus) => {
  if (!e || typeof e !== "object") return {};
  const dataset = { "data-height": e.height, "data-width": e.width };
  let { height, width } = e;
  if (!height || !width) return {};
  if (minus && height - minus > 0 && width - minus > 0) {
    height -= minus;
    width -= minus;
  }
  if ((width || 0) > (size || 203)) {
    return {
      width: size || 203,
      height: (height / width) * (size || 203),
      ...dataset,
    };
  } else return { height, width, ...dataset };
};

/**
 * @param {Blob|File|string} blob
 * @param {string} filename
 */
export async function downloadFile(blob, filename = null) {
  let url;
  if (typeof blob === "string") {
    const xhr = new XMLHttpRequest({ mozAnon: true, mozSystem: true });
    xhr.open("GET", blob, true);
    xhr.responseType = "blob";
    xhr.send();
    const res = await new Promise((res, err) => {
      xhr.onload = () => res(xhr.response);
      xhr.onerror = err;
    });
    if (filename === null) {
      const disposition = xhr.getResponseHeader("Content-Disposition");
      if (disposition && disposition.includes("attachment")) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }
    }
    if (filename === null) {
      return window.open(blob, "_blank");
    }
    blob = res;
    url = URL.createObjectURL(res);
  } else if (blob instanceof Blob) {
    url = URL.createObjectURL(blob);
  } else throw TypeError("argument 1 is not a file or a string");
  const el = document.createElement("a");
  document.body.appendChild(el);
  el.href = url;
  el.download = blob.name || filename || "unknown.bin";
  el.click();
  el.remove();
  delay(5000).then(() => URL.revokeObjectURL(url));
}

export function toDataset(obj) {
  const final = {};
  Object.entries(obj).forEach(([a, b]) => {
    final["data-" + a] = b;
  });
  return final;
}

export function scrollToBottom(el) {
  if (!el) return;
  return (el.scrollTop = el.scrollHeight);
}

export async function xhr(url, options = {}, returnXhr = false) {
  if (typeof options !== "object") options = {};
  const _xhr = new XMLHttpRequest({ mozAnon: true, mozSystem: true });

  _xhr.open(options.method || "GET", url, true);
  _xhr.responseType = options.responseType || "text";

  Object.entries(options.headers || {}).forEach(([a, b]) => {
    if (a && b) _xhr.setRequestHeader(a, b.replace(/\r?\n|\r/g, "")); // nodejs http bug
  });

  _xhr.send(options.body || null);

  return new Promise((res, err) => {
    _xhr.onload = () => res(returnXhr ? _xhr : _xhr.response);
    _xhr.onerror = async (...args) => {
      try {
        console.warn("using cors proxy!", url);
        res(await xhr("https://api.allorigins.win/raw?url=" + encodeURIComponent(url), options, returnXhr));
      } catch (e) {
        err([e, ...args]);
      }
    };
  });
}

export async function testInternet(log = !PRODUCTION) {
  if (!navigator.onLine) {
    await delay(500); // we delay to avoid blocking the main thread
    return false;
  }

  return new Promise((res) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "https://www.redditstatus.com/api/v2/status.json", true);
    xhr.timeout = 5000;

    const start = performance.now();

    const rej = async () => {
      const elapsed = performance.now() - start;
      if (elapsed < 5000) await delay(5000 - elapsed);
      res(false);
    };

    xhr.onload = () => {
      try {
        const { status } = JSON.parse(xhr.responseText);
        log && console.info("Reddit API Status:", status);

        const index = ["none", "minor", "major", "critical"].indexOf(status.indicator);

        if (index === 3) {
          alert("A Reddit API outage occured, the app will now close.\nMore Info: " + JSON.stringify(status));
          window.close();
        }

        res(true);
      } catch (e) {
        rej();
      }
    };

    xhr.onerror = rej;
    xhr.ontimeout = rej;
    xhr.send();
  });
}

export function changeStatusbarColor(color) {
  document.querySelector('head meta[name="theme-color"]')?.setAttribute("content", color);
}

/** https://github.com/aceakash/string-similarity/ */
export function compareTwoStrings(first, second) {
  first = first.replace(/\s+/g, "");
  second = second.replace(/\s+/g, "");

  if (first === second) return 1; // identical or empty
  if (first.length < 2 || second.length < 2) return 0; // if either is a 0-letter or 1-letter string

  let firstBigrams = new Map();
  for (let i = 0; i < first.length - 1; i++) {
    const bigram = first.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1;

    firstBigrams.set(bigram, count);
  }

  let intersectionSize = 0;
  for (let i = 0; i < second.length - 1; i++) {
    const bigram = second.substring(i, i + 2);
    const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0;

    if (count > 0) {
      firstBigrams.set(bigram, count - 1);
      intersectionSize++;
    }
  }

  return (2.0 * intersectionSize) / (first.length + second.length - 2);
}

export async function DOMRequestPromise(DOMRequest) {
  return new Promise((res, err) => {
    if (DOMRequest.readyState !== "pending") {
      res(DOMRequest);
    } else {
      DOMRequest.onsuccess = function () {
        res(this.result);
      };
      DOMRequest.onerror = function () {
        res(this);
      };
    }
  });
}

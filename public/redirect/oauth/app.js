const detail = {};
[...new URLSearchParams(location.search.replace("?", "")).entries()].forEach(([a, b]) => (detail[a] = b));
localStorage.oauth = JSON.stringify(detail);
setTimeout(close, 1500);

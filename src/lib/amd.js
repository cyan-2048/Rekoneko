// yes very cheap implementation, all of the other options seems BS
var require, define;

(() => {
  const map = {};
  define = function (moduleName, value) {
    if (value && moduleName && !(moduleName in map)) map[moduleName] = value;
  };
  require = function (moduleName) {
    return map[moduleName] || null;
  };
})();

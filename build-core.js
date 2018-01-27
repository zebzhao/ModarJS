const fs = require('fs');
require('core-js-builder')({
  modules: ['es6.promise'], // modules / namespaces
  blacklist: [],    // blacklist of modules / namespaces, by default - empty list
  library: false,                // flag for build without global namespace pollution, by default - false
  umd: false                      // use UMD wrapper for export `core` object, by default - true
}).then(function (code) {
  fs.writeFile('src/vendor/core.js', code)
}).catch(function (error) {
  // ...
});
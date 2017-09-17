jQuip Changelog
===============

Here you can see the full list of changes between each ModarJS release.

Version 0.10.0
-----------
- Remove all modules except core, as they were badly written

Version 0.9.3
-----------
- Improved `assert` and `check` call to return `false` if failed

Version 0.9.2
-----------
- Fix multiple `router.refresh` being triggered in 1 frame
- Fix chained promises not working for `whenGET` + et al. responders

Version 0.9.1
-----------
- Fix hotkey module scopes

Version 0.9.0
-----------
- Renamed to jQuip

Version 0.8.0
-----------
- Renamed to ModarJS

Version 0.7.2
-----------
- fixed: `router.query` now saves previous query params (expected behavior)

Version 0.7.1
-----------
- fixed: `pyscript.cache.fetch` not actually caching

Version 0.7.0
-----------
- overhauled Promise implementation to be ES6 compliant
- new es6 promise class, from corejs, accessed with `core.Promise`
- new es6 array polyfill
- removed: `pyscript.async`, `pyscript.list`, `pyscript.dict`
- changed ajax request this binding to be in args
- renamed: `pyscript.defmodule` -> `pyscript.module`
- renamed: `module.initialize` -> `module.require`
- parallel script loading implemented for `module.import`

Version 0.2.5
-----------
- added: `str.split` now mimicks python string split
- changed: `requests.interceptors` must return explicitly false to exit handling of response
- changed: `requests.interceptors` now takes an object which can be for requests as well
- changed: renamed `list.invoke` with `list.map`
- fixed: `requests.upload` can now specify headers
- fixed: `cache.storeFile` should now work with `File` objects
- removed: `str.sprintf`, which wasn't working in previous version
- removed: `requests.beforeRequest`, replaced by `requests.interceptors`

Version 0.2.4
-----------
- deprecated: `str.sprintf` deprecated in favor of `str.format`
- changed: `router.refresh` no longer refreshes page for compatibility with Karma
- changed: router wildcard now requires 'route/*' instead of 'route*'
- changed: `requests.mockSetup` and `router.mockSetup` work better with Karma

Version 0.2.3
-----------
- added `beforeRequest()` to `pyscript.requests`
- fixed: `pyscript.requests.interceptors` now also fire on network error

Version 0.2.2
-----------
- added option to replace external libraries with local ones for testing

Version 0.2.1
-----------
- added mockSetup() and proxy (for window) to router module
- mockSetup() prevents page reload for __Jasmine 2.0__ tests

Version 0.2.0
-----------
- added mockSetup() and mockServer for requests module

Version 0.1.5
-----------
- fixed cache fetch() context object statuses

Version 0.1.4
-----------
- fixed dict get() for falsey values
- fixed cache move(), get() for falsey values
- fixed cache move() from/to same key
- cached cache fetch() promised values to context object

Version 0.1.3
-----------
- `str.js`: Fix bug with replaceLastIndexOf
- Removed `console.log()` from `hotkey.module.js`

Version 0.1.2
-----------
- `hotkey.module.js`: Fix bug not comparing key modifiers correctly due to number -> string conversion
- `hotkey.module.js`: Fix bug allowing lower-case and upper-case characters to be used with addKey
- `hotkey.module.js`: Fix bug with not referencing `_downKeys` properly

PyScript Changelog
===============

Here you can see the full list of changes between each PyScript release.

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

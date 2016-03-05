PyScript Changelog
===============

Here you can see the full list of changes between each PyScript release.

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

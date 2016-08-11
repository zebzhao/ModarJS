# PyScript

[![Build Status](https://travis-ci.org/zebzhao/PyScript.svg?branch=master)](https://travis-ci.org/zebzhao/PyScript)

PyScript is a lightweight script loading library mocking Python modules.

Getting started
---

You have following options to get PyScript:

- Download the [latest release](https://github.com/zebzhao/PyScript/releases/latest)
- Clone the repo, `git clone git://github.com/zebzhao/pyscript.git`.
- Install with [Bower](http://bower.io): ```bower install pyscript```

Table of Contents
---

1. [Defining modules](#defining-modules)
1. [Loading modules](#loading-modules)
1. [Partial module definition](#partial-module-definition)
1. [Initializing modules](#initializing-modules)
1. [Defining Module Methods](#defining-module-methods)
1. [Special Properties](#special-properties)
1. [Standard modules](#standard-modules)
1. [Jasmine Testing Support](#jasmine-testing-support)

Usage
---

Start by including the file in your main HTML file.

For debugging
```html
<script src="pyscript.debug.js" type="text/javascript"></script>
```

For production
```html
<script src="pyscript.min.js" type="text/javascript"></script>
```

## Defining modules

Modules and can contain definitions of functions and variables, also provides entry point after module
dependencies are loaded.

```javascript
pyscript.module('mymodule')
    .import('https://example.com/random.css')
    .import('path/to/file/random.js')
    .require('dependency')
```

To access the module one can use a function call, or access it through a variable:

```javascript
pyscript.module('mymodule')
// which is the same as:
pyscript.modules.mymodule
```

There are also standard modules which can be accessed directly on the `pyscript` object:

```javascript
// List of standard modules included with PyScript
pyscript.requests
pyscript.cache
pyscript.router
pyscript.hotkeys
```

## Loading modules
Modules can be loaded and then initialized. A module can be loaded from by using:

```javascript
pyscript.import(url).then(callback);
```

This will append either a `<script>` or `<link>` tag depending on if a '.js' file is included.
When a module is defined, its `__new__` method is automatically immediately called.
Note that `self` refers to the module (same as `pyscript.module.mymodule` in the case below).

```javascript
pyscript.module('mymodule')
    .__new__(function(self) {
        // Do stuff immediately.
        // ...
    });
```
Note that multiple `__new__` callback functions can be defined, and they will be called in the defined order:

```javascript
pyscript.module('mymodule')
    .__new__(function(self) {
        console.log('I am first')
    })
    .__new__(function(self) {
        console.log('I am second')
    });
```

## Partial module definition

```javascript
// A module defined again will refer to the original defined module.
// This allows module definitions to be split between many files.
pyscript.module('mymodule')
    .__new__(function(self) {
        console.log('I am third')
    });
```

## Initializing modules
After a module is loaded, it needs to be initialized.
Initializing will load all dependencies. The initialization process has 2 steps:

1. Import all files defined by `.import`.
2. After imports are successful, initialize required modules defined by `.require`.

To initialize a module manually:

```javascript
pyscript.module('mymodule');
// This can be called anywhere after the module definition.
pyscript.initialize('mymodule');
```

To initialize a module as a requirement by another module initialization process:

```javascript
pyscript.module('child')
    .import('path/to/modules/mother.js')
    .require('mother');
```

When a module is initialized, its `__init__` method is automatically called.
The `__init__` method(s) are called after dependencies are loaded.

```javascript
pyscript.module('mymodule')
    .__init__(function(self) {
        console.log('I am initialized')
    });
```

Similarly to `__new__`, when defining multiple `__init__` callbacks, they are called in the order of definition.

```javascript
pyscript.module('mymodule')
    .__init__(function(self) {
        self.a = 5;
    })
    .__init__(function(self) {
        self.a++;
        console.log(self.a); // Outputs 6
    });
```

When a module is initialized, its dependencies will be loaded.
```javascript
pyscript.module('mymodule')
    .import('jquery.min.js')
    .import('angular.min.js')
    .import('https://example.com/script.js');

// Dependencies will be loaded asynchronously (all at the same time).
pyscript.initialize('mymodule');
```

An example on requiring modules. In the scenario below that you have 1 module that relies on another module:
```javascript
// Inside mother.module.js
pyscript.module('mother')
    .__init__(function(self) {
        console.log('I will be initialized and loaded FIRST!')
    });

// Inside child.module.js
pyscript.module('child')
    .import('mother.module.js')
    .require('mother')

    .__init__(function(self) {
        console.log('I am initialized AFTER mother.')
    });
```

In the case that your submodule has very large dependencies and needs to be loaded in a future point in time:

```javascript
// Inside bigmodule.module.js
pyscript.module('bigmodule')
    .import('very-large-file.js')
    .__init__(function(self) {
        // do stuff
    });

// Inside mymodule.module.js
pyscript.module('mymodule')
    .import('bigmodule.module.js')
    .require('router')   // Load standard module 'router'
    
    .__init__(function(self) {
        pyscript.router
            .route('bigmodule', function() {
                // Initialize bigmodule when hitting mydomain.com/#bigmodule
                pyscript.initialize('bigmodule');
            });
    });
```

## Defining Module Methods

Methods can be defined in a module in the following way:

```javascript
pyscript.module('mymodule')
    .def({
        testMethod1: function(self, string) {
        }),
        callsMethod1: function(self, string) {
            self.testMethod1(string);
        });
    });
pyscript.modules['mymodule'].callsMethod1('Awesome');
```

Note that the methods are defined on the module instance and injected with a `self` argument.
The `self` argument is a reference to the module singleton instance.

## Special Properties
Additional properties that are defined on top of module instances.

 * `__name__` - name of module defined by `module(name)`
 * `__state__` - `'loading'` or `'loaded'` or `undefined`
 * `__initialized__` - true only when the module has finished initializing
 
Standard modules
---

To use a standard module, you need to first initialize it. Note that standard modules do not need to be loaded as they
are included with PyScript.
```javascript
pyscript.module('mymodule')
    .require('hotkeys')
    .__init__(function(self) {
        pyscript.hotkeys.addKey('ctrl-f', function(e, handler) {
            e.preventDefault(); // Prevents browser default for this shortcut
            console.log('Ctrl-F was pressed!');
        });
    });
```

A list of current standard modules can be found below:

* cache - For caching text on client-side.
* hotkeys - For handling keyboard shortcuts.
* requests - For http methods and uploads with ajax.
* router - For handling client `hashchange` events.

### hotkeys
```javascript
pyscript.hotkeys.addKey('ctrl-f', function(e, handler) {
    e.preventDefault();  // Prevents browser default for this shortcut
    console.log('Ctrl-F was pressed!');
    console.log(handler);  // Contains meta information about the event.
});
```

### requests
```javascript
// Standard get request, with authorization header
pyscript.requests.get('https://example.com/api/user', {Authorization: 'Secret'})
    .then(function(response) {
        console.log('RESPONSE', response.responseText);
    })
// Synchronous call
var xhr = pyscript.requests.post('https://example.com/api/user', {user: 'Steve'}, {'Content-Type': 'application/json'}, true);
console.log(xhr.responseText);
// Uploading files
pyscript.requests.upload('https://example.com/api/user/1/files', fileObjectAPI)
    .then(function(response) {
        console.log(response.responseText);
        if (!response.http.success) {
            return core.Promise.reject('failed');  // ES6 promise library
        }
    });
```

### router
```javascript
pyscript.router
    .route("/route1", function(queryParams) {
        console.log('Route 1:', queryParams);
    })
    .route(["/route2", "/route2-1", "/route2-*"], function(queryParams) {
        console.log('Route 2:', queryParams);
    });
```

Jasmine Testing Support
---
PyScript officially supports Jasmine 2.0 Testing.


### Dependencies
Sometimes you want to use CDNs, but this introduces problems when testing locally on a headless browser.
PyScript solves this issue by letting dynamic replacement of external dependencies with local ones during testing.

Here's an example of how this works:

```javascript
pyscript.prefix = '/home/user/project';  // Tells the headless browser to local path
pyscript.prefix = 'C://path/to/project/folder';  // For Windows

describe('mymodule', function () {
    beforeEach(function(done) {
        var self = this;
        
        // This will replace any scripts loading www.example.com/external.js with /home/user/project/lib/external.js
        pyscript.mockDependencies({
            "www.example.com/external.js": "lib/external.js"
        });
        
        // Wait till module has loaded asynchronously
        pyscript.initialize('mymodule').then(function(mymodule) {
            self.mymodule = mymodule;
            done();
        });
    });
```

### Requests
A fake server with responses can be completely mocked out.

```javascript
describe('mymodule', function () {
    beforeEach(function(done) {
        var self = this;
        // Wait till module has loaded asynchronously
        pyscript.initialize('mymodule').then(function(mymodule) {
            self.mymodule = mymodule;
            done();
        });
    });
    
    // Sets up server routes
    beforeEach(function(done) {
        pyscript.requests
            .whenGET(/www.example.com\/myroute/, function(params, config) {
                return [200, "Raw JSON array"];
            })
            .whenDELETE(/www.example.com\/myroute/, function(params, config) {
                return [200, ""];
            })
            .whenPOST(/www.example.com\/myroute/, function(params, config) {
                return [200, ""];
            });
    });
    
    it('should make server requests', function() {
        this.mymodule.doSomething();
    });
});
```

### Router
If you use Jasmine for hairy unit tests, you may often encounter this message in a large app that uses routing: `Some of your tests did a full page reload!`.
This is sometimes not debuggable as you have no idea where it may be called. Other times it may even be necessary for the page to refresh.

`pyscript.router` solves this problem by providing a `mockSetup()` method in Jasmine testing which allows page reloading to be handled properly.

To redirect the page:

```javascript
// do this
pyscript.module('mymodule')
    .require('router')
    .__init__(function(self) {
        pyscript.router.proxy.setHref("www.example.com/new/location");
    });

// instead of this
pyscript.module('mymodule')
    .require('router')
    .__init__(function(self) {
        window.location.href = "www.example.com/new/location";
    });
```

During tests the following will throw a proper error.
The refresh error can also be fully suppressed and page refreshes will be ignored.

```javascript
describe('mymodule', function () {
    beforeEach(function(done) {
        var self = this;
        // Wait till module has loaded asynchronously
        pyscript.initialize('mymodule').then(function(mymodule) {
            self.mymodule = mymodule;
            done();
        });
    });
    
    it('should not throw page reload error', function() {
        pyscript.router.mockSetup();
        this.mymodule.gotoLocation();  // No error is thrown!
    });
    
    it('should throw error with stack trace', function() {
        pyscript.router.mockSetup(true);
        this.mymodule.gotoLocation();  // Error is thrown on page refresh!
    });
});
```

Developers
---
First of all, install [Node](http://nodejs.org/). We use [Gulp](http://gulpjs.com) to build PyScript. If you haven't used Gulp before, you need to install the `gulp` package as a global install.

```
npm install --global gulp
```

If you haven't done so already, clone the PyScript git repo.

```
git clone git://github.com/zebzhao/pyscript.git
```
Install the Node dependencies.

```
cd pyscript
npm install
```

Run `gulp` to build and minify the release.

```
gulp
gulp build
gulp build-debug
```

The built version of PyScript will be put in the same folder as ```pyscript.min.js``` and ```pyscript.debug.js```.

## Tests

All tests are contained in the `tests` folder. Tests can be run using `npm test`.
This library aims for test 80%+ coverage. Since some functions cannot be tested such as Ajax methods, 100% coverage is not possible.

## Contributing

PyScript follows the [GitFlow branching model](http://nvie.com/posts/a-successful-git-branching-model). The ```master``` branch always reflects a production-ready state while the latest development is taking place in the ```develop``` branch.

Each time you want to work on a fix or a new feature, create a new branch based on the ```develop``` branch: ```git checkout -b BRANCH_NAME develop```. Only pull requests to the ```develop``` branch will be merged.

## Known Issues

In some browsers, when a script HTTP request fails, no error will be thrown. You can tell if a script failed to
load by checking for missing loaded messages in the browser console.

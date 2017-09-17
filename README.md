# jQuip

[![Build Status](https://travis-ci.org/zebzhao/jQuip.svg?branch=master)](https://travis-ci.org/zebzhao/jQuip)

jQuip is a lightweight script loading library.

Getting started
---

You have following options to get the library:

- Download the [latest release](https://github.com/zebzhao/jQuip/releases/latest)
- Clone the repo, `git clone git://github.com/zebzhao/jQuip.git`.
- Install with [Bower](http://bower.io): ```bower install jQuip```

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
<script src="jquip.debug.js" type="text/javascript"></script>
```

For production
```html
<script src="jquip.min.js" type="text/javascript"></script>
```

## Defining modules

Modules and can contain definitions of functions and variables, also provides entry point after module
dependencies are loaded.

```javascript
$Q.module('mymodule')
    .import('https://example.com/random.css')
    .import('path/to/file/random.js')
    .require('dependency')
```

To access the module one can use a function call, or access it through a variable:

```javascript
$Q.module('myModule')
// which is the same as:
$Q.modules.myModule
```

## Loading modules
Modules can be loaded and then initialized. A module can be loaded from by using:

```javascript
$Q.import(url).then(callback);
```

This will append either a `<script>` or `<link>` tag depending on if a '.js' file is included.
When a module is defined, its `__new__` method is automatically immediately called.
Note that `self` refers to the module (same as `$Q.module.mymodule` in the case below).

```javascript
$Q.module('myModule')
    .__new__(function(self) {
        // Do stuff immediately.
        // ...
    });
```
Note that multiple `__new__` callback functions can be defined, and they will be called in the defined order:

```javascript
$Q.module('myModule')
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
$Q.module('mymodule')
    .__new__(function(self) {
        console.log('I am third');
    });
```

## Initializing modules
After a module is loaded, it needs to be initialized.
Initializing will load all dependencies. The initialization process has 2 steps:

1. Import all files defined by `.import`.
2. After imports are successful, initialize required modules defined by `.require`.

To initialize a module manually:

```javascript
$Q.module('myModule');
// This can be called anywhere after the module definition.
$Q.initialize('myModule');
```

To initialize a module as a requirement by another module initialization process:

```javascript
$Q.module('child')
    .import('path/to/modules/mother.js')
    .require('mother');
```

When a module is initialized, its `__init__` method is automatically called.
The `__init__` method(s) are called after dependencies are loaded.

```javascript
$Q.module('mymodule')
    .__init__(function(self) {
        console.log('I am initialized')
    });
```

Similarly to `__new__`, when defining multiple `__init__` callbacks, they are called in the order of definition.

```javascript
$Q.module('mymodule')
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
$Q.module('mymodule')
    .import('jquery.min.js')
    .import('angular.min.js')
    .import('https://example.com/script.js');

// Dependencies will be loaded asynchronously (all at the same time).
$Q.initialize('mymodule');
```

An example on requiring modules. In the scenario below that you have 1 module that relies on another module:

```javascript
// Inside mother.module.js
$Q.module('mother')
    .__init__(function(self) {
        console.log('I will be initialized and loaded FIRST!')
    });

// Inside child.module.js
$Q.module('child')
    .import('mother.module.js')
    .require('mother')

    .__init__(function(self) {
        console.log('I am initialized AFTER mother.')
    });
```

In the case that your submodule has very large dependencies and needs to be loaded in a future point in time:

```javascript
// Inside bigmodule.module.js
$Q.module('bigModule')
    .import('very-large-file.js')
    .__init__(function(self) {
        // do stuff
    });

// Inside mymodule.module.js
$Q.module('myModule')
    .import('bigmodule.module.js')
    
    .__init__(function(self) {
        // Load big module dependencies after 1s
        setTimeout(function() {
            $Q.initialize('bigModule');
        }, 1000);
    });
```

## Defining Module Methods

Methods can be defined in a module in the following way:

```javascript
$Q.module('myModule')
    .def({
        testMethod1: function(self, string) {
        }),
        callsMethod1: function(self, string) {
            self.testMethod1(string);
        });
    });
$Q.modules['mymodule'].callsMethod1('Awesome');
```

Note that the methods are defined on the module instance and injected with a `self` argument.
The `self` argument is a reference to the module singleton instance.

## Special Properties
Additional properties that are defined on top of module instances.

 * `__name__` - name of module defined by `module(name)`
 * `__state__` - `'loading'` or `'loaded'` or `undefined`
 * `__initialized__` - true only when the module has finished initializing
 
Jasmine Testing Support
---
jQuip officially supports Jasmine 2.0 Testing.


### Dependencies
Sometimes you want to use CDNs, but this introduces problems when testing locally on a headless browser.
jQuip solves this issue by letting dynamic replacement of external dependencies with local ones during testing.

Here's an example of how this works:

```javascript
jQuip.prefix = '/home/user/project';  // Tells the headless browser to local path
jQuip.prefix = 'C://path/to/project/folder';  // For Windows

describe('mymodule', function () {
    beforeEach(function(done) {
        var self = this;
        
        // This will replace any scripts loading www.example.com/external.js with /home/user/project/lib/external.js
        $Q.mockDependencies({
            "www.example.com/external.js": "lib/external.js"
        });
        
        // Wait till module has loaded asynchronously
        $Q.initialize('myModule').then(function(myModule) {
            self.myModule = myModule;
            done();
        });
    });
```

Developers
---
First of all, install [Node](http://nodejs.org/). We use [Gulp](http://gulpjs.com) to build jQuip. If you haven't used Gulp before, you need to install the `gulp` package as a global install.

```
npm install --global gulp
```

If you haven't done so already, clone the jQuip git repo.

```
git clone git://github.com/zebzhao/jQuip.git
```
Install the Node dependencies.

```
npm install
```

Run `gulp` to build and minify the release.

```
gulp
gulp build
gulp build-debug
```

The built version will be put in the same folder as ```jquip.min.js``` and ```jquip.debug.js```.

## Tests

All tests are contained in the `tests` folder. Tests can be run using `npm test`.
This library aims for test 80%+ coverage. Since some functions cannot be tested such as Ajax methods, 100% coverage is not possible.

## Contributing

This project follows the [GitFlow branching model](http://nvie.com/posts/a-successful-git-branching-model). The ```master``` branch always reflects a production-ready state while the latest development is taking place in the ```develop``` branch.

Each time you want to work on a fix or a new feature, create a new branch based on the ```develop``` branch: ```git checkout -b BRANCH_NAME develop```. Only pull requests to the ```develop``` branch will be merged.

## Known Issues

In some browsers, when a script HTTP request fails, no error will be thrown. You can tell if a script failed to
load by checking for missing loaded messages in the browser console.

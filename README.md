# PyScript

PyScript is a lightweight and script loading library mocking Python modules.

## Getting started

You have following options to get UIkit:

- Download the [latest release](https://github.com/zebzhao/pyscript/releases/latest)
- Clone the repo, `git clone git://github.com/zebzhao/pyscript.git`.
- Install with [Bower](http://bower.io): ```bower install pyscript```
- Install with [npm](http://npmjs.com): ```npm install pyscript```

## Usage

Start by including the file in your main HTML file.

For debugging
```
<script src="dep/pykit/pykit.debug.js" type="text/javascript"></script>
```

For production
```
<script src="dep/pykit/pykit.min.js" type="text/javascript"></script>
```

### Defining a module

Modules are like python modules and can contain definitions of functions and variables.
```
pyscript.defmodule('mymodule')
```
To access the module one can use a function call, or access it through a variable:
```
pyscript.module('mymodule')
// which is the same as:
pyscript.modules['mymodule']
```
There are also standard modules which can be accessed this way:
```
// List of standard modules included with PyScript
pyscript.requests
pyscript.cache
pyscript.router
```

### Loading modules
Modules can be loaded and then initialized. A module can be loaded from by using:
```
pyscript.import('mymodule')
```
When a module is loaded, its __new__ method is automatically invoked.
```
pyscript.defmodule('mymodule')
    .__new__(function(self) {
        console.log('I am loaded!');
        self.loaded = true;
        // Do stuff when module gets loaded.
        // ...
    });
```
Note that multiple __new__ functions can be defined, and will be invoked in the defined order:
```
pyscript.defmodule('mymodule')
    .__new__(function(self) {
        console.log('I am first')
    })
    .__new__(function(self) {
        console.log('I am second')
    });

// A module defined again will refer to the original defined module.
pyscript.defmodule('mymodule')
    .__new__(function(self) {
        console.log('I am third')
    });
```

### Initializing modules
After a module is loaded, it needs to be initialized. To initialize a module:
```
pyscript.initialize('mymodule')
```
When a module is initialized, its __init__ method is automatically invoked.
Additionally, any dependencies that were defined for the module are also loaded.
```
pyscript.defmodule('mymodule')
    .__init__(function(self) {
        console.log('I am initialized')
    });
```
Similarly, when defining multiple __init__ handlers, the same rules apply as __new__.
```
pyscript.defmodule('mymodule')
    .__init__(function(self) {
        self.a = 5;
    })
    .__init__(function(self) {
        self.a++;
        console.log(self.a); // Outputs 6
    });
```
When a module is initialized, its dependencies will be loaded.
```
pyscript.defmodule('mymodule')
    .import('jquery.min.js')
    .import('angular.min.js')
    .import('https://example.com/script.js');

// Dependencies will be loaded in order, 1 after another.
pyscript.initialize('mymodule');
```

Loading submodules can also be done. In the scenario that you have 1 module that relies on another module:
```
// Inside submodule.module.js
pyscript.defmodule('submodule')
    .__init__(function(self) {
        console.log('I will be initialized and loaded FIRST!')
    });

// Inside mymodule.module.js
pyscript.defmodule('mymodule')
    .import('submodule.module.js')
    .initialize('submodule')  // Also initialize the submodule when this is initialized.

    .__init__(function(self) {
        console.log('I am initialized AFTER submodule.')
    });
```

## Developers

First of all, install [Node](http://nodejs.org/). We use [Gulp](http://gulpjs.com) to build UIkit. If you haven't used Gulp before, you need to install the `gulp` package as a global install.

```
npm install --global gulp
```

If you haven't done so already, clone the UIkit git repo.

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

## Contributing

UIkit follows the [GitFlow branching model](http://nvie.com/posts/a-successful-git-branching-model). The ```master``` branch always reflects a production-ready state while the latest development is taking place in the ```develop``` branch.

Each time you want to work on a fix or a new feature, create a new branch based on the ```develop``` branch: ```git checkout -b BRANCH_NAME develop```. Only pull requests to the ```develop``` branch will be merged.

## Known Issues

In some browsers, if a script HTTP request fails no error will be thrown. You can tell if a script filed to
load by checking for missing loaded messages in the browser console.

# Contributing

**Important:** these GitHub issues are for *bug reports and feature requests only*.

If you’re looking for ways to contribute, please [peruse open issues](https://github.com/zebzhao/pyscript/issues?milestone=&page=1&state=open).

Before submitting a pull request, consider implementing a live example first, say using [bl.ocks.org](http://bl.ocks.org). Real-world use cases go a long way to demonstrating the usefulness of a proposed feature. The more complex a feature’s implementation, the more usefulness it should provide.

## How to Submit a Pull Request

1. Click the “Fork” button to create your personal fork of the ModarJS repository.

2. After cloning your fork of the ModarJS repository in the terminal, run `npm install` to install dependencies.

3. Create a new branch for your new feature. For example: `git checkout -b my-awesome-feature`. A dedicated branch for your pull request means you can develop multiple features at the same time, and ensures that your pull request is stable even if you later decide to develop an unrelated feature.

4. The `pyscript.debug.js` and `pyscript.min.js` files are built from source files in the `src` directory. _Do not edit `pyscript.debug.js` directly._ Instead, edit the source files, and then run gulp to build the generated files.

5. Use `npm test` to run tests and verify your changes. If you are adding a new feature, you should add new tests! If you are changing existing functionality, make sure the existing tests run, or update them as appropriate.

6. Submit your pull request, and good luck!

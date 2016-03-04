window.pyscript = {modules: {}};

pyscript.defer = function(callback) {
    setTimeout(callback, 1);
};

pyscript.range = function(start, stop, step) {
    if (stop === undefined) {
        stop = start;
        start = 0;
    }
    step = step || 1;
    var result = [];
    for (var i=start; i < stop; i += step) {
        result.push(i);
    }
    return result;
};

pyscript.noop = function() {};

pyscript.extend = function(target, source) {
    for (var i in source) {
        if (source.hasOwnProperty(i) && source[i] !== undefined) {
            target[i] = source[i];
        }
    }
    return target;
};

pyscript.type = function(obj) {
    var str = Object.prototype.toString.call(obj);
    return str.toLowerCase().substring(8, str.length-1);
};

pyscript.map = function(func, object) {
    var result, i;
    switch(pyscript.type(object)) {
        case "array":
            result = [];
            for (i=0; i<object.length; i++) {
                result.push(func.call(null, object[i], i));
            }
            break;
        default:
            result = {};
            for (i in object) {
                if (object.hasOwnProperty(i)) {
                    result[i] = func.call(null, object[i], i);
                }
            }
    }
    return result;
};

pyscript.all = function(func, object) {
    for (var i in object) {
        if (object.hasOwnProperty(i)) {
            if (!func.call(null, object[i], i)) {
                return false;
            }
        }
    }
    return true;
};

pyscript.any = function(func, object) {
    for (var i in object) {
        if (object.hasOwnProperty(i)) {
            if (func.call(null, object[i], i)) {
                return true;
            }
        }
    }
    return false;
};

pyscript.partial = function(callback) {
    var args = [].slice.call(arguments).slice(1);  // Remove wrapped function
    return function() {
        var more_args = [].slice.call(arguments);
        return callback.apply(this, args.concat(more_args));
    }
};

pyscript.mockDependencies = function(mapping) {
    pyscript.assert(jasmine, "mockDependencies() must be called from Jasmine testing.");
    spyOn(pyscript, '_getURL').and.callFake(function(url) {
        if (mapping[url]) {
            console.log("%c" + url + " overridden by " + mapping[url], "color:DodgerBlue;");
            return mapping[url];
        }
        else if (url.indexOf("://") != -1) {
            return url;
        }
        else {
            return pyscript.prefix + url;
        }
    });
};

pyscript._getURL = function(url) {
    if (url.indexOf("://"))
        return url;
    else return pyscript.prefix + url;
};

pyscript.import = function(tagName, props, callback) {
    var element = document.createElement(tagName);
    document.head.appendChild(element);
    // Async may not be effective due to ajax protocols and queueing
    element.onload = callback;
    pyscript.extend(element, props);
    return element;
};

pyscript.initialize = function(name) {
    var all_modules = window._py_all_modules = window._py_all_modules || {};
    var mod = all_modules[name];

    if (mod) {
        return mod._initialize();
    }
    else {
        pyscript.assert("Module " + name + " is not defined!")
    }
};

pyscript.module = function(name) {
    var all_modules = window._py_all_modules = window._py_all_modules || {};
    var result = all_modules[name];
    return result ? result._instance : null;
};

pyscript.defmodule = function (name) {
    var instance = {__name__: name, __initialized__: false};
    pyscript.modules[name] = instance;
    var all_modules = window._py_all_modules = window._py_all_modules || {};
    var cached_files = window._py_cached_files = window._py_cached_files || pyscript.dict();

    if (all_modules[name])
        return all_modules[name];

    // Define package in internal package cache
    var self = all_modules[name] = {
        __name__: name,

        _dependencies: [],
        _modules: [],
        _instance: instance,
        _status: "",
        _callbacks: pyscript.list(),

        import: function(url) {
            self._dependencies.push({url: url});
            return self;
        },

        initialize: function(name) {
            self._modules.push(name);
            return self;
        },

        def: function(values) {
            var modified = pyscript.map(function(callable, i) {
                if (pyscript.isFunction(callable)) {
                    return pyscript.partial(callable, instance);
                }
                else pyscript.assert(false, "'" + i + "' cannot be set as a function of '" + name + "'");

            }, values);

            pyscript.extend(instance, modified);

            return self;
        },

        __init__: function(callback) {
            self._callbacks.append(callback);
            return self;
        },
        __new__: function(callback) {
            callback.call(null, instance);
            return self;
        },
        _initialize: function() {
            var async = pyscript.async();

            if (self._status == "loaded") {
                pyscript.defer(function() {async.resolve(instance)});
                return async.promise;
            }
            else if (self._status == "loading") {
                self._callbacks.append(function() {
                    async.resolve(instance);
                });
                return async.promise;
            }
            else if (pyscript.debug) console.log("%c" + name + " loading...", "color:DodgerBlue;");

            self._status = "loading";
            var loaded_count = 0;

            function load_next() {
                var dependencies = self._dependencies;

                if (dependencies.length == loaded_count) {
                    load_next_module();
                }
                else if (loaded_count < dependencies.length) {
                    var url = dependencies[loaded_count].url;
                    if (cached_files[url] !== undefined) {
                        loaded_count++;
                        load_next();
                    }
                    else {
                        cached_files[url] = false;
                        pyscript.import("script", {src: pyscript._getURL(url)},
                            function() {
                                if (pyscript.debug) console.log(url, "loaded");
                                cached_files[url] = true;
                                loaded_count++;
                                load_next();
                            }, true);
                    }
                }
            }

            var loaded_modules_count = 0;
            function load_next_module() {
                if (self._modules.length == loaded_modules_count) {
                    // Defer to next frame, as success callback may not be registered yet.
                    pyscript.defer(function() {
                        self._status = "loaded";

                        self._callbacks.invoke(function(cb) {
                            cb.call(null, instance);
                        });

                        async.resolve(instance);
                        if (pyscript.debug) console.log("%c" + name + " loaded", "font-weight:bold;");

                        instance.__initialized__ = true;
                    });
                }
                else {
                    var target = self._modules[loaded_modules_count];

                    if (all_modules[target] === undefined) {
                        pyscript.assert(false, "", "Module '" + target+ "' is not defined!");
                    }
                    else {
                        pyscript.initialize(target)
                            .then(function() {
                                loaded_modules_count++;
                                load_next_module();
                            });
                    }
                }
            }

            load_next();  // Get the party started!

            return async.promise;
        }
    };
    return self;
};

pyscript.debug = true;
pyscript.prefix = '';
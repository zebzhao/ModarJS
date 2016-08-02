window.pyscript = {modules: {}, _aliases: {}, _cache: {}};

pyscript.defer = function(callback) {
    setTimeout(callback, 1);
};

pyscript.log = function() {
    if (console && console.log && pyscript.debug) {
        console.log.apply(console, arguments);
    }
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
    pyscript.check(callback, Function);
    var args = [].slice.call(arguments).slice(1);  // Remove wrapped function
    return function() {
        var more_args = [].slice.call(arguments);
        return callback.apply(this, args.concat(more_args));
    }
};

pyscript.alias = function(url, value) {
    var aliases = pyscript._aliases;
    if (aliases[url]) {
        pyscript.log("%c" + url + " overridden by " + aliases[url], "color:DodgerBlue;");
    }
    if (value) {
        aliases[url] = value;
    }
    var result = aliases[url] || url;
    return result.indexOf("://") == -1 ? pyscript.base + result : result;
};

pyscript.import = function(url) {
    url = pyscript.alias(url);
    return new core.Promise(function(resolve, reject) {
        if (pyscript._cache[url]) {
            pyscript._cache[url].push({resolve: resolve, reject: reject});
        }
        else {
            pyscript._cache[url] = [{resolve: resolve, reject: reject}];
            var noQuery = url.split('?').shift();
            var ext = noQuery.split('.').pop();
            var tag = ext == 'js' ? 'script' : 'link';
            var props = ext == 'js' ? {src: url} : {href: url};
            var element = document.createElement(tag);

            document.head.appendChild(element);

            element.onload = function() {
                var $this = this;
                pyscript.log(url, "loaded.");
                pyscript._cache[url].map(function(resolver) {
                    resolver.resolve($this);
                });
            };
            element.onerror = function() {
                pyscript.log(url, "failed to loaded.");
                pyscript._cache[url].map(function(resolver) {
                    resolver.reject('Failed to load ' + url);
                });
            };
            pyscript.extend(element, props);
        }
    });
};

pyscript.initialize = function(name) {
    var module = pyscript.modules[name];

    if (module) {
        return module._initialize();
    }
    else {
        pyscript.assert(false, "Module " + name + " is not defined!")
    }
};

pyscript.module = function(name) {
    if (!pyscript.modules[name]) {
        pyscript.modules[name] = {
            __name__: name,
            __initialized__: false,
            __state__: "",

            _scripts: [],
            _modules: [],
            _callbacks: Array.from([])
        };

        (function(module) {

            module.import = function(url) {
                module._scripts.push(url);
                return module;
            };

            module.require = function(name) {
                module._modules.push(name);
                return module;
            };

            module.def = function(values) {
                var modified = pyscript.map(function(callable, i) {
                    return pyscript.partial(callable, module);
                }, values);

                pyscript.extend(module, modified);

                return module;
            };

            module.__init__ = function(callback) {
                module._callbacks.push(callback);
                return module;
            };

            module.__new__ = function(callback) {
                callback.call(null, module);
                return module;
            };

            module._initialize = function() {
                return new core.Promise(function(resolve, reject) {

                    switch(module.__state__) {
                        case 'loaded':
                            resolve(module);
                            break;
                        case 'loading':
                            module.__init__(resolve);
                            break;
                        default:
                            pyscript.log("%c" + name + " loading...", "color:DodgerBlue;");
                            module.__state__ = 'loading';
                            importScripts(module._scripts)
                                .then(function() {
                                    initializeModules(module._modules)
                                        .then(function() {
                                            pyscript.log("%c" + name + " loaded", "font-weight:bold;");
                                            module.__initialized__ = true;
                                            module.__state__ = 'loaded';
                                            module._callbacks.forEach(function(cb) {
                                                cb.call(null, module);
                                            });
                                            resolve(module);
                                        }, reject);
                                }, reject);
                    }
                });
            };

        }(pyscript.modules[name]));
    }
    
    return pyscript.modules[name];


    function importScripts(scripts) {
        return core.Promise.all(scripts.map(pyscript.import));
    }

    function initializeModules(modules) {
        return core.Promise.all(modules.map(pyscript.initialize));
    }
};

pyscript.debug = true;
pyscript.base = '';
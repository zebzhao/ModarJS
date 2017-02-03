window.modar = {modules: {}, _aliases: {}, _cache: {}};

modar.defer = function(callback) {
    setTimeout(callback, 1);
};

modar.log = function() {
    if (console && console.log && modar.debug) {
        console.log.apply(console, arguments);
    }
};

modar.range = function(start, stop, step) {
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

modar.noop = function() {};

modar.extend = function(target, source) {
    for (var i in source) {
        if (source.hasOwnProperty(i) && source[i] !== undefined) {
            target[i] = source[i];
        }
    }
    return target;
};

modar.type = function(obj) {
    var str = Object.prototype.toString.call(obj);
    return str.toLowerCase().substring(8, str.length-1);
};

modar.map = function(func, object) {
    var result, i;
    switch(modar.type(object)) {
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

modar.all = function(func, object) {
    for (var i in object) {
        if (object.hasOwnProperty(i)) {
            if (!func.call(null, object[i], i)) {
                return false;
            }
        }
    }
    return true;
};

modar.any = function(func, object) {
    for (var i in object) {
        if (object.hasOwnProperty(i)) {
            if (func.call(null, object[i], i)) {
                return true;
            }
        }
    }
    return false;
};

modar.partial = function(callback) {
    modar.check(callback, Function);
    var args = [].slice.call(arguments).slice(1);  // Remove wrapped function
    return function() {
        var more_args = [].slice.call(arguments);
        return callback.apply(this, args.concat(more_args));
    }
};

modar.alias = function(url, value) {
    var aliases = modar._aliases;
    if (aliases[url]) {
        modar.log("%c" + url + " overridden by " + aliases[url], "color:DodgerBlue;");
    }
    if (value) {
        aliases[url] = value;
    }
    var result = aliases[url] || url;
    return result.indexOf("://") == -1 ? modar.base + result : result;
};

modar.import = function(url) {
    url = modar.alias(url);
    return new core.Promise(function(resolve, reject) {
        if (modar._cache[url]) {
            modar._cache[url].push({resolve: resolve, reject: reject});
        }
        else {
            modar._cache[url] = [{resolve: resolve, reject: reject}];
            var noQuery = url.split('?').shift();
            var ext = noQuery.split('.').pop().toLowerCase();
            var tag = ext == 'js' ? 'script' : 'link';
            var props = ext == 'js' ? {src: url} : {href: url};
            var element = document.createElement(tag);

            document.head.appendChild(element);

            element.onload = function() {
                var $this = this;
                modar.log(url, "loaded.");
                modar._cache[url].map(function(resolver) {
                    resolver.resolve($this);
                });
            };
            element.onerror = function() {
                modar.log(url, "failed to loaded.");
                modar._cache[url].map(function(resolver) {
                    resolver.reject('Failed to load ' + url);
                });
            };
            modar.extend(element, props);
        }
    });
};

modar.initialize = function(name) {
    var module = modar.modules[name];

    if (module) {
        return module._initialize();
    }
    else {
        modar.assert(false, "Module " + name + " is not defined!")
    }
};

modar.module = function(name) {
    if (!modar.modules[name]) {
        modar.modules[name] = {
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
                var modified = modar.map(function(callable, i) {
                    return modar.partial(callable, module);
                }, values);

                modar.extend(module, modified);

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
                            modar.log("%c" + name + " loading...", "color:DodgerBlue;");
                            module.__state__ = 'loading';
                            importScripts(module._scripts)
                                .then(function() {
                                    initializeModules(module._modules)
                                        .then(function() {
                                            modar.log("%c" + name + " loaded", "font-weight:bold;");
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

        }(modar.modules[name]));
    }
    
    return modar.modules[name];


    function importScripts(scripts) {
        return core.Promise.all(scripts.map(modar.import));
    }

    function initializeModules(modules) {
        return core.Promise.all(modules.map(modar.initialize));
    }
};

modar.debug = true;
modar.base = '';
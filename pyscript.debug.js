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

(function() {
    pyscript.mockDependencies = function(mapping) {
        pyscript.assert(jasmine, "mockDependencies() must be called from Jasmine testing.");
        spyOn(pyscript, '_getURL').and.callFake(function(url) {
            if (mapping[url]) {
                console.log("%c" + url + " overridden by " + mapping[url], "color:DodgerBlue;");
                return getURL(mapping[url]);
            }
            return getURL(url);
        });
    };

    pyscript._getURL = getURL;

    function getURL(url) {
        if (url.indexOf("://") != -1)
            return url;
        else return pyscript.prefix + url;
    }
})();

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
    var instance = pyscript.module(name);
    if (!instance) {
        instance = {__name__: name, __initialized__: false};
        pyscript.modules[name] = instance;
    }
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
            self._callbacks.push(callback);
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
                self._callbacks.push(function() {
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

                        self._callbacks.each(function(cb) {
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
(function(module) {
    module.extend(module, {
        assert: function(cond, message, log) {
            if (!cond) {
                if (log) console.log(log);
                debugger;
                throw new Error(message);
            }
        },
        check: function(obj, schema) {
            if (schema === Object) {
                module.assert(module.isObject(obj),
                    'expected Object got ' + Object.prototype.toString.call(obj), obj);
            }
            else if (schema == Array) {
                module.assert(module.isArray(obj),
                    'expected Array got ' + Object.prototype.toString.call(obj), obj);
            }
            else if (schema == String) {
                module.assert(module.isString(obj),
                    'expected String got ' + Object.prototype.toString.call(obj), obj);
            }
            else if (schema == Boolean) {
                module.assert(module.isBoolean(obj),
                    'expected Boolean got ' + Object.prototype.toString.call(obj), obj);
            }
            else if (schema == Number) {
                module.assert(module.isNumber(obj),
                    'expected Number got ' + Object.prototype.toString.call(obj), obj);
            }
            else if (schema == Function) {
                module.assert(module.isFunction(obj),
                    'expected Function got ' + Object.prototype.toString.call(obj), obj);
            }
            else if (module.isFunction(schema)) {
                module.assert(schema.call(obj, obj),
                    'type check function returned false', obj);
            }
            else if (module.isObject(schema)) {
                module.check(obj, Object);
                for (var k in schema) {
                    if (schema.hasOwnProperty(k))
                        module.check(obj[k], schema[k]);
                }
            }
        },
        isArray: function(obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        },
        isString: function(obj) {
            return Object.prototype.toString.call(obj) === '[object String]';
        },
        isObject: function(obj) {
            return Object.prototype.toString.call(obj) === '[object Object]';
        },
        isDefined: function(obj) {
            return (Object.prototype.toString.call(obj) !== '[object Null]' &&
            Object.prototype.toString.call(obj) !== '[object Undefined]');
        },
        isNumber: function(obj) {
            return Object.prototype.toString.call(obj) === '[object Number]';
        },
        isBoolean: function(obj) {
            return Object.prototype.toString.call(obj) === '[object Boolean]';
        },
        isFunction: function(obj) {
            return Object.prototype.toString.call(obj) === '[object Function]';
        }
    });
})(pyscript);

(function(module) {
    function PyDeferred() {
        var self = this;
        self._callbacks = pyscript.list();
        self._binding = null;
        self.promise = {
            then: function(callback) {
                self._callbacks.push(callback);
                return self.promise;
            }
        }
    }

    module.extend(PyDeferred.prototype, {
        bind: function(target) {
            this._binding = target;
            return this;
        },
        resolve: function() {
            var args = arguments;
            var self = this;
            this._callbacks.each(function (e) {
                e.apply(self._binding, args);
            })
        }
    });

    module.async = function() {
        return new PyDeferred();
    };
})(pyscript);
(function(module) {
    function PyDict(obj) {
        pyscript.check(obj, {});
        module.extend(this, obj);
    }

    module.extend(PyDict.prototype, {
        update: function(obj) {
            return pyscript.extend(this, obj);
        },
        /**
         * @returns {Array} list of keys of the dictionary
         */
        keys: function() {
            var results = [];
            for (var i in this) {
                if (this.hasOwnProperty(i)) results.push(i);
            }
            return results;
        },
        /**
         * @returns {Array} list of values of the dictionary
         */
        values: function() {
            var results = [];
            for (var i in this) {
                if (this.hasOwnProperty(i)) results.push(this[i]);
            }
            return results;
        },
        clear: function() {
            for (var i in this) {
                if (this.hasOwnProperty(i)) delete this[i];
            }
        },
        contains: function(key) {
            return this.hasOwnProperty(key);
        },
        get: function(key, defaultValue) {
            return this[key] === undefined ? defaultValue : this[key];
        },
        find: function(value) {
            for (var k in this) {
                if (this.hasOwnProperty(k) && this[k] == value) {
                    return k
                }
            }
        }
    });

    module.dict = function(kwargs) {
        return new PyDict(kwargs || {});
    };

})(pyscript);

(function(module) {
    var ListMixin = {
        removeAt:function(index){
            if (index >= 0 && index < this.length) {
                return this.splice(index, 1)[0];
            }
            return false;
        },
        remove:function(value, thisArg){
            var index = (thisArg || this).indexOf(value);
            if (index >= 0) {
                this.splice(index, 1);
                return index;
            }
            return false;
        },
        contains: function(value) {
            return this.indexOf(value) != -1;
        },
        replace: function(oldValue, newValue) {
            this[this.indexOf(oldValue)] = newValue;
        },
        insertAt:function(index, item){
            index = index || 0;
            this.splice(index, 0, item);
        },
        removeWhere: function(key, value) {
            var i = 0;
            var results = [];
            while (i < this.length) {
                if (value == this[i][key]) {
                    results.push(this.splice(i, 1));
                }
                else {
                    i += 1;
                }
            }
            return results;
        },
        removeOne: function(key, value) {
            var i = 0;
            while (i < this.length) {
                if (value == this[i][key]) {
                    return this.splice(i, 1);
                }
                else {i += 1;}
            }
            pykit.fail(pykit.replaceString("{key}: {value} cannot be removed in {array}",
                {key: key, value: value, array: this}));
        },
        indexWhere: function(key, value) {
            var results = [];
            for (var i=0; i < this.length; i++) {
                if (this[i][key] == value)
                    results.push(i);
            }
            return results;
        },
        findWhere: function(key, value) {
            var results = [];
            for (var i=0; i < this.length; i++) {
                if (this[i][key] == value)
                    results.push(this[i]);
            }
            return results;
        },
        findOne: function(key, value, error) {
            for (var i=0; i < this.length; i++) {
                // Apparently 1 == "1" in JS
                if (this[i][key] === value)
                    return this[i];
            }
            if (error)
                pykit.fail(pykit.replaceString("{key}: {value} not found in {array}",
                    {key: key, value: value, array: this}));
        },
        copy: function() {
            return this.slice();
        },
        first: function() {
            return this[0];
        },
        last: function() {
            return this[this.length-1];
        },
        until: function(operator, thisArg) {
            var copy = this.slice();
            var value, i=0;
            while (copy.length) {
                value = copy.shift();
                if (!operator.call(thisArg, value, copy)) {
                    copy.push(value);
                    i++;
                }
                else {
                    i = 0;
                }
                if (copy.length == 0){
                    break;
                }
                else if (i > copy.length) {
                    pykit.fail("Infinite loop detected.");
                    break;  // Infinite loop detected.
                }
            }
        },
        any: function(operator, thisArg) {
            for (var i=0; i < this.length; i++) {
                if (operator.call(thisArg || this, this[i], i)) {
                    return true;
                }
            }
            return false;
        },
        all: function(operator, thisArg) {
            for (var i=0; i < this.length; i++) {
                if (!operator.call(thisArg || this, this[i], i)) {
                    return false;
                }
            }
            return true;
        },
        each: function(operator, thisArg) {
            var result = [];
            for (var i=0; i < this.length; i++) {
                result[i] = operator.call(thisArg || this, this[i], i);
            }
            return result;
        },
        remap: function(operator, thisArg) {
            for (var i=0; i < this.length; i++) {
                this[i] = operator.call(thisArg || this, this[i]);
            }
        },
        filter:function(operator, thisArg) {
            var results = [];
            for (var i=0; i < this.length; i++) {
                if (operator.call(thisArg || this, this[i])){
                    results.push(this[i]);
                }
            }
            return results;
        },
        insertSorted: function(item, cmp, thisArg) {
            for (var sort,i=this.length-1; i >= 0; i--) {
                sort = cmp.call(thisArg || this, item, this[i]);
                if (sort >= 0){
                    this.insertAt(i, item);
                    return i;
                }
            }
            this.push(item);
            return i;
        }
    };

    module.list = function(array){
        return module.extend((array || []), ListMixin);
    };

})(pyscript);

(function(module) {
    function PyString(obj) {
        this.string = obj;
    }

    module.extend(PyString.prototype, {
        contains: function(text) {
            return this.string.indexOf(text) != -1;
        },
        ellipsis: function(length) {
            length = length || 18;
            return this.string.length > length ? this.string.substr(0, length-3) + '...' : this.string;
        },
        endsWith: function(suffix) {
            return this.string.indexOf(suffix, this.string.length - suffix.length) !== -1;
        },
        beginsWith: function(prefix) {
            return this.string.indexOf(prefix) == 0;
        },
        replaceLastIndexOf: function(searchValue, replaceValue) {
            var n = this.string.lastIndexOf(searchValue);
            if (n >= 0) {
                return this.string.substring(0, n) + replaceValue + this.string.substring(n + searchValue.length);
            }
        },
        toCamelCase: function() {
            return this.string.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
                if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
                return index == 0 ? match.toLowerCase() : match.toUpperCase();
            });
        },
        split: function(delimiter, limit) {
            var arr = this.string.split(delimiter);
            var result = arr.splice(0,limit);
            result.push(arr.join(delimiter));
            return result;
        },
        format: function(obj) {
            var str = this.string;
            for (var name in obj) {
                if (obj.hasOwnProperty(name)) {
                    var regex = new RegExp("{" + name + "}", "gi");
                    str = str.replace(regex, obj[name]);
                }
            }
            return str;
        }
    });

    module.str = function(str) {
        return new PyString(str || '');
    };

})(pyscript);

pyscript.defmodule('cache')

    .__init__(function(self) {
        self.onSyncSuccess = pyscript.noop;
        self._storage = pyscript.dict();
    })

    .def({
        flush: function(self) {
            self._storage.clear();
        },
        /**
         * Files that are uploaded from local will have their location hashed.
         * This enables the use of Spriter in offline mode using local images.
         * @param self
         * @param url   The target id.
         * @param file  The File object that was chosen to be uploaded.
         */
        cacheFile: function(self, url, file) {
            var async = pyscript.async();
            var reader = new FileReader();
            reader.onload = function(e) {
                self._storage[url] = {localUrl: e.target.result, file: file};
                async.resolve(url, e.target.result);
            };
            reader.readAsDataURL(file);
            return async.promise;
        },
        /**
         * Fetches a local url if one exists in the cache. Otherwise just returns
         * the remote url.
         * @param self
         * @param url   The remote url to check for.
         */
        fetchUrl: function(self, url) {
            return self._storage.get(url, {localUrl: url}).localUrl;
        },
        /**
         * Uploads all offline image files to the server.
         */
        syncAll: function(self) {
            pyscript.map(self.syncFile, self._storage.keys());
        },
        /**
         * Ignore things in cache which are not files
         * @param self
         * @param url {String}
         */
        syncFile: function(self, url) {
            var cached = self._storage.get(url);
            if (cached) {
                var file = cached.file;
                if (file) {
                    pyscript.requests.upload(cached.url, file.file, file)
                        .then(self.onSyncSuccess)
                }
            }
        },
        fetch: function(self, url, parser) {
            pyscript.check(url, String);

            var async = pyscript.async();

            if (self._storage.contains(url)) {
                pyscript.defer(function() {
                    async.resolve({success: true, cached: true, url: url, parser: parser, result: self.get(url)});
                });
            }
            else {
                pyscript.requests.get(url)
                    .then(function() {
                        var context = {success: false, url: url, parser: parser};

                        if (this.http.success) {
                            var responseText = this.responseText || "";
                            responseText = parser ? parser(responseText) : responseText;
                            self._storage[url] = responseText;
                            context.result = responseText;
                            context.success = true;
                        }
                        async.resolve(context)
                    })
            }
            return async.promise;
        },
        /**
         * Change the key of existing local key.
         * @param self
         * @param sourceKey {String}
         * @param destKey {String}
         */
        move: function(self, sourceKey, destKey) {
            pyscript.check(destKey, String);
            pyscript.check(sourceKey, String);
            if (destKey == sourceKey) {
                return;
            }
            if (!self._storage.contains(sourceKey)) {
                throw new ReferenceError('Cannot find ' + sourceKey + ' in cache!');
            }
            self._storage[destKey] = self._storage[sourceKey];
            delete self._storage[sourceKey];
        },
        delete: function(self, url) {
            pyscript.check(url, String);
            delete self._storage[url];
        },
        contains: function(self, key) {
            pyscript.check(key, String);
            return self._storage.contains(key);
        },
        store: function(self, key, value) {
            self._storage[key] = value;
        },
        find: function(self, value) {
            return self._storage.find(value);
        },
        get: function(self, id, defaultValue) {
            return self._storage.get(id, defaultValue);
        },
        /**
         * @returns {Array}
         */
        keys: function(self) {
            return self._storage.keys();
        },
        /**
         * @returns {Array}
         */
        values: function(self) {
            return self._storage.values();
        }
    });

pyscript.cache = pyscript.module('cache');
pyscript.defmodule('hotkeys')
    .__new__(function(self) {
        self.scope = 'all';

        self._keyMap = {
            backspace: 8, tab: 9, clear: 12,
            enter: 13, 'return': 13,
            esc: 27, escape: 27, space: 32,
            left: 37, up: 38, right: 39, down: 40,
            del: 46, 'delete': 46,
            home: 36, end: 35,
            pageup: 33, pagedown: 34,
            ',': 188, '.': 190, '/': 191,
            '`': 192, '-': 189, '=': 187,
            ';': 186, '\'': 222,
            '[': 219, ']': 221, '\\': 220
        };
        self._downKeys=[];
        self._modifierMap = {
            16:'shiftKey',
            18:'altKey',
            17:'ctrlKey',
            91:'metaKey'
        };
        self._modifier = {
            '⇧': 16, shift: 16,
            '⌥': 18, alt: 18, option: 18,
            '⌃': 17, ctrl: 17, control: 17,
            '⌘': 91, command: 91
        };
        self._mods = { 16: false, 18: false, 17: false, 91: false };
        self._handlers = {};
        for(var k=1;k<20;k++) {
            self._keyMap['f'+k] = 111+k;
        }
    })
    .__init__(function(self) {
        document.addEventListener('keydown', self.dispatchKeyEvent);
        document.addEventListener('keyup', self.clearModifiers);
    })
    .def({
        clearModifiers: function(self, event){
            var key = event.keyCode,
                i = self._downKeys.indexOf(key);

            if(i>=0) self._downKeys.splice(i,1);

            if(key === 93 || key === 224) key = 91;
            if(key in self._mods) {
                self._mods[key] = false;
            }
        },
        dispatchKeyEvent: function(self, event) {
            var key = event.keyCode;

            if(self._downKeys.indexOf(key)===-1) self._downKeys.push(key);

            if(key === 93 || key === 224) key = 91;
            if(key in self._mods) {
                self._mods[key] = true;
            }
            for(var e in self._mods)
                self._mods[e] = event[self._modifierMap[e]];

            if(!self.filter.call(this,event)) return;

            if (!(key in self._handlers)) return;

            var activeMods = self._mods;

            for (var handler, i = 0; i < self._handlers[key].length; i++) {
                handler = self._handlers[key][i];

                var handlerMods = handler.mods;
                var modifiersMatch = handlerMods.length > 0;

                for(var y in activeMods){
                    y = parseInt(y);
                    if(
                        (!activeMods[y] && handlerMods.indexOf(y) != -1) ||
                        (activeMods[y] && handlerMods.indexOf(y) == -1)) {
                        modifiersMatch = false;
                        break;
                    }
                }
                if(
                    (handlerMods.length === 0
                    && !activeMods[16] && !activeMods[18] && !activeMods[17] && !activeMods[91])
                    || modifiersMatch) {
                    handler.method(event, handler);
                }
            }
        },
        getKeys: function(self, key) {
            var keys = key.replace(/\s/g, '').split(',');
            if ((keys[keys.length - 1]) === '') keys[keys.length - 2] += ',';
            return keys;
        },
        getMods: function(self, key) {
            var mods = key.slice(0, key.length - 1);
            for (var i = 0; i < mods.length; i++)
                mods[i] = self._modifier[mods[i].toLowerCase()];
            return mods;
        },
        addKey: function(self, key, scope, method){
            var keys = self.getKeys(key);

            if (!method) {
                method = scope;
                scope = 'all';
            }

            var lastKey, keyArray;
            for(var i=0;i < keys.length; i++){
                keyArray = keys[i].split('-');

                lastKey = keyArray[keyArray.length-1];
                lastKey = self._keyMap[lastKey] || lastKey.toUpperCase().charCodeAt(0);

                var mods = [];
                if (keyArray.length > 1){
                    mods = self.getMods(keyArray);
                }

                if (!(lastKey in self._handlers))
                    self._handlers[lastKey] = [];

                self._handlers[lastKey].push({shortcut: keys[i], scope: scope, method: method, key: keys[i], mods: mods});
            }
        },
        filter: function(self, event){
            var tagName = (event.target).tagName;
            return !(tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA');
        }
    });

pyscript.hotkeys = pyscript.module('hotkeys');

pyscript.defmodule('requests')

    .__init__(function(self) {
        self.interceptors = [];
        self.parsers = {echo: function(input) {return input;}};
        self.headers = null;
        self.routes = pyscript.list();
        self._defaultStatusText = {
            200: 'OK',
            201: 'Created',
            202: 'Accepted',
            204: 'No Content',
            400: 'Bad Request',
            401: 'Unauthorized',
            402: 'Payment Required',
            403: 'Forbidden',
            404: 'Not Found',
            405: 'Method Not Allowed',
            406: 'Not Acceptable',
            409: 'Conflict',
            500: 'Internal Server Error',
            501: 'Not Implemented',
            502: 'Bad Gateway',
            503: 'Service Unavailable',
            504: 'Gateway Timeout',
            511: 'Network Authentication Required'
        }
    })

    .def({
        whenGET: function(self, urlPattern, callback, callThrough, priority) {
            return self._storeRoute('GET', urlPattern, callback, callThrough, priority);
        },
        whenPOST: function(self, urlPattern, callback, callThrough, priority) {
            return self._storeRoute('POST', urlPattern, callback, callThrough, priority);
        },
        whenPATCH: function(self, urlPattern, callback, callThrough, priority) {
            return self._storeRoute('PATCH', urlPattern, callback, callThrough, priority);
        },
        whenPUT: function(self, urlPattern, callback, callThrough, priority) {
            return self._storeRoute('PUT', urlPattern, callback, callThrough, priority);
        },
        whenDELETE: function(self, urlPattern, callback, callThrough, priority) {
            return self._storeRoute('DELETE', urlPattern, callback, callThrough, priority);
        },
        _storeRoute: function(self, method, urlPattern, callback, callThrough, priority) {
            pyscript.check(callback, Function);
            var existing = self.routes.findOne('pattern', urlPattern);
            var update = {
                priority: priority || 1,
                pattern: new RegExp(urlPattern),
                method: method,
                callback: callback,
                callThrough: callThrough || false
            };
            if (existing) {
                pyscript.extend(existing, update)
            }
            else {
                self.routes.push(update);
            }
            return self;
        },
        mockSetup: function(self) {
            pyscript.assert(jasmine, "mockSetup() can only be called in Jasmine testing!");

            self.mockServer = {
                routes: {GET: {}, POST: {}, PATCH: {}, DELETE: {}, PUT: {}, UPLOAD: {}},
                request: function(method, url, params, headers, sync) {
                    var async = pyscript.async();
                    pyscript.defer(function() {
                        var handler = self.mockServer.routes[method][url];
                        if (pyscript.isFunction(handler)) {
                            async.bind(handler.call(null, url, params, headers, sync)).resolve();
                        }
                    });
                    return async.promise;
                },
                defRoute: function(method, url, callback) {
                    pyscript.check(method, String);
                    pyscript.check(callback, Function);
                    method = method.toUpperCase();
                    pyscript.assert(self.mockServer.routes[method], "method must be GET/POST/PATCH/PUT/DELETE.")
                    self.mockServer.routes[method][url] = callback;
                    return self.mockServer;
                }
            };

            spyOn(self, 'get').and.callFake(
                pyscript.partial(self.mockServer.request, 'GET'));
            spyOn(self, 'put').and.callFake(
                pyscript.partial(self.mockServer.request, 'PUT'));
            spyOn(self, 'del').and.callFake(
                pyscript.partial(self.mockServer.request, 'DELETE'));
            spyOn(self, 'patch').and.callFake(
                pyscript.partial(self.mockServer.request, 'PATCH'));
            spyOn(self, 'post').and.callFake(
                pyscript.partial(self.mockServer.request, 'POST'));
            spyOn(self, 'upload').and.callFake(
                pyscript.partial(self.mockServer.request, 'UPLOAD'));
        },
        get: function(self, url, headers, sync) {
            return self._send('GET', url, null, headers, sync);
        },
        del: function(self, url, headers, sync) {
            return self._send('DELETE', url, null, headers, sync);
        },
        patch: function(self, url, params, headers, sync) {
            return self._send('PATCH', url, params, headers, sync);
        },
        post: function(self, url, params, headers, sync) {
            return self._send('POST', url, params, headers, sync);
        },
        put: function(self, url, params, headers, sync) {
            return self._send('PUT', url, params, headers, sync);
        },
        upload: function(self, url, file, headers, sync) {
            return self._send('POST', url, file, headers, sync, true);
        },
        _send: function(self, method, url, params, headers, sync, uploadFile) {
            pyscript.check(method, String);
            pyscript.check(method, url);

            var async = pyscript.async();

            headers = headers || {};
            if (self.headers) pyscript.extend(headers, self.headers);

            var data;
            if (uploadFile) {
                data = new FormData();
                data.append("upload", params);
                data.upload = params;
            }
            else {
                data = JSON.stringify(params);
                headers['Content-Type'] = 'application/json';
            }


            var proceed = self._triggerInterceptors(
                'request', null, [params, {headers: headers, url: url, method: method}]);
            if (!proceed) return;


            var route = self._matchRoute(method, url);

            if (route) {
                if (!route.callThrough) {
                    var response = route.callback(data, {headers: headers, url: url, method: method}) || [];
                    self._resolveProxyResponse(response, async);
                }
            }

            if (!route || route.callThrough) {
                var xhr = new XMLHttpRequest();
                xhr.onload = handleResponse;
                xhr.onerror = handleResponse;
                xhr.open(method, url, !sync);

                for (var key in headers)
                    if (headers.hasOwnProperty(key))
                        xhr.setRequestHeader(key, headers[key]);

                xhr.send(data);
            }

            return sync ? xhr : async.promise;

            function handleResponse() {
                self._parseStatus(this);
                var proceed = self._triggerInterceptors('response', this);
                if (proceed) {
                    async.bind(this).resolve();
                }
            }
        },
        _triggerInterceptors: function(self, type, thisArg, args) {
            var exit;
            for (var interceptor,i=0; i<self.interceptors.length; i++) {
                interceptor = self.interceptors[i];
                if (interceptor[type]) {
                    exit = interceptor[type].apply(thisArg, args);
                    if (exit === false) return false;
                }
            }
            return true;
        },
        _matchRoute: function(self, method, url) {
            var result, route;
            var priority = -1;
            for (var i = 0; i < self.routes.length; i++) {
                route = self.routes[i];
                if (route.method == method && route.pattern.test(url)) {
                    if (route.priority > priority) {
                        priority = route.priority;
                        result = route;
                    }
                }
            }
            return result;
        },
        _resolveProxyResponse: function(self, response, async) {
            var responseObject = {
                status: response[0],
                statusText: response[3] || self._defaultStatusText[response[0]],
                getResponseHeader: function(name) {
                    var headers = response[2] || {};
                    return headers[name];
                },
                responseText: pyscript.isString(response[1]) ?
                    response[1] : JSON.stringify(response[1])
            };

            self._parseStatus(responseObject);
            var proceed = self._triggerInterceptors('response', responseObject);

            if (proceed) {
                pyscript.defer(function () {
                    async.bind(responseObject).resolve();
                });
            }
        },
        _parseStatus: function(self, thisArg) {
            var status = thisArg.status;
            thisArg.http = {
                success: status >= 200 && status < 400,
                redirect: status >=300 && status < 400,
                error: status >= 400,
                unavailable: status == 503,
                serverError: status >= 500,
                clientError: status >= 400 && status < 500,
                conflict: status == 409,
                created: status == 201,
                unauthorized: status == 401,
                missing: status == 404,
                badRequest: status == 400,
                noContent: status == 204,
                ok: status == 200,
                network: status == 0 || status === undefined
            };
        }
    });

pyscript.requests = pyscript.module('requests');
pyscript.defmodule('router')

    .__new__(function(self) {
        self.proxy = {
            setHash: function(hash) {
                window.location.hash = hash;
            },
            setHref: function(href) {
                window.location.href = href;
            },
            setPathname: function(path) {
                window.location.pathname = path;
            },
            getHash: function() {
                return window.location.hash;
            },
            getHref: function() {
                return window.location.href;
            },
            getPathname: function() {
                return window.location.pathname;
            }
        };

        window.addEventListener("hashchange", function() {
            self._onchange.call(self);
        });
    })

    .__init__(function(self) {
        self._routes = {};
        self._params = {};
        self._promises = [];
    })

    .def({
        mockSetup: function(self, throwErrorOnRefresh) {
            pyscript.assert(jasmine, "mockSetup() can only be called in Jasmine testing.");

            spyOn(self.proxy, 'setHash').and.callFake(function(value) {
                self.proxy.setHref(self.proxy.getHref().split('#')[0] + '#' + value);
                pyscript.defer(self._onchange);
            });

            spyOn(self.proxy, 'getHash').and.callFake(function() {
                var hash = self.proxy.getHref().split('#')[1];
                return hash ? ('#' + hash) : '';
            });

            spyOn(self.proxy, 'setHref').and.callFake(function(value) {
                if (throwErrorOnRefresh)
                    throw new Error('Page refresh detected. Redirection to: ' + value);
                self.proxy._href = value;
            });

            spyOn(self.proxy, 'getHref').and.callFake(function() {
                return self.proxy._href || window.location.href;
            });

            spyOn(self.proxy, 'setPathname').and.callFake(function(value) {
                if (throwErrorOnRefresh)
                    throw new Error('Page refresh detected. Redirection to: ' + value);
                self.proxy.setHref(self.proxy.getHref().replace(self.proxy.getPathname(), value));
            });

            spyOn(self.proxy, 'getPathname').and.callFake(function() {
                var href = self.proxy.getHref();
                var pathname = href.replace('://', '').split('/', 1)[1] || "";
                pathname = pathname.split('?')[0].split('#')[0];
                return pathname;
            });
        },
        refresh: function(self) {
            pyscript.defer(function() {
                self._onchange(self);
            });
        },
        route: function(self, urls, callback) {
            urls = pyscript.isString(urls) ? [urls] : urls;
            for (var url,i=0; i < urls.length; i++) {
                url = urls[i];
                self._routes[url] = self._routes[url] || [];
                self._routes[url].push(callback);
            }
            return self;
        },
        _onchange: function (self) {
            var paths = self.proxy.getHash().slice(2).split('?')[0].split("/");

            var queryParams = self.parseQuery();
            var route = "";

            pyscript.map(function(elem, i) {
                route = route + "/" + elem;
                var callbacks = self._routes[i == paths.length-1 ? route : route + "/*"];
                if (callbacks && callbacks.length > 0) {
                    for (var j=0; j < callbacks.length; j++) {
                        callbacks[j].call(self, queryParams);
                    }
                }
            }, paths);

            // Resolve all promises attached to .go()
            for (var i=0; i < self._promises.length; i++) {
                self._promises[i].resolve();
            }
            // Clear resolved promises
            self._promises = [];
        },
        parseQuery: function(self) {
            var hash = self.proxy.getHash();
            var query = [];
            if (hash.indexOf("?")) {
                query = hash.slice(2).split("?");
                query = query[query.length-1].split("&");
            }
            var queryParams = {};
            var valuePair;
            pyscript.map(function(elem) {
                valuePair = elem.split("=");
                queryParams[valuePair[0]] = decodeURIComponent(valuePair[1]);
            }, query);
            return queryParams;
        },
        asQueryString: function(self, params) {
            var result = "?";
            for (var name in params) {
                if (params.hasOwnProperty(name) && params[name]) {
                    result += name + "=" + encodeURIComponent(params[name]) + "&";
                }
            }
            return result.substr(0, result.length-1);
        },
        go: function (self, uri, force) {
            pyscript.check(uri, String);
            var async = pyscript.async();
            self._promises.push(async);

            self.proxy.setHash(uri + this.asQueryString(self._params));

            if (force)
                self.refresh();

            return async.promise;
        },
        query: function (self, params) {
            pyscript.check(params, Object);
            self._params = params;
            var queryParams = self.parseQuery();
            pyscript.extend(queryParams, params);
            self.proxy.setHref(self.proxy.getHref().split("?")[0] + self.asQueryString(self._params));
        },
        redirect: function(self, pathname) {
            self.proxy.setPathname(pathname);
        }
    });

pyscript.router = pyscript.module('router');
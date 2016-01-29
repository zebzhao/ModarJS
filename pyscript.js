/**
 * Created by zeb on 11/10/15.
 */

window.pyscript = {modules: {}};

/**
 * @param [kwargs] {Object}
 * @returns {PyDict}
 */

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

pyscript.import = function(tagName, props, callback, append) {
    var element = document.createElement(tagName);
    if (append)
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
        pyscript.assert("Module {name} is not defined!".sprintf({name: name}))
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
        _callbacks: [],

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
                        pyscript.import("script", {src: pyscript.prefix + url},
                            function(e) {
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
                        instance.__initialized__ = true;

                        pyscript.map(function(cb) {
                            cb.call(null, instance);
                        }, self._callbacks);

                        async.resolve(instance);
                        if (pyscript.debug) console.log("%c" + name + " loaded", "font-weight:bold;");

                        self._status = "loaded";
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
/**
 * Created by zeb on 17/09/15.
 */

Array.prototype.unique = function() {
    return this.filter(function(a,b,c) {
        return c.indexOf(a, b + 1) == -1;
    })
};

Array.prototype.remove = function(e) {
    var index = this.indexOf(e);
    if (index >= 0) {
        this.splice(index, 1);
        return index;
    }
    return false;
};

Array.prototype.removeWhere = function(key, value) {
    pyscript.check(key, String);
    var i = 0;
    while (i < this.length) {
        if (value == this[i][key]) {
            this.splice(i, 1);
        }
        else {
            i += 1;
        }
    }
};

Array.prototype.copy = function() {
    return this.slice();
};

Array.prototype.first = function() {
    return this[0];
};

Array.prototype.last = function() {
    return this[this.length-1];
};

Array.prototype.apply = function(operator) {
    pyscript.check(operator, Function);
    var result = [];
    for (var i=0; i < this.length; i++) {
        result[i] = operator.call(this, i, this[i]);
    }
    return result;
};

Array.prototype.each = function(operator) {
    pyscript.check(operator, Function);
    var result = [];
    for (var i=0; i < this.length; i++) {
        result[i] = operator.call(this, this[i]);
    }
    return result;
};

Array.prototype.find = function(key, value) {
    pyscript.check(key, String);
    var matches = [];
    for (var i=0; i < this.length; i++) {
        if (value == this[i][key]) {
            matches.push(this[i]);
        }
    }
    return matches;
};

/**
 * Created by zeb on 17/09/15.
 */
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

/**
 * Created by zeb on 03/10/15.
 */
(function(module) {
    function PyDeferred() {
        var self = this;
        self._callbacks = [];
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
            this._callbacks.apply(function (i, e) {
                e.apply(self._binding, args);
            })
        }
    });

    module.async = function() {
        return new PyDeferred();
    };
})(pyscript);
/**
 * Created by zeb on 03/10/15.
 */
(function(module) {
    function PyDict(obj) {
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
            return this[key] || defaultValue;
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
        return new PyDict(kwargs);
    };

})(pyscript);

//IE对indexOf方法的支持
if(!Array.prototype.indexOf){
    Array.prototype.indexOf = function(obj){
        for(var i=0; i<this.length; i++) if(this[i]===obj) return i;
        return -1;
    };
}

(function(root, factory) {
    var hotkeys = factory(root);
    if (typeof define === 'function' && define.amd) {
        // AMD
        define('hotkeys', function() { return hotkeys; });
    } else if (typeof exports === 'object') {
        // Node.js
        module.exports = hotkeys;
    } else {
        // Browser globals
        // previousKey存储先前定义的关键字
        var previousKey = root.hotkeys;
        hotkeys.noConflict = function() {
            var k = root.hotkeys;
            root.hotkeys = previousKey;
            return k;
        };
        root.hotkeys = hotkeys;
    }
}(this, function(root, undefined) {
    var _api,//对外API
        _keyMap = {//特殊键
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
        },
        _scope = 'all',//默认热键范围
        _modifier = {//修饰键
            '⇧': 16, shift: 16,
            '⌥': 18, alt: 18, option: 18,
            '⌃': 17, ctrl: 17, control: 17,
            '⌘': 91, command: 91
        },
        _downKeys=[],//记录摁下的绑定键
        modifierMap = {
            16:'shiftKey',
            18:'altKey',
            17:'ctrlKey',
            91:'metaKey'
        },
        _mods = { 16: false, 18: false, 17: false, 91: false },
    //返回键码
        code = function(x){
            return _keyMap[x] || x.toUpperCase().charCodeAt(0);
        },
        _handlers={};
    // F1~F12 特殊键
    for(k=1;k<20;k++) {
        _keyMap['f'+k] = 111+k;
    }

    //设置获取当前范围（默认为'所有'）
    function setScope(scope){ _scope = scope || 'all';}
    function getScope(){ return _scope || 'all';}
    //绑定事件
    function addEvent(object, event, method) {
        if (object.addEventListener){
            object.addEventListener(event, method, false);
        }else if(object.attachEvent){
            object.attachEvent('on'+event, function(){ method(window.event); });
        }
    }
    //判断摁下的键是否为某个键，返回true或者false
    function isPressed(keyCode) {
        if(typeof(keyCode) === 'string'){
            keyCode = code(keyCode);//转换成键码
        }
        return _downKeys.indexOf(keyCode) !==-1;
    }
    //获取摁下绑定键的键值
    function getPressedKeyCodes (argument) { return _downKeys.slice(0);}
    //处理keydown事件
    function dispatch (event) {
        var key = event.keyCode,scope,asterisk = _handlers['*'];

        //搜集绑定的键
        if(_downKeys.indexOf(key)===-1) _downKeys.push(key);
        //Gecko(Friefox)的command键值224，在Webkit(Chrome)中保持一致
        //Webkit左右command键值不一样
        if(key === 93 || key === 224) key = 91;
        if(key in _mods) {
            _mods[key] = true;
            // 将特殊字符的key注册到 hotkeys 上
            for(var k in _modifier)if(_modifier[k] === key) hotkeys[k] = true;
            if(!asterisk) return;
        }
        //将modifierMap里面的修饰键绑定到event中
        for(var e in _mods) _mods[e] = event[modifierMap[e]];

        //表单控件控件过滤 默认表单控件不触发快捷键
        if(!hotkeys.filter.call(this,event)) return;
        //获取范围 默认为all
        scope = getScope();

        //对任何按键做处理
        if(asterisk) for (i = 0; i < asterisk.length; i++) {
            if(asterisk[i].scope === scope) eventHandler(event,asterisk[i],scope);
        }

        // key 不在_handlers中返回
        if (!(key in _handlers)) return;

        for (i = 0; i < _handlers[key].length; i++) {
            //找到处理内容
            eventHandler(event,_handlers[key][i],scope);
        }
    }

    function eventHandler(event,handler,scope){
        var modifiersMatch;
        //看它是否在当前范围
        if(handler.scope === scope || handler.scope === 'all'){
            //检查是否匹配修饰符（如果有返回true）
            modifiersMatch = handler.mods.length > 0;
            for(var y in _mods){
                if((!_mods[y] && handler.mods.indexOf(+y) > -1) ||
                    (_mods[y] && handler.mods.indexOf(+y) === -1)) modifiersMatch = false;
            }
            // 调用处理程序，如果是修饰键不做处理
            if((handler.mods.length === 0 && !_mods[16] && !_mods[18] && !_mods[17] && !_mods[91]) || modifiersMatch || handler.shortcut === '*'){
                if(handler.method(event, handler)===false){
                    if(event.preventDefault) event.preventDefault();
                    else event.returnValue = false;
                    if(event.stopPropagation) event.stopPropagation();
                    if(event.cancelBubble) event.cancelBubble = true;
                }
            }
        }
    }

    //解除绑定某个范围的快捷键
    function unbind (key,scope) {
        var multipleKeys = getKeys(key),keys,mods = [],obj;
        for (var i = 0; i < multipleKeys.length; i++) {

            //将组合快捷键拆分为数组
            keys =multipleKeys[i].split('+');

            //记录每个组合键中的修饰键的键码 返回数组
            if(keys.length > 1) mods=getMods(keys);

            //获取除修饰键外的键值key
            key = keys[keys.length - 1];
            key = code(key);

            //判断是否传入范围，没有就获取范围
            if(scope === undefined) scope = getScope();

            //如何key不在 _handlers 中返回不做处理
            if (!_handlers[key]) return;

            //清空 handlers 中数据，
            //让触发快捷键键之后没有事件执行到达解除快捷键绑定的目的
            for (var r = 0; r < _handlers[key].length; r++) {
                obj = _handlers[key][r];
                //判断是否在范围内并且键值相同
                if (obj.scope === scope && compareArray(obj.mods, mods)) {
                    _handlers[key][r] = {};
                }
            }
        }
    }
    //循环删除handlers中的所有 scope(范围)
    function deleteScope(scope){
        var key, handlers, i;
        for (key in _handlers) {
            handlers = _handlers[key];
            for (i = 0; i < handlers.length; ) {
                if (handlers[i].scope === scope) handlers.splice(i, 1);
                else i++;
            }
        }
    }
    //比较修饰键的数组
    function compareArray(a1, a2) {
        if (a1.length !== a2.length) return false;
        for (var i = 0; i < a1.length; i++) {
            if (a1[i] !== a2[i]) return false;
        }
        return true;
    }
    //表单控件控件判断 返回 Boolean
    function filter(event){
        var tagName = (event.target || event.srcElement).tagName;
        //忽略这些标签情况下快捷键无效
        return !(tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA');
    }
    //修饰键转换成对应的键码
    function getMods (key) {
        var mods = key.slice(0, key.length - 1);
        for (var i = 0; i < mods.length; i++) mods[i] = _modifier[mods[i]];
        return mods;
    }
    //处理传的key字符串转换成数组
    function getKeys(key) {
        var keys;
        key = key.replace(/\s/g, '');//匹配任何空白字符,包括空格、制表符、换页符等等
        keys = key.split(',');
        if ((keys[keys.length - 1]) === '') keys[keys.length - 2] += ',';
        return keys;
    }

    //在全局document上设置快捷键
    addEvent(document, 'keydown', function(event) {
        dispatch(event);
    });
    addEvent(document, 'keyup',function(event){
        clearModifier(event);
    });
    //清除修饰键
    function clearModifier(event){
        var key = event.keyCode,
            i = _downKeys.indexOf(key);

        if(i>=0) _downKeys.splice(i,1);

        //修饰键 shiftKey altKey ctrlKey (command||metaKey) 清除
        if(key === 93 || key === 224) key = 91;
        if(key in _mods) {
            _mods[key] = false;
            for(var k in _modifier) if(_modifier[k] === key) hotkeys[k] = false;
        }
    }
    //主体hotkeys函数
    function hotkeys(key,scope,method){
        var keys = getKeys(key), mods=[],i=0;
        //对为设定范围的判断
        if (method === undefined) {
            method = scope;
            scope = 'all';
        }
        //对于每个快捷键处理
        for(;i < keys.length; i++){
            key = keys[i].split('+');
            mods = [];
            //如果是组合快捷键取得组合快捷键
            if (key.length > 1){
                mods = getMods(key);
                key = [key[key.length-1]];
            }
            //转换成键码
            key = key[0];
            key = key === '*' ? '*' : code(key);
            //判断key是否在_handlers中，不在就赋一个空数组
            if (!(key in _handlers)) _handlers[key] = [];
            _handlers[key].push({shortcut: keys[i], scope: scope, method: method, key: keys[i], mods: mods});
        }
    }
    _api = {
        setScope:setScope,
        getScope:getScope,
        deleteScope:deleteScope,
        getPressedKeyCodes:getPressedKeyCodes,
        isPressed:isPressed,
        filter:filter,
        unbind:unbind
    };
    for (var a in _api) hotkeys[a] = _api[a];
    return hotkeys;
}));
/**
 * Created by zeb on 17/09/15.
 */

String.prototype.contains = function(text) {
    return this.indexOf(text) != -1;
};

String.prototype.ellipsis = function(length) {
    length = length || 18;
    return this.length > length ? this.substr(0, length-3) + '...' : this;
};

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.beginsWith = function(prefix) {
    return this.indexOf(prefix) == 0;
};

String.prototype.rslice = function(start, end) {
    if (start < 0) start = this.length + start;
    if (end < 0) end = this.length + end;
    return this.slice(start, end);
};

String.prototype.replaceLastIndexOf = function(searchValue, replaceValue) {
    var n = this.lastIndexOf(searchValue);
    if (n >= 0) {
        return this.substring(0, n) + replaceValue;
    }
};

String.prototype.toCamelCase = function() {
    return this.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
        if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
        return index == 0 ? match.toLowerCase() : match.toUpperCase();
    });
};

String.prototype.sprintf = function(obj) {
    var str = this;
    for (var name in obj) {
        if (obj.hasOwnProperty(name)) {
            var regex = new RegExp("{" + name + "}", "gi");
            str = this.replace(regex, obj[name]);
        }
    }
    return str;
};

/**
 * Created by zeb on 27/11/15.
 */
function Cache() {
    self._storage = new Dict();
}

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
         * @param url   The target API url location, also used as an id.
         * @param file  The File object that was chosen to be uploaded.
         */
        cacheFile: function(self, url, file) {
            var async = pyscript.async();
            var reader = new FileReader();
            reader.onload = function(e) {
                self._storage[url] = {localUrl: e.target.result, file: file};
                async.resolve(url, e.target.result);
            };
            reader.readAsDataURL(file.file);
            return async.promise;
        },
        /**
         * Fetches a local URL if one exists in the cache. Otherwise just returns
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
                    async.resolve(self._storage[url], url);
                });
            }
            else {
                pyscript.requests.get(url)
                    .then(function() {
                        if (this.http.success) {
                            self._storage[url] = parser ? parser(this.responseText) : this.responseText;
                            async.resolve(self._storage[url], url)
                        }
                        else {
                            pykit.alert("Failed to retrieve file.", {labels: {Ok: "Ok"}});
                        }
                    })
            }
            return async.promise;
        },
        /**
         * Change the remote URL an existing local URL.
         * @param self
         * @param sourceUrl {String}
         * @param destUrl {String}
         */
        move: function(self, sourceUrl, destUrl) {
            pyscript.check(destUrl, String);
            pyscript.check(sourceUrl, String);
            if (!self._storage[sourceUrl])
                throw new ReferenceError('Cannot find ' + sourceUrl + ' in cache!');
            self._storage[destUrl] = self._storage[sourceUrl];
            delete self._storage[sourceUrl];
        },
        delete: function(self, url) {
            pyscript.check(url, String);
            delete self._storage[url];
        },
        contains: function(self, url) {
            pyscript.check(url, String);
            return self._storage.contains(url);
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

pyscript.initialize('cache');
pyscript.cache = pyscript.module('cache');
/**
 * Created by zeb on 17/09/15.
 */
pyscript.defmodule('requests')

    .__init__(function(self) {
        self.interceptors = [];
        self.parsers = {echo: function(input) {return input;}};
        self.headers = null;
    })

    .def({
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
        upload: function(self, url, file, args) {
            pyscript.check(url, String);

            var async = pyscript.async();
            var formData = new FormData();

            formData.append("upload", file);
            var xhr = new XMLHttpRequest();
            xhr.onload = onUploadSuccess;
            xhr.onerror = onUploadError;
            xhr.open('POST', url, true);

            if (self.headers){
                for (var header in self.headers) {
                    if (self.headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header, self.headers[header]);
                    }
                }
            }

            xhr.send(formData);

            return async.promise;

            function onUploadSuccess() {
                var exit;
                for (var i=0; i<self.interceptors.length; i++) {
                    exit = self.interceptors[i].call(this);
                    if (exit) return;
                }
                self._parseStatus(this);
                async.bind(this).resolve.apply(async, args);
            }
            function onUploadError() {
                self._parseStatus(this);
                async.bind(this).resolve.apply(async, args);
            }
        },
        _send: function(self, method, url, params, headers, sync) {
            pyscript.check(method, String);
            pyscript.check(method, url);

            var async = pyscript.async();

            headers = pyscript.extend({'Content-Type': 'application/json'}, headers || {});
            if (self.headers) pyscript.extend(headers, self.headers);
            params = JSON.stringify(params);
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
                var exit;
                for (var i=0; i<self.interceptors.length; i++) {
                    exit = self.interceptors[i].call(this);
                    if (exit) return;
                }
                self._parseStatus(this);
                async.bind(this).resolve();
            };
            xhr.onerror = function() {
                self._parseStatus(this);
                async.bind(this).resolve();
            };
            xhr.open(method, url, !sync);
            for (var key in headers)
                if (headers.hasOwnProperty(key))
                    xhr.setRequestHeader(key, headers[key]);
            xhr.send(params);

            return sync ? xhr : async.promise;
        },
        _parseStatus: function(self, thisArg) {
            var status = thisArg.status;
            thisArg.http = {
                success: status >= 200 && status < 400,
                redirect: status >=300 && status < 400,
                error: status >= 400,
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

pyscript.initialize('requests');
pyscript.requests = pyscript.module('requests');
/**
 * Created by zeb on 17/09/15.
 */
pyscript.defmodule('router')

    .__init__(function(self) {
        self._routes = {};
        self._params = {};
        self._promises = [];

        window.addEventListener("hashchange", function() {
            self._onchange.call(self);
        });
    })

    .def({
        refresh: function() {
            pyscript.defer(function() {
                var event = document.createEvent('Event');
                event.initEvent('hashchange', true, true);
                window.dispatchEvent(event);
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
            var paths = window.location.hash.slice(2).split('?')[0].split("/");

            var queryParams = self.parseQuery();
            var route = "";

            pyscript.map(function(elem, i) {
                route = route + "/" + elem;
                var callbacks = self._routes[i == paths.length-1 ? route : route + "*"];
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
        parseQuery: function() {
            var hash = window.location.hash;
            var query = hash.contains("?") ? hash.slice(2).split("?").last().split("&") : [];
            var queryParams = {};
            var valuePair;
            query.apply(function(i, elem) {
                valuePair = elem.split("=");
                queryParams[valuePair[0]] = decodeURIComponent(valuePair[1]);
            });
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
            window.location.hash = uri + this.asQueryString(self._params);

            if (force)
                self.refresh();

            return async.promise;
        },
        query: function (self, params) {
            pyscript.check(params, Object);
            self._params = params;
            var queryParams = self.parseQuery();
            pyscript.extend(queryParams, params);
            window.location.href = window.location.href.split("?")[0] + self.asQueryString(self._params);
        },
        redirect: function(self, pathname) {
            window.location.pathname = pathname;
        }
    });

pyscript.initialize('router');
pyscript.router = pyscript.module('router');
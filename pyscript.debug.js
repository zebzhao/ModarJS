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
(function(module) {
    module.extend(module, {
        assert: function(cond) {
            if (!cond) {
                console.error.apply(console, [].slice.call(arguments).slice(1));
                debugger;
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
                try {
                    for (var k in schema) {
                        if (schema.hasOwnProperty(k))
                            module.check(obj[k], schema[k]);
                    }
                }
                catch (e) {
                    pyscript.assert(false, 'Object does not match check schema.', [obj, schema]);
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

/**
 * core-js 2.4.1
 * https://github.com/zloirock/core-js
 * License: http://rock.mit-license.org
 * © 2016 Denis Pushkarev
 */
!function(__e, __g, undefined){
'use strict';
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(1);
	__webpack_require__(22);
	__webpack_require__(36);
	__webpack_require__(37);
	__webpack_require__(41);
	__webpack_require__(44);
	__webpack_require__(45);
	__webpack_require__(49);
	__webpack_require__(50);
	__webpack_require__(51);
	__webpack_require__(52);
	__webpack_require__(53);
	__webpack_require__(55);
	__webpack_require__(56);
	__webpack_require__(58);
	__webpack_require__(59);
	__webpack_require__(62);
	__webpack_require__(64);
	__webpack_require__(65);
	__webpack_require__(66);
	__webpack_require__(79);
	module.exports = __webpack_require__(81);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	// 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
	var $export = __webpack_require__(2);

	$export($export.S, 'Array', {isArray: __webpack_require__(20)});

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(3)
	  , core      = __webpack_require__(4)
	  , hide      = __webpack_require__(5)
	  , redefine  = __webpack_require__(15)
	  , ctx       = __webpack_require__(18)
	  , PROTOTYPE = 'prototype';

	var $export = function(type, name, source){
	  var IS_FORCED = type & $export.F
	    , IS_GLOBAL = type & $export.G
	    , IS_STATIC = type & $export.S
	    , IS_PROTO  = type & $export.P
	    , IS_BIND   = type & $export.B
	    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE]
	    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
	    , expProto  = exports[PROTOTYPE] || (exports[PROTOTYPE] = {})
	    , key, own, out, exp;
	  if(IS_GLOBAL)source = name;
	  for(key in source){
	    // contains in native
	    own = !IS_FORCED && target && target[key] !== undefined;
	    // export native or passed
	    out = (own ? target : source)[key];
	    // bind timers to global for call from export context
	    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
	    // extend global
	    if(target)redefine(target, key, out, type & $export.U);
	    // export
	    if(exports[key] != out)hide(exports, key, exp);
	    if(IS_PROTO && expProto[key] != out)expProto[key] = out;
	  }
	};
	global.core = core;
	// type bitmap
	$export.F = 1;   // forced
	$export.G = 2;   // global
	$export.S = 4;   // static
	$export.P = 8;   // proto
	$export.B = 16;  // bind
	$export.W = 32;  // wrap
	$export.U = 64;  // safe
	$export.R = 128; // real proto method for `library` 
	module.exports = $export;

/***/ },
/* 3 */
/***/ function(module, exports) {

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math
	  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
	if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef

/***/ },
/* 4 */
/***/ function(module, exports) {

	var core = module.exports = {version: '2.4.0'};
	if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var dP         = __webpack_require__(6)
	  , createDesc = __webpack_require__(14);
	module.exports = __webpack_require__(10) ? function(object, key, value){
	  return dP.f(object, key, createDesc(1, value));
	} : function(object, key, value){
	  object[key] = value;
	  return object;
	};

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var anObject       = __webpack_require__(7)
	  , IE8_DOM_DEFINE = __webpack_require__(9)
	  , toPrimitive    = __webpack_require__(13)
	  , dP             = Object.defineProperty;

	exports.f = __webpack_require__(10) ? Object.defineProperty : function defineProperty(O, P, Attributes){
	  anObject(O);
	  P = toPrimitive(P, true);
	  anObject(Attributes);
	  if(IE8_DOM_DEFINE)try {
	    return dP(O, P, Attributes);
	  } catch(e){ /* empty */ }
	  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
	  if('value' in Attributes)O[P] = Attributes.value;
	  return O;
	};

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(8);
	module.exports = function(it){
	  if(!isObject(it))throw TypeError(it + ' is not an object!');
	  return it;
	};

/***/ },
/* 8 */
/***/ function(module, exports) {

	module.exports = function(it){
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = !__webpack_require__(10) && !__webpack_require__(11)(function(){
	  return Object.defineProperty(__webpack_require__(12)('div'), 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	// Thank's IE8 for his funny defineProperty
	module.exports = !__webpack_require__(11)(function(){
	  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 11 */
/***/ function(module, exports) {

	module.exports = function(exec){
	  try {
	    return !!exec();
	  } catch(e){
	    return true;
	  }
	};

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(8)
	  , document = __webpack_require__(3).document
	  // in old IE typeof document.createElement is 'object'
	  , is = isObject(document) && isObject(document.createElement);
	module.exports = function(it){
	  return is ? document.createElement(it) : {};
	};

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.1 ToPrimitive(input [, PreferredType])
	var isObject = __webpack_require__(8);
	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
	// and the second argument - flag - preferred type is a string
	module.exports = function(it, S){
	  if(!isObject(it))return it;
	  var fn, val;
	  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
	  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
	  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
	  throw TypeError("Can't convert object to primitive value");
	};

/***/ },
/* 14 */
/***/ function(module, exports) {

	module.exports = function(bitmap, value){
	  return {
	    enumerable  : !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable    : !(bitmap & 4),
	    value       : value
	  };
	};

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(3)
	  , hide      = __webpack_require__(5)
	  , has       = __webpack_require__(16)
	  , SRC       = __webpack_require__(17)('src')
	  , TO_STRING = 'toString'
	  , $toString = Function[TO_STRING]
	  , TPL       = ('' + $toString).split(TO_STRING);

	__webpack_require__(4).inspectSource = function(it){
	  return $toString.call(it);
	};

	(module.exports = function(O, key, val, safe){
	  var isFunction = typeof val == 'function';
	  if(isFunction)has(val, 'name') || hide(val, 'name', key);
	  if(O[key] === val)return;
	  if(isFunction)has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
	  if(O === global){
	    O[key] = val;
	  } else {
	    if(!safe){
	      delete O[key];
	      hide(O, key, val);
	    } else {
	      if(O[key])O[key] = val;
	      else hide(O, key, val);
	    }
	  }
	// add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
	})(Function.prototype, TO_STRING, function toString(){
	  return typeof this == 'function' && this[SRC] || $toString.call(this);
	});

/***/ },
/* 16 */
/***/ function(module, exports) {

	var hasOwnProperty = {}.hasOwnProperty;
	module.exports = function(it, key){
	  return hasOwnProperty.call(it, key);
	};

/***/ },
/* 17 */
/***/ function(module, exports) {

	var id = 0
	  , px = Math.random();
	module.exports = function(key){
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	// optional / simple context binding
	var aFunction = __webpack_require__(19);
	module.exports = function(fn, that, length){
	  aFunction(fn);
	  if(that === undefined)return fn;
	  switch(length){
	    case 1: return function(a){
	      return fn.call(that, a);
	    };
	    case 2: return function(a, b){
	      return fn.call(that, a, b);
	    };
	    case 3: return function(a, b, c){
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function(/* ...args */){
	    return fn.apply(that, arguments);
	  };
	};

/***/ },
/* 19 */
/***/ function(module, exports) {

	module.exports = function(it){
	  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
	  return it;
	};

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	// 7.2.2 IsArray(argument)
	var cof = __webpack_require__(21);
	module.exports = Array.isArray || function isArray(arg){
	  return cof(arg) == 'Array';
	};

/***/ },
/* 21 */
/***/ function(module, exports) {

	var toString = {}.toString;

	module.exports = function(it){
	  return toString.call(it).slice(8, -1);
	};

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ctx            = __webpack_require__(18)
	  , $export        = __webpack_require__(2)
	  , toObject       = __webpack_require__(23)
	  , call           = __webpack_require__(25)
	  , isArrayIter    = __webpack_require__(26)
	  , toLength       = __webpack_require__(30)
	  , createProperty = __webpack_require__(32)
	  , getIterFn      = __webpack_require__(33);

	$export($export.S + $export.F * !__webpack_require__(35)(function(iter){ Array.from(iter); }), 'Array', {
	  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
	  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
	    var O       = toObject(arrayLike)
	      , C       = typeof this == 'function' ? this : Array
	      , aLen    = arguments.length
	      , mapfn   = aLen > 1 ? arguments[1] : undefined
	      , mapping = mapfn !== undefined
	      , index   = 0
	      , iterFn  = getIterFn(O)
	      , length, result, step, iterator;
	    if(mapping)mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
	    // if object isn't iterable or it's array with default iterator - use simple case
	    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
	      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
	        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
	      }
	    } else {
	      length = toLength(O.length);
	      for(result = new C(length); length > index; index++){
	        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
	      }
	    }
	    result.length = index;
	    return result;
	  }
	});


/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.13 ToObject(argument)
	var defined = __webpack_require__(24);
	module.exports = function(it){
	  return Object(defined(it));
	};

/***/ },
/* 24 */
/***/ function(module, exports) {

	// 7.2.1 RequireObjectCoercible(argument)
	module.exports = function(it){
	  if(it == undefined)throw TypeError("Can't call method on  " + it);
	  return it;
	};

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	// call something on iterator step with safe closing on error
	var anObject = __webpack_require__(7);
	module.exports = function(iterator, fn, value, entries){
	  try {
	    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
	  // 7.4.6 IteratorClose(iterator, completion)
	  } catch(e){
	    var ret = iterator['return'];
	    if(ret !== undefined)anObject(ret.call(iterator));
	    throw e;
	  }
	};

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	// check on default Array iterator
	var Iterators  = __webpack_require__(27)
	  , ITERATOR   = __webpack_require__(28)('iterator')
	  , ArrayProto = Array.prototype;

	module.exports = function(it){
	  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
	};

/***/ },
/* 27 */
/***/ function(module, exports) {

	module.exports = {};

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	var store      = __webpack_require__(29)('wks')
	  , uid        = __webpack_require__(17)
	  , Symbol     = __webpack_require__(3).Symbol
	  , USE_SYMBOL = typeof Symbol == 'function';

	var $exports = module.exports = function(name){
	  return store[name] || (store[name] =
	    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
	};

	$exports.store = store;

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	var global = __webpack_require__(3)
	  , SHARED = '__core-js_shared__'
	  , store  = global[SHARED] || (global[SHARED] = {});
	module.exports = function(key){
	  return store[key] || (store[key] = {});
	};

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.15 ToLength
	var toInteger = __webpack_require__(31)
	  , min       = Math.min;
	module.exports = function(it){
	  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};

/***/ },
/* 31 */
/***/ function(module, exports) {

	// 7.1.4 ToInteger
	var ceil  = Math.ceil
	  , floor = Math.floor;
	module.exports = function(it){
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $defineProperty = __webpack_require__(6)
	  , createDesc      = __webpack_require__(14);

	module.exports = function(object, index, value){
	  if(index in object)$defineProperty.f(object, index, createDesc(0, value));
	  else object[index] = value;
	};

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(34)
	  , ITERATOR  = __webpack_require__(28)('iterator')
	  , Iterators = __webpack_require__(27);
	module.exports = __webpack_require__(4).getIteratorMethod = function(it){
	  if(it != undefined)return it[ITERATOR]
	    || it['@@iterator']
	    || Iterators[classof(it)];
	};

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	// getting tag from 19.1.3.6 Object.prototype.toString()
	var cof = __webpack_require__(21)
	  , TAG = __webpack_require__(28)('toStringTag')
	  // ES3 wrong here
	  , ARG = cof(function(){ return arguments; }()) == 'Arguments';

	// fallback for IE11 Script Access Denied error
	var tryGet = function(it, key){
	  try {
	    return it[key];
	  } catch(e){ /* empty */ }
	};

	module.exports = function(it){
	  var O, T, B;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
	    // builtinTag case
	    : ARG ? cof(O)
	    // ES3 arguments fallback
	    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
	};

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	var ITERATOR     = __webpack_require__(28)('iterator')
	  , SAFE_CLOSING = false;

	try {
	  var riter = [7][ITERATOR]();
	  riter['return'] = function(){ SAFE_CLOSING = true; };
	  Array.from(riter, function(){ throw 2; });
	} catch(e){ /* empty */ }

	module.exports = function(exec, skipClosing){
	  if(!skipClosing && !SAFE_CLOSING)return false;
	  var safe = false;
	  try {
	    var arr  = [7]
	      , iter = arr[ITERATOR]();
	    iter.next = function(){ return {done: safe = true}; };
	    arr[ITERATOR] = function(){ return iter; };
	    exec(arr);
	  } catch(e){ /* empty */ }
	  return safe;
	};

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $export        = __webpack_require__(2)
	  , createProperty = __webpack_require__(32);

	// WebKit Array.of isn't generic
	$export($export.S + $export.F * __webpack_require__(11)(function(){
	  function F(){}
	  return !(Array.of.call(F) instanceof F);
	}), 'Array', {
	  // 22.1.2.3 Array.of( ...items)
	  of: function of(/* ...args */){
	    var index  = 0
	      , aLen   = arguments.length
	      , result = new (typeof this == 'function' ? this : Array)(aLen);
	    while(aLen > index)createProperty(result, index, arguments[index++]);
	    result.length = aLen;
	    return result;
	  }
	});

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	// 22.1.3.13 Array.prototype.join(separator)
	var $export   = __webpack_require__(2)
	  , toIObject = __webpack_require__(38)
	  , arrayJoin = [].join;

	// fallback for not array-like strings
	$export($export.P + $export.F * (__webpack_require__(39) != Object || !__webpack_require__(40)(arrayJoin)), 'Array', {
	  join: function join(separator){
	    return arrayJoin.call(toIObject(this), separator === undefined ? ',' : separator);
	  }
	});

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	// to indexed object, toObject with fallback for non-array-like ES3 strings
	var IObject = __webpack_require__(39)
	  , defined = __webpack_require__(24);
	module.exports = function(it){
	  return IObject(defined(it));
	};

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	// fallback for non-array-like ES3 and non-enumerable old V8 strings
	var cof = __webpack_require__(21);
	module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
	  return cof(it) == 'String' ? it.split('') : Object(it);
	};

/***/ },
/* 40 */
/***/ function(module, exports, __webpack_require__) {

	var fails = __webpack_require__(11);

	module.exports = function(method, arg){
	  return !!method && fails(function(){
	    arg ? method.call(null, function(){}, 1) : method.call(null);
	  });
	};

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $export    = __webpack_require__(2)
	  , html       = __webpack_require__(42)
	  , cof        = __webpack_require__(21)
	  , toIndex    = __webpack_require__(43)
	  , toLength   = __webpack_require__(30)
	  , arraySlice = [].slice;

	// fallback for not array-like ES3 strings and DOM objects
	$export($export.P + $export.F * __webpack_require__(11)(function(){
	  if(html)arraySlice.call(html);
	}), 'Array', {
	  slice: function slice(begin, end){
	    var len   = toLength(this.length)
	      , klass = cof(this);
	    end = end === undefined ? len : end;
	    if(klass == 'Array')return arraySlice.call(this, begin, end);
	    var start  = toIndex(begin, len)
	      , upTo   = toIndex(end, len)
	      , size   = toLength(upTo - start)
	      , cloned = Array(size)
	      , i      = 0;
	    for(; i < size; i++)cloned[i] = klass == 'String'
	      ? this.charAt(start + i)
	      : this[start + i];
	    return cloned;
	  }
	});

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(3).document && document.documentElement;

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	var toInteger = __webpack_require__(31)
	  , max       = Math.max
	  , min       = Math.min;
	module.exports = function(index, length){
	  index = toInteger(index);
	  return index < 0 ? max(index + length, 0) : min(index, length);
	};

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $export   = __webpack_require__(2)
	  , aFunction = __webpack_require__(19)
	  , toObject  = __webpack_require__(23)
	  , fails     = __webpack_require__(11)
	  , $sort     = [].sort
	  , test      = [1, 2, 3];

	$export($export.P + $export.F * (fails(function(){
	  // IE8-
	  test.sort(undefined);
	}) || !fails(function(){
	  // V8 bug
	  test.sort(null);
	  // Old WebKit
	}) || !__webpack_require__(40)($sort)), 'Array', {
	  // 22.1.3.25 Array.prototype.sort(comparefn)
	  sort: function sort(comparefn){
	    return comparefn === undefined
	      ? $sort.call(toObject(this))
	      : $sort.call(toObject(this), aFunction(comparefn));
	  }
	});

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $export  = __webpack_require__(2)
	  , $forEach = __webpack_require__(46)(0)
	  , STRICT   = __webpack_require__(40)([].forEach, true);

	$export($export.P + $export.F * !STRICT, 'Array', {
	  // 22.1.3.10 / 15.4.4.18 Array.prototype.forEach(callbackfn [, thisArg])
	  forEach: function forEach(callbackfn /* , thisArg */){
	    return $forEach(this, callbackfn, arguments[1]);
	  }
	});

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	// 0 -> Array#forEach
	// 1 -> Array#map
	// 2 -> Array#filter
	// 3 -> Array#some
	// 4 -> Array#every
	// 5 -> Array#find
	// 6 -> Array#findIndex
	var ctx      = __webpack_require__(18)
	  , IObject  = __webpack_require__(39)
	  , toObject = __webpack_require__(23)
	  , toLength = __webpack_require__(30)
	  , asc      = __webpack_require__(47);
	module.exports = function(TYPE, $create){
	  var IS_MAP        = TYPE == 1
	    , IS_FILTER     = TYPE == 2
	    , IS_SOME       = TYPE == 3
	    , IS_EVERY      = TYPE == 4
	    , IS_FIND_INDEX = TYPE == 6
	    , NO_HOLES      = TYPE == 5 || IS_FIND_INDEX
	    , create        = $create || asc;
	  return function($this, callbackfn, that){
	    var O      = toObject($this)
	      , self   = IObject(O)
	      , f      = ctx(callbackfn, that, 3)
	      , length = toLength(self.length)
	      , index  = 0
	      , result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined
	      , val, res;
	    for(;length > index; index++)if(NO_HOLES || index in self){
	      val = self[index];
	      res = f(val, index, O);
	      if(TYPE){
	        if(IS_MAP)result[index] = res;            // map
	        else if(res)switch(TYPE){
	          case 3: return true;                    // some
	          case 5: return val;                     // find
	          case 6: return index;                   // findIndex
	          case 2: result.push(val);               // filter
	        } else if(IS_EVERY)return false;          // every
	      }
	    }
	    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
	  };
	};

/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
	var speciesConstructor = __webpack_require__(48);

	module.exports = function(original, length){
	  return new (speciesConstructor(original))(length);
	};

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(8)
	  , isArray  = __webpack_require__(20)
	  , SPECIES  = __webpack_require__(28)('species');

	module.exports = function(original){
	  var C;
	  if(isArray(original)){
	    C = original.constructor;
	    // cross-realm fallback
	    if(typeof C == 'function' && (C === Array || isArray(C.prototype)))C = undefined;
	    if(isObject(C)){
	      C = C[SPECIES];
	      if(C === null)C = undefined;
	    }
	  } return C === undefined ? Array : C;
	};

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $export = __webpack_require__(2)
	  , $map    = __webpack_require__(46)(1);

	$export($export.P + $export.F * !__webpack_require__(40)([].map, true), 'Array', {
	  // 22.1.3.15 / 15.4.4.19 Array.prototype.map(callbackfn [, thisArg])
	  map: function map(callbackfn /* , thisArg */){
	    return $map(this, callbackfn, arguments[1]);
	  }
	});

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $export = __webpack_require__(2)
	  , $filter = __webpack_require__(46)(2);

	$export($export.P + $export.F * !__webpack_require__(40)([].filter, true), 'Array', {
	  // 22.1.3.7 / 15.4.4.20 Array.prototype.filter(callbackfn [, thisArg])
	  filter: function filter(callbackfn /* , thisArg */){
	    return $filter(this, callbackfn, arguments[1]);
	  }
	});

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $export = __webpack_require__(2)
	  , $some   = __webpack_require__(46)(3);

	$export($export.P + $export.F * !__webpack_require__(40)([].some, true), 'Array', {
	  // 22.1.3.23 / 15.4.4.17 Array.prototype.some(callbackfn [, thisArg])
	  some: function some(callbackfn /* , thisArg */){
	    return $some(this, callbackfn, arguments[1]);
	  }
	});

/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $export = __webpack_require__(2)
	  , $every  = __webpack_require__(46)(4);

	$export($export.P + $export.F * !__webpack_require__(40)([].every, true), 'Array', {
	  // 22.1.3.5 / 15.4.4.16 Array.prototype.every(callbackfn [, thisArg])
	  every: function every(callbackfn /* , thisArg */){
	    return $every(this, callbackfn, arguments[1]);
	  }
	});

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $export = __webpack_require__(2)
	  , $reduce = __webpack_require__(54);

	$export($export.P + $export.F * !__webpack_require__(40)([].reduce, true), 'Array', {
	  // 22.1.3.18 / 15.4.4.21 Array.prototype.reduce(callbackfn [, initialValue])
	  reduce: function reduce(callbackfn /* , initialValue */){
	    return $reduce(this, callbackfn, arguments.length, arguments[1], false);
	  }
	});

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	var aFunction = __webpack_require__(19)
	  , toObject  = __webpack_require__(23)
	  , IObject   = __webpack_require__(39)
	  , toLength  = __webpack_require__(30);

	module.exports = function(that, callbackfn, aLen, memo, isRight){
	  aFunction(callbackfn);
	  var O      = toObject(that)
	    , self   = IObject(O)
	    , length = toLength(O.length)
	    , index  = isRight ? length - 1 : 0
	    , i      = isRight ? -1 : 1;
	  if(aLen < 2)for(;;){
	    if(index in self){
	      memo = self[index];
	      index += i;
	      break;
	    }
	    index += i;
	    if(isRight ? index < 0 : length <= index){
	      throw TypeError('Reduce of empty array with no initial value');
	    }
	  }
	  for(;isRight ? index >= 0 : length > index; index += i)if(index in self){
	    memo = callbackfn(memo, self[index], index, O);
	  }
	  return memo;
	};

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $export = __webpack_require__(2)
	  , $reduce = __webpack_require__(54);

	$export($export.P + $export.F * !__webpack_require__(40)([].reduceRight, true), 'Array', {
	  // 22.1.3.19 / 15.4.4.22 Array.prototype.reduceRight(callbackfn [, initialValue])
	  reduceRight: function reduceRight(callbackfn /* , initialValue */){
	    return $reduce(this, callbackfn, arguments.length, arguments[1], true);
	  }
	});

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $export       = __webpack_require__(2)
	  , $indexOf      = __webpack_require__(57)(false)
	  , $native       = [].indexOf
	  , NEGATIVE_ZERO = !!$native && 1 / [1].indexOf(1, -0) < 0;

	$export($export.P + $export.F * (NEGATIVE_ZERO || !__webpack_require__(40)($native)), 'Array', {
	  // 22.1.3.11 / 15.4.4.14 Array.prototype.indexOf(searchElement [, fromIndex])
	  indexOf: function indexOf(searchElement /*, fromIndex = 0 */){
	    return NEGATIVE_ZERO
	      // convert -0 to +0
	      ? $native.apply(this, arguments) || 0
	      : $indexOf(this, searchElement, arguments[1]);
	  }
	});

/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	// false -> Array#indexOf
	// true  -> Array#includes
	var toIObject = __webpack_require__(38)
	  , toLength  = __webpack_require__(30)
	  , toIndex   = __webpack_require__(43);
	module.exports = function(IS_INCLUDES){
	  return function($this, el, fromIndex){
	    var O      = toIObject($this)
	      , length = toLength(O.length)
	      , index  = toIndex(fromIndex, length)
	      , value;
	    // Array#includes uses SameValueZero equality algorithm
	    if(IS_INCLUDES && el != el)while(length > index){
	      value = O[index++];
	      if(value != value)return true;
	    // Array#toIndex ignores holes, Array#includes - not
	    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
	      if(O[index] === el)return IS_INCLUDES || index || 0;
	    } return !IS_INCLUDES && -1;
	  };
	};

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $export       = __webpack_require__(2)
	  , toIObject     = __webpack_require__(38)
	  , toInteger     = __webpack_require__(31)
	  , toLength      = __webpack_require__(30)
	  , $native       = [].lastIndexOf
	  , NEGATIVE_ZERO = !!$native && 1 / [1].lastIndexOf(1, -0) < 0;

	$export($export.P + $export.F * (NEGATIVE_ZERO || !__webpack_require__(40)($native)), 'Array', {
	  // 22.1.3.14 / 15.4.4.15 Array.prototype.lastIndexOf(searchElement [, fromIndex])
	  lastIndexOf: function lastIndexOf(searchElement /*, fromIndex = @[*-1] */){
	    // convert -0 to +0
	    if(NEGATIVE_ZERO)return $native.apply(this, arguments) || 0;
	    var O      = toIObject(this)
	      , length = toLength(O.length)
	      , index  = length - 1;
	    if(arguments.length > 1)index = Math.min(index, toInteger(arguments[1]));
	    if(index < 0)index = length + index;
	    for(;index >= 0; index--)if(index in O)if(O[index] === searchElement)return index || 0;
	    return -1;
	  }
	});

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

	// 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
	var $export = __webpack_require__(2);

	$export($export.P, 'Array', {copyWithin: __webpack_require__(60)});

	__webpack_require__(61)('copyWithin');

/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	// 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
	'use strict';
	var toObject = __webpack_require__(23)
	  , toIndex  = __webpack_require__(43)
	  , toLength = __webpack_require__(30);

	module.exports = [].copyWithin || function copyWithin(target/*= 0*/, start/*= 0, end = @length*/){
	  var O     = toObject(this)
	    , len   = toLength(O.length)
	    , to    = toIndex(target, len)
	    , from  = toIndex(start, len)
	    , end   = arguments.length > 2 ? arguments[2] : undefined
	    , count = Math.min((end === undefined ? len : toIndex(end, len)) - from, len - to)
	    , inc   = 1;
	  if(from < to && to < from + count){
	    inc  = -1;
	    from += count - 1;
	    to   += count - 1;
	  }
	  while(count-- > 0){
	    if(from in O)O[to] = O[from];
	    else delete O[to];
	    to   += inc;
	    from += inc;
	  } return O;
	};

/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	// 22.1.3.31 Array.prototype[@@unscopables]
	var UNSCOPABLES = __webpack_require__(28)('unscopables')
	  , ArrayProto  = Array.prototype;
	if(ArrayProto[UNSCOPABLES] == undefined)__webpack_require__(5)(ArrayProto, UNSCOPABLES, {});
	module.exports = function(key){
	  ArrayProto[UNSCOPABLES][key] = true;
	};

/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	// 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
	var $export = __webpack_require__(2);

	$export($export.P, 'Array', {fill: __webpack_require__(63)});

	__webpack_require__(61)('fill');

/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	// 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
	'use strict';
	var toObject = __webpack_require__(23)
	  , toIndex  = __webpack_require__(43)
	  , toLength = __webpack_require__(30);
	module.exports = function fill(value /*, start = 0, end = @length */){
	  var O      = toObject(this)
	    , length = toLength(O.length)
	    , aLen   = arguments.length
	    , index  = toIndex(aLen > 1 ? arguments[1] : undefined, length)
	    , end    = aLen > 2 ? arguments[2] : undefined
	    , endPos = end === undefined ? length : toIndex(end, length);
	  while(endPos > index)O[index++] = value;
	  return O;
	};

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	// 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)
	var $export = __webpack_require__(2)
	  , $find   = __webpack_require__(46)(5)
	  , KEY     = 'find'
	  , forced  = true;
	// Shouldn't skip holes
	if(KEY in [])Array(1)[KEY](function(){ forced = false; });
	$export($export.P + $export.F * forced, 'Array', {
	  find: function find(callbackfn/*, that = undefined */){
	    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	  }
	});
	__webpack_require__(61)(KEY);

/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	// 22.1.3.9 Array.prototype.findIndex(predicate, thisArg = undefined)
	var $export = __webpack_require__(2)
	  , $find   = __webpack_require__(46)(6)
	  , KEY     = 'findIndex'
	  , forced  = true;
	// Shouldn't skip holes
	if(KEY in [])Array(1)[KEY](function(){ forced = false; });
	$export($export.P + $export.F * forced, 'Array', {
	  findIndex: function findIndex(callbackfn/*, that = undefined */){
	    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
	  }
	});
	__webpack_require__(61)(KEY);

/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var addToUnscopables = __webpack_require__(61)
	  , step             = __webpack_require__(67)
	  , Iterators        = __webpack_require__(27)
	  , toIObject        = __webpack_require__(38);

	// 22.1.3.4 Array.prototype.entries()
	// 22.1.3.13 Array.prototype.keys()
	// 22.1.3.29 Array.prototype.values()
	// 22.1.3.30 Array.prototype[@@iterator]()
	module.exports = __webpack_require__(68)(Array, 'Array', function(iterated, kind){
	  this._t = toIObject(iterated); // target
	  this._i = 0;                   // next index
	  this._k = kind;                // kind
	// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , kind  = this._k
	    , index = this._i++;
	  if(!O || index >= O.length){
	    this._t = undefined;
	    return step(1);
	  }
	  if(kind == 'keys'  )return step(0, index);
	  if(kind == 'values')return step(0, O[index]);
	  return step(0, [index, O[index]]);
	}, 'values');

	// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
	Iterators.Arguments = Iterators.Array;

	addToUnscopables('keys');
	addToUnscopables('values');
	addToUnscopables('entries');

/***/ },
/* 67 */
/***/ function(module, exports) {

	module.exports = function(done, value){
	  return {value: value, done: !!done};
	};

/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var LIBRARY        = __webpack_require__(69)
	  , $export        = __webpack_require__(2)
	  , redefine       = __webpack_require__(15)
	  , hide           = __webpack_require__(5)
	  , has            = __webpack_require__(16)
	  , Iterators      = __webpack_require__(27)
	  , $iterCreate    = __webpack_require__(70)
	  , setToStringTag = __webpack_require__(77)
	  , getPrototypeOf = __webpack_require__(78)
	  , ITERATOR       = __webpack_require__(28)('iterator')
	  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
	  , FF_ITERATOR    = '@@iterator'
	  , KEYS           = 'keys'
	  , VALUES         = 'values';

	var returnThis = function(){ return this; };

	module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
	  $iterCreate(Constructor, NAME, next);
	  var getMethod = function(kind){
	    if(!BUGGY && kind in proto)return proto[kind];
	    switch(kind){
	      case KEYS: return function keys(){ return new Constructor(this, kind); };
	      case VALUES: return function values(){ return new Constructor(this, kind); };
	    } return function entries(){ return new Constructor(this, kind); };
	  };
	  var TAG        = NAME + ' Iterator'
	    , DEF_VALUES = DEFAULT == VALUES
	    , VALUES_BUG = false
	    , proto      = Base.prototype
	    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
	    , $default   = $native || getMethod(DEFAULT)
	    , $entries   = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined
	    , $anyNative = NAME == 'Array' ? proto.entries || $native : $native
	    , methods, key, IteratorPrototype;
	  // Fix native
	  if($anyNative){
	    IteratorPrototype = getPrototypeOf($anyNative.call(new Base));
	    if(IteratorPrototype !== Object.prototype){
	      // Set @@toStringTag to native iterators
	      setToStringTag(IteratorPrototype, TAG, true);
	      // fix for some old engines
	      if(!LIBRARY && !has(IteratorPrototype, ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
	    }
	  }
	  // fix Array#{values, @@iterator}.name in V8 / FF
	  if(DEF_VALUES && $native && $native.name !== VALUES){
	    VALUES_BUG = true;
	    $default = function values(){ return $native.call(this); };
	  }
	  // Define iterator
	  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
	    hide(proto, ITERATOR, $default);
	  }
	  // Plug for library
	  Iterators[NAME] = $default;
	  Iterators[TAG]  = returnThis;
	  if(DEFAULT){
	    methods = {
	      values:  DEF_VALUES ? $default : getMethod(VALUES),
	      keys:    IS_SET     ? $default : getMethod(KEYS),
	      entries: $entries
	    };
	    if(FORCED)for(key in methods){
	      if(!(key in proto))redefine(proto, key, methods[key]);
	    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
	  }
	  return methods;
	};

/***/ },
/* 69 */
/***/ function(module, exports) {

	module.exports = false;

/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var create         = __webpack_require__(71)
	  , descriptor     = __webpack_require__(14)
	  , setToStringTag = __webpack_require__(77)
	  , IteratorPrototype = {};

	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	__webpack_require__(5)(IteratorPrototype, __webpack_require__(28)('iterator'), function(){ return this; });

	module.exports = function(Constructor, NAME, next){
	  Constructor.prototype = create(IteratorPrototype, {next: descriptor(1, next)});
	  setToStringTag(Constructor, NAME + ' Iterator');
	};

/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
	var anObject    = __webpack_require__(7)
	  , dPs         = __webpack_require__(72)
	  , enumBugKeys = __webpack_require__(76)
	  , IE_PROTO    = __webpack_require__(75)('IE_PROTO')
	  , Empty       = function(){ /* empty */ }
	  , PROTOTYPE   = 'prototype';

	// Create object with fake `null` prototype: use iframe Object with cleared prototype
	var createDict = function(){
	  // Thrash, waste and sodomy: IE GC bug
	  var iframe = __webpack_require__(12)('iframe')
	    , i      = enumBugKeys.length
	    , lt     = '<'
	    , gt     = '>'
	    , iframeDocument;
	  iframe.style.display = 'none';
	  __webpack_require__(42).appendChild(iframe);
	  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
	  // createDict = iframe.contentWindow.Object;
	  // html.removeChild(iframe);
	  iframeDocument = iframe.contentWindow.document;
	  iframeDocument.open();
	  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
	  iframeDocument.close();
	  createDict = iframeDocument.F;
	  while(i--)delete createDict[PROTOTYPE][enumBugKeys[i]];
	  return createDict();
	};

	module.exports = Object.create || function create(O, Properties){
	  var result;
	  if(O !== null){
	    Empty[PROTOTYPE] = anObject(O);
	    result = new Empty;
	    Empty[PROTOTYPE] = null;
	    // add "__proto__" for Object.getPrototypeOf polyfill
	    result[IE_PROTO] = O;
	  } else result = createDict();
	  return Properties === undefined ? result : dPs(result, Properties);
	};


/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	var dP       = __webpack_require__(6)
	  , anObject = __webpack_require__(7)
	  , getKeys  = __webpack_require__(73);

	module.exports = __webpack_require__(10) ? Object.defineProperties : function defineProperties(O, Properties){
	  anObject(O);
	  var keys   = getKeys(Properties)
	    , length = keys.length
	    , i = 0
	    , P;
	  while(length > i)dP.f(O, P = keys[i++], Properties[P]);
	  return O;
	};

/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.14 / 15.2.3.14 Object.keys(O)
	var $keys       = __webpack_require__(74)
	  , enumBugKeys = __webpack_require__(76);

	module.exports = Object.keys || function keys(O){
	  return $keys(O, enumBugKeys);
	};

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	var has          = __webpack_require__(16)
	  , toIObject    = __webpack_require__(38)
	  , arrayIndexOf = __webpack_require__(57)(false)
	  , IE_PROTO     = __webpack_require__(75)('IE_PROTO');

	module.exports = function(object, names){
	  var O      = toIObject(object)
	    , i      = 0
	    , result = []
	    , key;
	  for(key in O)if(key != IE_PROTO)has(O, key) && result.push(key);
	  // Don't enum bug & hidden keys
	  while(names.length > i)if(has(O, key = names[i++])){
	    ~arrayIndexOf(result, key) || result.push(key);
	  }
	  return result;
	};

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	var shared = __webpack_require__(29)('keys')
	  , uid    = __webpack_require__(17);
	module.exports = function(key){
	  return shared[key] || (shared[key] = uid(key));
	};

/***/ },
/* 76 */
/***/ function(module, exports) {

	// IE 8- don't enum bug keys
	module.exports = (
	  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
	).split(',');

/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	var def = __webpack_require__(6).f
	  , has = __webpack_require__(16)
	  , TAG = __webpack_require__(28)('toStringTag');

	module.exports = function(it, tag, stat){
	  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
	};

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
	var has         = __webpack_require__(16)
	  , toObject    = __webpack_require__(23)
	  , IE_PROTO    = __webpack_require__(75)('IE_PROTO')
	  , ObjectProto = Object.prototype;

	module.exports = Object.getPrototypeOf || function(O){
	  O = toObject(O);
	  if(has(O, IE_PROTO))return O[IE_PROTO];
	  if(typeof O.constructor == 'function' && O instanceof O.constructor){
	    return O.constructor.prototype;
	  } return O instanceof Object ? ObjectProto : null;
	};

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(80)('Array');

/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var global      = __webpack_require__(3)
	  , dP          = __webpack_require__(6)
	  , DESCRIPTORS = __webpack_require__(10)
	  , SPECIES     = __webpack_require__(28)('species');

	module.exports = function(KEY){
	  var C = global[KEY];
	  if(DESCRIPTORS && C && !C[SPECIES])dP.f(C, SPECIES, {
	    configurable: true,
	    get: function(){ return this; }
	  });
	};

/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var LIBRARY            = __webpack_require__(69)
	  , global             = __webpack_require__(3)
	  , ctx                = __webpack_require__(18)
	  , classof            = __webpack_require__(34)
	  , $export            = __webpack_require__(2)
	  , isObject           = __webpack_require__(8)
	  , aFunction          = __webpack_require__(19)
	  , anInstance         = __webpack_require__(82)
	  , forOf              = __webpack_require__(83)
	  , speciesConstructor = __webpack_require__(84)
	  , task               = __webpack_require__(85).set
	  , microtask          = __webpack_require__(87)()
	  , PROMISE            = 'Promise'
	  , TypeError          = global.TypeError
	  , process            = global.process
	  , $Promise           = global[PROMISE]
	  , process            = global.process
	  , isNode             = classof(process) == 'process'
	  , empty              = function(){ /* empty */ }
	  , Internal, GenericPromiseCapability, Wrapper;

	var USE_NATIVE = !!function(){
	  try {
	    // correct subclassing with @@species support
	    var promise     = $Promise.resolve(1)
	      , FakePromise = (promise.constructor = {})[__webpack_require__(28)('species')] = function(exec){ exec(empty, empty); };
	    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
	    return (isNode || typeof PromiseRejectionEvent == 'function') && promise.then(empty) instanceof FakePromise;
	  } catch(e){ /* empty */ }
	}();

	// helpers
	var sameConstructor = function(a, b){
	  // with library wrapper special case
	  return a === b || a === $Promise && b === Wrapper;
	};
	var isThenable = function(it){
	  var then;
	  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
	};
	var newPromiseCapability = function(C){
	  return sameConstructor($Promise, C)
	    ? new PromiseCapability(C)
	    : new GenericPromiseCapability(C);
	};
	var PromiseCapability = GenericPromiseCapability = function(C){
	  var resolve, reject;
	  this.promise = new C(function($$resolve, $$reject){
	    if(resolve !== undefined || reject !== undefined)throw TypeError('Bad Promise constructor');
	    resolve = $$resolve;
	    reject  = $$reject;
	  });
	  this.resolve = aFunction(resolve);
	  this.reject  = aFunction(reject);
	};
	var perform = function(exec){
	  try {
	    exec();
	  } catch(e){
	    return {error: e};
	  }
	};
	var notify = function(promise, isReject){
	  if(promise._n)return;
	  promise._n = true;
	  var chain = promise._c;
	  microtask(function(){
	    var value = promise._v
	      , ok    = promise._s == 1
	      , i     = 0;
	    var run = function(reaction){
	      var handler = ok ? reaction.ok : reaction.fail
	        , resolve = reaction.resolve
	        , reject  = reaction.reject
	        , domain  = reaction.domain
	        , result, then;
	      try {
	        if(handler){
	          if(!ok){
	            if(promise._h == 2)onHandleUnhandled(promise);
	            promise._h = 1;
	          }
	          if(handler === true)result = value;
	          else {
	            if(domain)domain.enter();
	            result = handler(value);
	            if(domain)domain.exit();
	          }
	          if(result === reaction.promise){
	            reject(TypeError('Promise-chain cycle'));
	          } else if(then = isThenable(result)){
	            then.call(result, resolve, reject);
	          } else resolve(result);
	        } else reject(value);
	      } catch(e){
	        reject(e);
	      }
	    };
	    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
	    promise._c = [];
	    promise._n = false;
	    if(isReject && !promise._h)onUnhandled(promise);
	  });
	};
	var onUnhandled = function(promise){
	  task.call(global, function(){
	    var value = promise._v
	      , abrupt, handler, console;
	    if(isUnhandled(promise)){
	      abrupt = perform(function(){
	        if(isNode){
	          process.emit('unhandledRejection', value, promise);
	        } else if(handler = global.onunhandledrejection){
	          handler({promise: promise, reason: value});
	        } else if((console = global.console) && console.error){
	          console.error('Unhandled promise rejection', value);
	        }
	      });
	      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
	      promise._h = isNode || isUnhandled(promise) ? 2 : 1;
	    } promise._a = undefined;
	    if(abrupt)throw abrupt.error;
	  });
	};
	var isUnhandled = function(promise){
	  if(promise._h == 1)return false;
	  var chain = promise._a || promise._c
	    , i     = 0
	    , reaction;
	  while(chain.length > i){
	    reaction = chain[i++];
	    if(reaction.fail || !isUnhandled(reaction.promise))return false;
	  } return true;
	};
	var onHandleUnhandled = function(promise){
	  task.call(global, function(){
	    var handler;
	    if(isNode){
	      process.emit('rejectionHandled', promise);
	    } else if(handler = global.onrejectionhandled){
	      handler({promise: promise, reason: promise._v});
	    }
	  });
	};
	var $reject = function(value){
	  var promise = this;
	  if(promise._d)return;
	  promise._d = true;
	  promise = promise._w || promise; // unwrap
	  promise._v = value;
	  promise._s = 2;
	  if(!promise._a)promise._a = promise._c.slice();
	  notify(promise, true);
	};
	var $resolve = function(value){
	  var promise = this
	    , then;
	  if(promise._d)return;
	  promise._d = true;
	  promise = promise._w || promise; // unwrap
	  try {
	    if(promise === value)throw TypeError("Promise can't be resolved itself");
	    if(then = isThenable(value)){
	      microtask(function(){
	        var wrapper = {_w: promise, _d: false}; // wrap
	        try {
	          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
	        } catch(e){
	          $reject.call(wrapper, e);
	        }
	      });
	    } else {
	      promise._v = value;
	      promise._s = 1;
	      notify(promise, false);
	    }
	  } catch(e){
	    $reject.call({_w: promise, _d: false}, e); // wrap
	  }
	};

	// constructor polyfill
	if(!USE_NATIVE){
	  // 25.4.3.1 Promise(executor)
	  $Promise = function Promise(executor){
	    anInstance(this, $Promise, PROMISE, '_h');
	    aFunction(executor);
	    Internal.call(this);
	    try {
	      executor(ctx($resolve, this, 1), ctx($reject, this, 1));
	    } catch(err){
	      $reject.call(this, err);
	    }
	  };
	  Internal = function Promise(executor){
	    this._c = [];             // <- awaiting reactions
	    this._a = undefined;      // <- checked in isUnhandled reactions
	    this._s = 0;              // <- state
	    this._d = false;          // <- done
	    this._v = undefined;      // <- value
	    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
	    this._n = false;          // <- notify
	  };
	  Internal.prototype = __webpack_require__(88)($Promise.prototype, {
	    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
	    then: function then(onFulfilled, onRejected){
	      var reaction    = newPromiseCapability(speciesConstructor(this, $Promise));
	      reaction.ok     = typeof onFulfilled == 'function' ? onFulfilled : true;
	      reaction.fail   = typeof onRejected == 'function' && onRejected;
	      reaction.domain = isNode ? process.domain : undefined;
	      this._c.push(reaction);
	      if(this._a)this._a.push(reaction);
	      if(this._s)notify(this, false);
	      return reaction.promise;
	    },
	    // 25.4.5.1 Promise.prototype.catch(onRejected)
	    'catch': function(onRejected){
	      return this.then(undefined, onRejected);
	    }
	  });
	  PromiseCapability = function(){
	    var promise  = new Internal;
	    this.promise = promise;
	    this.resolve = ctx($resolve, promise, 1);
	    this.reject  = ctx($reject, promise, 1);
	  };
	}

	$export($export.G + $export.W + $export.F * !USE_NATIVE, {Promise: $Promise});
	__webpack_require__(77)($Promise, PROMISE);
	__webpack_require__(80)(PROMISE);
	Wrapper = __webpack_require__(4)[PROMISE];

	// statics
	$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
	  // 25.4.4.5 Promise.reject(r)
	  reject: function reject(r){
	    var capability = newPromiseCapability(this)
	      , $$reject   = capability.reject;
	    $$reject(r);
	    return capability.promise;
	  }
	});
	$export($export.S + $export.F * (LIBRARY || !USE_NATIVE), PROMISE, {
	  // 25.4.4.6 Promise.resolve(x)
	  resolve: function resolve(x){
	    // instanceof instead of internal slot check because we should fix it without replacement native Promise core
	    if(x instanceof $Promise && sameConstructor(x.constructor, this))return x;
	    var capability = newPromiseCapability(this)
	      , $$resolve  = capability.resolve;
	    $$resolve(x);
	    return capability.promise;
	  }
	});
	$export($export.S + $export.F * !(USE_NATIVE && __webpack_require__(35)(function(iter){
	  $Promise.all(iter)['catch'](empty);
	})), PROMISE, {
	  // 25.4.4.1 Promise.all(iterable)
	  all: function all(iterable){
	    var C          = this
	      , capability = newPromiseCapability(C)
	      , resolve    = capability.resolve
	      , reject     = capability.reject;
	    var abrupt = perform(function(){
	      var values    = []
	        , index     = 0
	        , remaining = 1;
	      forOf(iterable, false, function(promise){
	        var $index        = index++
	          , alreadyCalled = false;
	        values.push(undefined);
	        remaining++;
	        C.resolve(promise).then(function(value){
	          if(alreadyCalled)return;
	          alreadyCalled  = true;
	          values[$index] = value;
	          --remaining || resolve(values);
	        }, reject);
	      });
	      --remaining || resolve(values);
	    });
	    if(abrupt)reject(abrupt.error);
	    return capability.promise;
	  },
	  // 25.4.4.4 Promise.race(iterable)
	  race: function race(iterable){
	    var C          = this
	      , capability = newPromiseCapability(C)
	      , reject     = capability.reject;
	    var abrupt = perform(function(){
	      forOf(iterable, false, function(promise){
	        C.resolve(promise).then(capability.resolve, reject);
	      });
	    });
	    if(abrupt)reject(abrupt.error);
	    return capability.promise;
	  }
	});

/***/ },
/* 82 */
/***/ function(module, exports) {

	module.exports = function(it, Constructor, name, forbiddenField){
	  if(!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)){
	    throw TypeError(name + ': incorrect invocation!');
	  } return it;
	};

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	var ctx         = __webpack_require__(18)
	  , call        = __webpack_require__(25)
	  , isArrayIter = __webpack_require__(26)
	  , anObject    = __webpack_require__(7)
	  , toLength    = __webpack_require__(30)
	  , getIterFn   = __webpack_require__(33)
	  , BREAK       = {}
	  , RETURN      = {};
	var exports = module.exports = function(iterable, entries, fn, that, ITERATOR){
	  var iterFn = ITERATOR ? function(){ return iterable; } : getIterFn(iterable)
	    , f      = ctx(fn, that, entries ? 2 : 1)
	    , index  = 0
	    , length, step, iterator, result;
	  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
	  // fast case for arrays with default iterator
	  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
	    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
	    if(result === BREAK || result === RETURN)return result;
	  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
	    result = call(iterator, f, step.value, entries);
	    if(result === BREAK || result === RETURN)return result;
	  }
	};
	exports.BREAK  = BREAK;
	exports.RETURN = RETURN;

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	// 7.3.20 SpeciesConstructor(O, defaultConstructor)
	var anObject  = __webpack_require__(7)
	  , aFunction = __webpack_require__(19)
	  , SPECIES   = __webpack_require__(28)('species');
	module.exports = function(O, D){
	  var C = anObject(O).constructor, S;
	  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
	};

/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	var ctx                = __webpack_require__(18)
	  , invoke             = __webpack_require__(86)
	  , html               = __webpack_require__(42)
	  , cel                = __webpack_require__(12)
	  , global             = __webpack_require__(3)
	  , process            = global.process
	  , setTask            = global.setImmediate
	  , clearTask          = global.clearImmediate
	  , MessageChannel     = global.MessageChannel
	  , counter            = 0
	  , queue              = {}
	  , ONREADYSTATECHANGE = 'onreadystatechange'
	  , defer, channel, port;
	var run = function(){
	  var id = +this;
	  if(queue.hasOwnProperty(id)){
	    var fn = queue[id];
	    delete queue[id];
	    fn();
	  }
	};
	var listener = function(event){
	  run.call(event.data);
	};
	// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
	if(!setTask || !clearTask){
	  setTask = function setImmediate(fn){
	    var args = [], i = 1;
	    while(arguments.length > i)args.push(arguments[i++]);
	    queue[++counter] = function(){
	      invoke(typeof fn == 'function' ? fn : Function(fn), args);
	    };
	    defer(counter);
	    return counter;
	  };
	  clearTask = function clearImmediate(id){
	    delete queue[id];
	  };
	  // Node.js 0.8-
	  if(__webpack_require__(21)(process) == 'process'){
	    defer = function(id){
	      process.nextTick(ctx(run, id, 1));
	    };
	  // Browsers with MessageChannel, includes WebWorkers
	  } else if(MessageChannel){
	    channel = new MessageChannel;
	    port    = channel.port2;
	    channel.port1.onmessage = listener;
	    defer = ctx(port.postMessage, port, 1);
	  // Browsers with postMessage, skip WebWorkers
	  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
	  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){
	    defer = function(id){
	      global.postMessage(id + '', '*');
	    };
	    global.addEventListener('message', listener, false);
	  // IE8-
	  } else if(ONREADYSTATECHANGE in cel('script')){
	    defer = function(id){
	      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
	        html.removeChild(this);
	        run.call(id);
	      };
	    };
	  // Rest old browsers
	  } else {
	    defer = function(id){
	      setTimeout(ctx(run, id, 1), 0);
	    };
	  }
	}
	module.exports = {
	  set:   setTask,
	  clear: clearTask
	};

/***/ },
/* 86 */
/***/ function(module, exports) {

	// fast apply, http://jsperf.lnkit.com/fast-apply/5
	module.exports = function(fn, args, that){
	  var un = that === undefined;
	  switch(args.length){
	    case 0: return un ? fn()
	                      : fn.call(that);
	    case 1: return un ? fn(args[0])
	                      : fn.call(that, args[0]);
	    case 2: return un ? fn(args[0], args[1])
	                      : fn.call(that, args[0], args[1]);
	    case 3: return un ? fn(args[0], args[1], args[2])
	                      : fn.call(that, args[0], args[1], args[2]);
	    case 4: return un ? fn(args[0], args[1], args[2], args[3])
	                      : fn.call(that, args[0], args[1], args[2], args[3]);
	  } return              fn.apply(that, args);
	};

/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(3)
	  , macrotask = __webpack_require__(85).set
	  , Observer  = global.MutationObserver || global.WebKitMutationObserver
	  , process   = global.process
	  , Promise   = global.Promise
	  , isNode    = __webpack_require__(21)(process) == 'process';

	module.exports = function(){
	  var head, last, notify;

	  var flush = function(){
	    var parent, fn;
	    if(isNode && (parent = process.domain))parent.exit();
	    while(head){
	      fn   = head.fn;
	      head = head.next;
	      try {
	        fn();
	      } catch(e){
	        if(head)notify();
	        else last = undefined;
	        throw e;
	      }
	    } last = undefined;
	    if(parent)parent.enter();
	  };

	  // Node.js
	  if(isNode){
	    notify = function(){
	      process.nextTick(flush);
	    };
	  // browsers with MutationObserver
	  } else if(Observer){
	    var toggle = true
	      , node   = document.createTextNode('');
	    new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
	    notify = function(){
	      node.data = toggle = !toggle;
	    };
	  // environments with maybe non-completely correct, but existent Promise
	  } else if(Promise && Promise.resolve){
	    var promise = Promise.resolve();
	    notify = function(){
	      promise.then(flush);
	    };
	  // for other environments - macrotask based on:
	  // - setImmediate
	  // - MessageChannel
	  // - window.postMessag
	  // - onreadystatechange
	  // - setTimeout
	  } else {
	    notify = function(){
	      // strange IE + webpack dev server bug - use .call(global)
	      macrotask.call(global, flush);
	    };
	  }

	  return function(fn){
	    var task = {fn: fn, next: undefined};
	    if(last)last.next = task;
	    if(!head){
	      head = task;
	      notify();
	    } last = task;
	  };
	};

/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	var redefine = __webpack_require__(15);
	module.exports = function(target, src, safe){
	  for(var key in src)redefine(target, key, src[key], safe);
	  return target;
	};

/***/ }
/******/ ]);
// CommonJS export
if(typeof module != 'undefined' && module.exports)module.exports = __e;
// RequireJS export
else if(typeof define == 'function' && define.amd)define(function(){return __e});
// Export to global object
else __g.core = __e;
}(1, 1);
pyscript.module('cache')
    
    .__init__(function(self) {
        self._storage = {};
    })

    .def({
        flush: function(self) {
            self._storage = {};
        },
        /**
         * Files that are uploaded from local will have their location hashed.
         * This enables the use of Spriter in offline mode using local images.
         * @param self
         * @param url   The target id.
         * @param file  The File object that was chosen to be uploaded.
         */
        cacheFile: function(self, url, file) {
            return new core.Promise(function(resolve, reject) {
                var reader = new FileReader();
                
                reader.onload = function(e) {
                    var result = {url: url, localUrl: e.target.result, file: file};
                    self._storage[url] = result;
                    resolve(result);
                };
                reader.onerror = function(e) {
                    reject(e);
                };
                
                reader.readAsDataURL(file);
            });
        },
        /**
         * Fetches a local url if one exists in the cache. Otherwise just returns
         * the remote url.
         * @param self
         * @param url   The remote url to check for.
         */
        fetchUrl: function(self, url) {
            var value = self._storage[url];
            return value ? value.localUrl : url;
        },
        fetch: function(self, url, parser) {
            pyscript.check(url, String);

            return new core.Promise(function(resolve, reject) {
                if (self._storage[url]) {
                    resolve({cached: true, url: url, parser: parser, result: self.get(url)});
                }
                else {
                    pyscript.requests.get(url)
                        .then(function(response) {
                            if (response.http.success) {
                                var result = response.responseText || "";
                                result = parser ? parser(result) : result;
                                resolve({cached: false, url: url, parser: parser, result: result});
                            }
                            else {
                                reject(response);
                            }
                        }, reject);
                }
            });
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
            if (self._storage[sourceKey] === undefined) {
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
            return self._storage[key] !== undefined;
        },
        store: function(self, key, value) {
            self._storage[key] = value;
        },
        get: function(self, id, defaultValue) {
            return self.contains(id) ? self._storage[id] : defaultValue;
        },
        keys: function(self) {
            return Object.keys(self._storage);
        }
    });

pyscript.cache = pyscript.module('cache');
pyscript.module('hotkeys')
    
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

pyscript.module('requests')

    .__init__(function(self) {
        self.interceptors = [];
        self.parsers = {echo: function(input) {return input;}};
        self.headers = null;
        self.routes = Array.from([]);
        
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

            var existing = self.routes.find(function(elem) {
                return elem['pattern'] == urlPattern;
            });

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

            return new core.Promise(function(resolve, reject) {
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
                    'request', [params, method, url, params, headers]);
                if (!proceed) return;


                var route = self._matchRoute(method, url);

                if (route) {
                    if (!route.callThrough) {
                        var response = route.callback(data, {headers: headers, url: url, method: method}) || [];
                        self._resolveProxyResponse(response, {resolve: resolve, reject: reject});
                    }
                }

                if (!route || route.callThrough) {
                    var xhr = new XMLHttpRequest();
                    xhr.onload = function() {
                        self._parseStatus(this);
                        var proceed = self._triggerInterceptors('response', [this]);
                        if (proceed) resolve(this);
                    };
                    xhr.onerror = function() {
                        self._parseStatus(this);
                        var proceed = self._triggerInterceptors('error', [this]);
                        if (proceed) reject(this);
                    };
                    xhr.open(method, url, !sync);

                    for (var key in headers)
                        if (headers.hasOwnProperty(key))
                            xhr.setRequestHeader(key, headers[key]);

                    xhr.send(data);
                }
            });
        },
        _triggerInterceptors: function(self, type, args) {
            var exit;
            for (var interceptor,i=0; i<self.interceptors.length; i++) {
                interceptor = self.interceptors[i];
                if (interceptor[type]) {
                    exit = interceptor[type].apply(null, args);
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
        _resolveProxyResponse: function(self, response, resolver) {
            var promise = response;
            if (!promise.then) {
                promise = core.Promise.resolve(response);
            }
            promise.then(function(response) {
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
                var proceed = self._triggerInterceptors('response', [responseObject]);

                if (proceed) {
                    resolver.resolve(responseObject);
                }
            });
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
pyscript.module('router')

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
    })

    .__init__(function(self) {
        self._routes = {};
        self._params = {};
        self._promises = [];

        window.addEventListener("hashchange", function() {
            self._onchange.call(self);
        });
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

            var promise = new core.Promise(function(resolve, reject) {
                self._promises.push({resolve: resolve, reject: reject});
            });

            self.proxy.setHash(uri + this.asQueryString(self._params));

            if (force)
                self.refresh();

            return promise;
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
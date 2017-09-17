(function(module) {
    module.extend(module, {
        assert: function(cond) {
            if (!cond) {
                if (console && console.error && console.error.apply)
                    console.error.apply(console, [].slice.call(arguments).slice(1));
                debugger;
            }
            return cond;
        },
        check: function(obj, schema) {
            if (schema === Object) {
                return module.assert(module.isObject(obj),
                    'expected Object got ' + Object.prototype.toString.call(obj), obj);
            }
            else if (schema == Array) {
                return module.assert(module.isArray(obj),
                    'expected Array got ' + Object.prototype.toString.call(obj), obj);
            }
            else if (schema == String) {
                return module.assert(module.isString(obj),
                    'expected String got ' + Object.prototype.toString.call(obj), obj);
            }
            else if (schema == Boolean) {
                return module.assert(module.isBoolean(obj),
                    'expected Boolean got ' + Object.prototype.toString.call(obj), obj);
            }
            else if (schema == Number) {
                return module.assert(module.isNumber(obj),
                    'expected Number got ' + Object.prototype.toString.call(obj), obj);
            }
            else if (schema == Function) {
                return module.assert(module.isFunction(obj),
                    'expected Function got ' + Object.prototype.toString.call(obj), obj);
            }
            else if (module.isFunction(schema)) {
                return module.assert(schema.call(obj, obj),
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
                    return module.assert(false, 'Object does not match check schema.', [obj, schema]);
                }
                return true;
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
})(jQuip);

(function (module) {
  module.extend(module, {
    assert: function (cond, message, obj, throwError) {
      if (!cond) {
        if (throwError) {
          throw new Error(message);
        }
        else if (console && console.error && console.error.apply) {
          console.error(message, obj);
        }
      }
      return cond;
    },
    check: function (obj, schema, name, throwError) {
      var message = errorMessage(stringifySchema(schema), obj, name);

      if (schema === Object) {
        return module.assert(module.isObject(obj), message, obj, throwError);
      }
      else if (schema == Array) {
        return module.assert(module.isArray(obj), message, obj, throwError);
      }
      else if (schema == String) {
        return module.assert(module.isString(obj), message, obj, throwError);
      }
      else if (schema == Boolean) {
        return module.assert(module.isBoolean(obj), message, obj, throwError);
      }
      else if (schema == Number) {
        return module.assert(module.isNumber(obj), message, obj, throwError);
      }
      else if (schema == Function) {
        return module.assert(module.isFunction(obj), message, obj, throwError);
      }
      else if (module.isFunction(schema)) {
        return module.assert(schema.call(null, obj),
          'type check function returned false', obj, throwError);
      }
      else if (module.isObject(schema)) {
        var match = module.isObject(obj);
        if (!match) return false;

        for (var k in schema) {
          // Tricky, put match last to prevent short circuit
          if (schema.hasOwnProperty(k))
            match = module.check(obj[k], schema[k], k) && match;
        }
        if (!match && throwError) {
          throw new Error(message);
        } else {
          return match;
        }
      }
    },
    isArray: function (obj) {
      return typeOf(obj) === 'Array';
    },
    isString: function (obj) {
      return typeOf(obj) === 'String';
    },
    isObject: function (obj) {
      return typeOf(obj) === 'Object';
    },
    isDefined: function (obj) {
      return typeOf(obj) !== 'Null' && typeOf(obj) !== 'Undefined';
    },
    isNumber: function (obj) {
      return typeOf(obj) === 'Number';
    },
    isBoolean: function (obj) {
      return typeOf(obj) === 'Boolean';
    },
    isFunction: function (obj) {
      return typeOf(obj) === 'Function';
    }
  });

  // Fix Function#name on browsers that do not support it (IE):
  if (!(function f() {}).name) {
    Object.defineProperty(Function.prototype, 'name', {
      get: function() {
        var name = (this.toString().match(/^function\s*([^\s(]+)/) || [])[1];
        Object.defineProperty(this, 'name', { value: name });
        return name;
      }
    });
  }

  function stringifySchema(schema) {
    if (typeof schema === 'function') {
      return schema.name;
    } else {
      var result = '{';
      for (var k in schema) {
        // Tricky, put match last to prevent short circuit
        if (schema.hasOwnProperty(k))
          result += k + ':' + stringifySchema(schema[k]) + ', ';
      }
      return result.slice(0, -2) + '}';
    }
  }

  function typeOf(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
  }

  function errorMessage(type, obj, name) {
    return 'expected ' + type + (name ? ' for ' + name : '') + ', but got ' + typeOf(obj) + ' instead';
  }
})(jQuip);

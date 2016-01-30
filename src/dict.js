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

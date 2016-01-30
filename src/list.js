(function(module) {
    function PyList(obj) {
        module.extend(this, obj);
    }

    module.extend(PyList.prototype, {
        unique: function() {
            return this.filter(function(a,b,c) {
                return c.indexOf(a, b + 1) == -1;
            })
        },
        find: function(key, value) {
            pyscript.check(key, String);
            var matches = [];
            for (var i=0; i < this.length; i++) {
                if (value == this[i][key]) {
                    matches.push(this[i]);
                }
            }
            return matches;
        },
        each: function(operator) {
            pyscript.check(operator, Function);
            var result = [];
            for (var i=0; i < this.length; i++) {
                result[i] = operator.call(this, this[i]);
            }
            return result;
        },
        invoke: function(operator) {
            pyscript.check(operator, Function);
            var result = [];
            for (var i=0; i < this.length; i++) {
                result[i] = operator.call(this, i, this[i]);
            }
            return result;
        },
        first: function() {
            return this[0];
        },
        last: function() {
            return this[this.length-1];
        },
        remove: function(e) {
            var index = this.indexOf(e);
            if (index >= 0) {
                this.splice(index, 1);
                return index;
            }
            return false;
        }
    });

    module.list = function(list) {
        return new PyList(list || []);
    };

})(pyscript);

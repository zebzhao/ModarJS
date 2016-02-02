(function(module) {
    function PyList(obj) {
        pyscript.assert(obj, Array);
        this.array = obj;
    }

    module.extend(PyList.prototype, {
        append: function(e) {
            this.array.push(e);
        },
        unique: function() {
            return this.array.filter(function(a,b,c) {
                return c.indexOf(a, b + 1) == -1;
            })
        },
        find: function(key, value) {
            pyscript.check(key, String);
            var matches = [];
            for (var i=0; i < this.array.length; i++) {
                if (value == this.array[i][key]) {
                    matches.push(this.array[i]);
                }
            }
            return matches;
        },
        invoke: function(operator) {
            pyscript.check(operator, Function);
            var result = [];
            for (var i=0; i < this.array.length; i++) {
                result[i] = operator.call(this, this.array[i], i, this.array);
            }
            return result;
        },
        first: function() {
            return this.array[0];
        },
        last: function() {
            return this.array[this.array.length-1];
        },
        remove: function(e) {
            var index = this.array.indexOf(e);
            if (index >= 0) {
                this.array.splice(index, 1);
                return index;
            }
            return false;
        }
    });

    module.list = function(list) {
        return new PyList(list || []);
    };

})(pyscript);

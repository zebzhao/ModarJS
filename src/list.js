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

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

(function(module) {
    function PyString(obj) {
        module.extend(this, obj);
    }

    module.extend(PyString.prototype, {
        contains: function(text) {
            return this.indexOf(text) != -1;
        },
        ellipsis: function(length) {
            length = length || 18;
            return this.length > length ? this.substr(0, length-3) + '...' : this;
        },
        endsWith: function(suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        },
        beginsWith: function(prefix) {
            return this.indexOf(prefix) == 0;
        },
        replaceLastIndexOf: function(searchValue, replaceValue) {
            var n = this.lastIndexOf(searchValue);
            if (n >= 0) {
                return this.substring(0, n) + replaceValue;
            }
        },
        toCamelCase: function() {
            return this.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
                if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
                return index == 0 ? match.toLowerCase() : match.toUpperCase();
            });
        },
        sprintf: function(obj) {
            var str = this;
            for (var name in obj) {
                if (obj.hasOwnProperty(name)) {
                    var regex = new RegExp("{" + name + "}", "gi");
                    str = this.replace(regex, obj[name]);
                }
            }
            return str;
        }
    });

    module.str = function(str) {
        return new PyString(str || '');
    };

})(pyscript);

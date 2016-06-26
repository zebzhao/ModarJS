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

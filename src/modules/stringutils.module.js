pyscript.defmodule('arrayutils')
    .__init__(function() {
        String.prototype.contains = function(text) {
            return this.indexOf(text) != -1;
        };

        String.prototype.ellipsis = function(length) {
            length = length || 18;
            return this.length > length ? this.substr(0, length-3) + '...' : this;
        };

        String.prototype.endsWith = function(suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };

        String.prototype.beginsWith = function(prefix) {
            return this.indexOf(prefix) == 0;
        };

        String.prototype.replaceLastIndexOf = function(searchValue, replaceValue) {
            var n = this.lastIndexOf(searchValue);
            if (n >= 0) {
                return this.substring(0, n) + replaceValue;
            }
        };

        String.prototype.toCamelCase = function() {
            return this.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function(match, index) {
                if (+match === 0) return ""; // or if (/\s+/.test(match)) for white spaces
                return index == 0 ? match.toLowerCase() : match.toUpperCase();
            });
        };

        String.prototype.sprintf = function(obj) {
            var str = this;
            for (var name in obj) {
                if (obj.hasOwnProperty(name)) {
                    var regex = new RegExp("{" + name + "}", "gi");
                    str = this.replace(regex, obj[name]);
                }
            }
            return str;
        };
    });

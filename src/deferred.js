/**
 * Created by zeb on 03/10/15.
 */
(function(module) {
    function PyDeferred() {
        var self = this;
        self._callbacks = [];
        self._binding = null;
        self.promise = {
            then: function(callback) {
                self._callbacks.push(callback);
                return self.promise;
            }
        }
    }

    module.extend(PyDeferred.prototype, {
        bind: function(target) {
            this._binding = target;
            return this;
        },
        resolve: function() {
            var args = arguments;
            var self = this;
            this._callbacks.apply(function (i, e) {
                e.apply(self._binding, args);
            })
        }
    });

    module.async = function() {
        return new PyDeferred();
    };
})(pyscript);
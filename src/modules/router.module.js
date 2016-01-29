/**
 * Created by zeb on 17/09/15.
 */
pyscript.defmodule('router')

    .__init__(function(self) {
        self._routes = {};
        self._params = {};
        self._promises = [];

        window.addEventListener("hashchange", function() {
            self._onchange.call(self);
        });
    })

    .def({
        refresh: function() {
            pyscript.defer(function() {
                var event = document.createEvent('Event');
                event.initEvent('hashchange', true, true);
                window.dispatchEvent(event);
            });
        },
        route: function(self, urls, callback) {
            urls = pyscript.isString(urls) ? [urls] : urls;
            for (var url,i=0; i < urls.length; i++) {
                url = urls[i];
                self._routes[url] = self._routes[url] || [];
                self._routes[url].push(callback);
            }
            return self;
        },
        _onchange: function (self) {
            var paths = window.location.hash.slice(2).split('?')[0].split("/");

            var queryParams = self.parseQuery();
            var route = "";

            pyscript.map(function(elem, i) {
                route = route + "/" + elem;
                var callbacks = self._routes[i == paths.length-1 ? route : route + "*"];
                if (callbacks && callbacks.length > 0) {
                    for (var j=0; j < callbacks.length; j++) {
                        callbacks[j].call(self, queryParams);
                    }
                }
            }, paths);

            // Resolve all promises attached to .go()
            for (var i=0; i < self._promises.length; i++) {
                self._promises[i].resolve();
            }
            // Clear resolved promises
            self._promises = [];
        },
        parseQuery: function() {
            var hash = window.location.hash;
            var query = hash.contains("?") ? hash.slice(2).split("?").last().split("&") : [];
            var queryParams = {};
            var valuePair;
            query.apply(function(i, elem) {
                valuePair = elem.split("=");
                queryParams[valuePair[0]] = decodeURIComponent(valuePair[1]);
            });
            return queryParams;
        },
        asQueryString: function(self, params) {
            var result = "?";
            for (var name in params) {
                if (params.hasOwnProperty(name) && params[name]) {
                    result += name + "=" + encodeURIComponent(params[name]) + "&";
                }
            }
            return result.substr(0, result.length-1);
        },
        go: function (self, uri, force) {
            pyscript.check(uri, String);
            var async = pyscript.async();
            self._promises.push(async);
            window.location.hash = uri + this.asQueryString(self._params);

            if (force)
                self.refresh();

            return async.promise;
        },
        query: function (self, params) {
            pyscript.check(params, Object);
            self._params = params;
            var queryParams = self.parseQuery();
            pyscript.extend(queryParams, params);
            window.location.href = window.location.href.split("?")[0] + self.asQueryString(self._params);
        },
        redirect: function(self, pathname) {
            window.location.pathname = pathname;
        }
    });

pyscript.initialize('router');
pyscript.router = pyscript.module('router');
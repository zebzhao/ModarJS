pyscript.defmodule('router')

    .__init__(function(self) {
        self._routes = {};
        self._params = {};
        self._promises = [];

        self.windowProxy = {
            setHash: function(hash) {
                window.location.hash = hash;
            },
            setHref: function(href) {
                window.location.href = href;
            },
            setPathname: function(path) {
                window.location.pathname = path;
            },
            getHash: function() {
                return window.location.hash;
            },
            getHref: function() {
                return window.location.href;
            },
            getPathname: function() {
                return window.location.pathname;
            }
        };

        window.addEventListener("hashchange", function() {
            self._onchange.call(self);
        });
    })

    .def({
        mockSetup: function(self) {
            pyscript.assert(jasmine, "mockSetup() can only be called in Jasmine testing.");

            spyOn(self.windowProxy, 'setHash').and.callFake(function(value) {
                self.windowProxy._hash = value;
            });

            spyOn(self.windowProxy, 'getHash').and.callFake(function() {
                return self.windowProxy._hash || window.location.hash;
            });

            spyOn(self.windowProxy, 'setHref').and.callFake(function(value) {
                self.windowProxy._href = value;
            });

            spyOn(self.windowProxy, 'getHref').and.callFake(function() {
                return self.windowProxy._href || window.location.href;
            });

            spyOn(self.windowProxy, 'setPathname').and.callFake(function(value) {
                self.windowProxy._pathname = value;
            });

            spyOn(self.windowProxy, 'getPathname').and.callFake(function() {
                return self.windowProxy._pathname || window.location.pathanem;
            });
        },
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
            var paths = self.windowProxy.getHash().slice(2).split('?')[0].split("/");

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
        parseQuery: function(self) {
            var hash = self.windowProxy.getHash();
            var query = [];
            if (hash.indexOf("?")) {
                query = hash.slice(2).split("?");
                query = query[query.length-1].split("&");
            }
            var queryParams = {};
            var valuePair;
            pyscript.map(function(elem) {
                valuePair = elem.split("=");
                queryParams[valuePair[0]] = decodeURIComponent(valuePair[1]);
            }, query);
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
            self.windowProxy.setHash(uri + this.asQueryString(self._params));

            if (force)
                self.refresh();

            return async.promise;
        },
        query: function (self, params) {
            pyscript.check(params, Object);
            self._params = params;
            var queryParams = self.parseQuery();
            pyscript.extend(queryParams, params);
            self.windowProxy.setHref(self.windowProxy.getHref().split("?")[0] + self.asQueryString(self._params));
        },
        redirect: function(self, pathname) {
            self.windowProxy.setPathname(pathname);
        }
    });

pyscript.router = pyscript.module('router');
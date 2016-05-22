pyscript.defmodule('router')

    .__new__(function(self) {
        self.proxy = {
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

    .__init__(function(self) {
        self._routes = {};
        self._params = {};
        self._promises = [];
    })

    .def({
        mockSetup: function(self, throwErrorOnRefresh) {
            pyscript.assert(jasmine, "mockSetup() can only be called in Jasmine testing.");

            spyOn(self.proxy, 'setHash').and.callFake(function(value) {
                self.proxy.setHref(self.proxy.getHref().split('#')[0] + '#' + value);
                pyscript.defer(self._onchange);
            });

            spyOn(self.proxy, 'getHash').and.callFake(function() {
                var hash = self.proxy.getHref().split('#')[1];
                return hash ? ('#' + hash) : '';
            });

            spyOn(self.proxy, 'setHref').and.callFake(function(value) {
                if (throwErrorOnRefresh)
                    throw new Error('Page refresh detected. Redirection to: ' + value);
                self.proxy._href = value;
            });

            spyOn(self.proxy, 'getHref').and.callFake(function() {
                return self.proxy._href || window.location.href;
            });

            spyOn(self.proxy, 'setPathname').and.callFake(function(value) {
                if (throwErrorOnRefresh)
                    throw new Error('Page refresh detected. Redirection to: ' + value);
                self.proxy.setHref(self.proxy.getHref().replace(self.proxy.getPathname(), value));
            });

            spyOn(self.proxy, 'getPathname').and.callFake(function() {
                var href = self.proxy.getHref();
                var pathname = href.replace('://', '').split('/', 1)[1] || "";
                pathname = pathname.split('?')[0].split('#')[0];
                return pathname;
            });
        },
        refresh: function(self) {
            pyscript.defer(function() {
                self._onchange(self);
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
            var paths = self.proxy.getHash().slice(2).split('?')[0].split("/");

            var queryParams = self.parseQuery();
            var route = "";

            pyscript.map(function(elem, i) {
                route = route + "/" + elem;
                var callbacks = self._routes[i == paths.length-1 ? route : route + "/*"];
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
            var hash = self.proxy.getHash();
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

            self.proxy.setHash(uri + this.asQueryString(self._params));

            if (force)
                self.refresh();

            return async.promise;
        },
        query: function (self, params) {
            pyscript.check(params, Object);
            self._params = params;
            var queryParams = self.parseQuery();
            pyscript.extend(queryParams, params);
            self.proxy.setHref(self.proxy.getHref().split("?")[0] + self.asQueryString(self._params));
        },
        redirect: function(self, pathname) {
            self.proxy.setPathname(pathname);
        }
    });

pyscript.router = pyscript.module('router');
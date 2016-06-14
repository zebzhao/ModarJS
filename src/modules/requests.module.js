pyscript.defmodule('requests')

    .__init__(function(self) {
        self.interceptors = [];
        self.parsers = {echo: function(input) {return input;}};
        self.headers = null;
        self.routes = pyscript.list();
        self._defaultStatusText = {
            200: 'OK',
            201: 'Created',
            202: 'Accepted',
            204: 'No Content',
            400: 'Bad Request',
            401: 'Unauthorized',
            402: 'Payment Required',
            403: 'Forbidden',
            404: 'Not Found',
            405: 'Method Not Allowed',
            406: 'Not Acceptable',
            409: 'Conflict',
            500: 'Internal Server Error',
            501: 'Not Implemented',
            502: 'Bad Gateway',
            503: 'Service Unavailable',
            504: 'Gateway Timeout',
            511: 'Network Authentication Required'
        }
    })

    .def({
        whenGET: function(self, urlPattern, callback, callThrough, priority) {
            return self._storeRoute('GET', urlPattern, callback, callThrough, priority);
        },
        whenPOST: function(self, urlPattern, callback, callThrough, priority) {
            return self._storeRoute('POST', urlPattern, callback, callThrough, priority);
        },
        whenPATCH: function(self, urlPattern, callback, callThrough, priority) {
            return self._storeRoute('PATCH', urlPattern, callback, callThrough, priority);
        },
        whenPUT: function(self, urlPattern, callback, callThrough, priority) {
            return self._storeRoute('PUT', urlPattern, callback, callThrough, priority);
        },
        whenDELETE: function(self, urlPattern, callback, callThrough, priority) {
            return self._storeRoute('DELETE', urlPattern, callback, callThrough, priority);
        },
        _storeRoute: function(self, method, urlPattern, callback, callThrough, priority) {
            pyscript.check(callback, Function);
            var existing = self.routes.findOne('pattern', urlPattern);
            var update = {
                priority: priority || 1,
                pattern: new RegExp(urlPattern),
                method: method,
                callback: callback,
                callThrough: callThrough || false
            };
            if (existing) {
                pyscript.extend(existing, update)
            }
            else {
                self.routes.push(update);
            }
            return self;
        },
        mockSetup: function(self) {
            pyscript.assert(jasmine, "mockSetup() can only be called in Jasmine testing!");

            self.mockServer = {
                routes: {GET: {}, POST: {}, PATCH: {}, DELETE: {}, PUT: {}, UPLOAD: {}},
                request: function(method, url, params, headers, sync) {
                    var async = pyscript.async();
                    pyscript.defer(function() {
                        var handler = self.mockServer.routes[method][url];
                        if (pyscript.isFunction(handler)) {
                            async.bind(handler.call(null, url, params, headers, sync)).resolve();
                        }
                    });
                    return async.promise;
                },
                defRoute: function(method, url, callback) {
                    pyscript.check(method, String);
                    pyscript.check(callback, Function);
                    method = method.toUpperCase();
                    pyscript.assert(self.mockServer.routes[method], "method must be GET/POST/PATCH/PUT/DELETE.")
                    self.mockServer.routes[method][url] = callback;
                    return self.mockServer;
                }
            };

            spyOn(self, 'get').and.callFake(
                pyscript.partial(self.mockServer.request, 'GET'));
            spyOn(self, 'put').and.callFake(
                pyscript.partial(self.mockServer.request, 'PUT'));
            spyOn(self, 'del').and.callFake(
                pyscript.partial(self.mockServer.request, 'DELETE'));
            spyOn(self, 'patch').and.callFake(
                pyscript.partial(self.mockServer.request, 'PATCH'));
            spyOn(self, 'post').and.callFake(
                pyscript.partial(self.mockServer.request, 'POST'));
            spyOn(self, 'upload').and.callFake(
                pyscript.partial(self.mockServer.request, 'UPLOAD'));
        },
        get: function(self, url, headers, sync) {
            return self._send('GET', url, null, headers, sync);
        },
        del: function(self, url, headers, sync) {
            return self._send('DELETE', url, null, headers, sync);
        },
        patch: function(self, url, params, headers, sync) {
            return self._send('PATCH', url, params, headers, sync);
        },
        post: function(self, url, params, headers, sync) {
            return self._send('POST', url, params, headers, sync);
        },
        put: function(self, url, params, headers, sync) {
            return self._send('PUT', url, params, headers, sync);
        },
        upload: function(self, url, file, headers, sync) {
            self._send('POST', url, file, headers, sync, true);
        },
        _send: function(self, method, url, params, headers, sync, uploadFile) {
            pyscript.check(method, String);
            pyscript.check(method, url);

            var async = pyscript.async();

            headers = headers || {};
            if (self.headers) pyscript.extend(headers, self.headers);

            var data;
            if (uploadFile) {
                data = new FormData();
                data.append("upload", params);
            }
            else {
                data = JSON.stringify(params);
                headers['Content-Type'] = 'application/json';
            }

            var exit;
            for (var interceptor,i=0; i<self.interceptors.length; i++) {
                interceptor = self.interceptors[i];
                if (interceptor.request) {
                    exit = interceptor.request(data, {headers: headers, url: url, method: method});
                    if (exit === false) return;
                }
            }

            var route = self._matchRoute(method, url);

            if (route) {
                var response = route.callback(data, {headers: headers, url: url, method: method}) || {};
                if (!route.callThrough) {
                    var responseObject = {
                        status: response[0],
                        statusText: response[3] || self._defaultStatusText[status],
                        getResponseHeader: function(name) {
                            var headers = response[2] || {};
                            return headers[name];
                        },
                        responseText: pyscript.isString(response[1]) ?
                            response[1] : JSON.stringify(response[1])
                    };

                    pyscript.defer(function() {
                        async.bind(responseObject).resolve();
                    });
                }
            }

            if (!route || route.callThrough) {
                var xhr = new XMLHttpRequest();
                xhr.onload = handleResponse;
                xhr.onerror = handleResponse;
                xhr.open(method, url, !sync);

                for (var key in headers)
                    if (headers.hasOwnProperty(key))
                        xhr.setRequestHeader(key, headers[key]);

                xhr.send(data);
            }

            return sync ? xhr : async.promise;

            function handleResponse() {
                var exit;
                for (var interceptor,i=0; i<self.interceptors.length; i++) {
                    interceptor = self.interceptors[i];
                    if (interceptor.response) {
                        exit = interceptor.response.call(this);
                        if (exit === false) return;
                    }
                }
                self._parseStatus(this);
                async.bind(this).resolve();
            }
        },
        _matchRoute: function(self, method, url) {
            var result, route;
            var priority = -1;
            for (var i = 0; i < self.routes.length; i++) {
                route = self.routes[i];
                if (route.method == method && route.pattern.test(url)) {
                    if (route.priority > priority) {
                        priority = route.priority;
                        result = route;
                    }
                }
            }
            return result;
        },
        _parseStatus: function(self, thisArg) {
            var status = thisArg.status;
            thisArg.http = {
                success: status >= 200 && status < 400,
                redirect: status >=300 && status < 400,
                error: status >= 400,
                unavailable: status == 503,
                serverError: status >= 500,
                clientError: status >= 400 && status < 500,
                conflict: status == 409,
                created: status == 201,
                unauthorized: status == 401,
                missing: status == 404,
                badRequest: status == 400,
                noContent: status == 204,
                ok: status == 200,
                network: status == 0 || status === undefined
            };
        }
    });

pyscript.requests = pyscript.module('requests');
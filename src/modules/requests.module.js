pyscript.defmodule('requests')

    .__init__(function(self) {
        self.interceptors = [];
        self.beforeRequest = null;
        self.parsers = {echo: function(input) {return input;}};
        self.headers = null;
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
    })

    .def({
        mockSetup: function(self) {
            pyscript.assert(jasmine, "mockSetup() can only be called in Jasmine testing!");
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
        upload: function(self, url, file, sync) {
            pyscript.check(url, String);

            var async = pyscript.async();
            var formData = new FormData();

            formData.append("upload", file);
            var xhr = new XMLHttpRequest();
            xhr.onload = handleResponse;
            xhr.onerror = handleResponse;
            xhr.open('POST', url, !sync);

            if (self.headers){
                for (var header in self.headers) {
                    if (self.headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header, self.headers[header]);
                    }
                }
            }

            if (pyscript.isFunction(self.beforeRequest)) {
                self.beforeRequest.call(null, xhr);
            }
            xhr.send(formData);

            return async.promise;

            function handleResponse() {
                var exit;
                for (var i=0; i<self.interceptors.length; i++) {
                    exit = self.interceptors[i].call(this);
                    if (exit) return;
                }
                self._parseStatus(this);
                async.bind(this).resolve.apply(async);
            }
        },
        _send: function(self, method, url, params, headers, sync) {
            pyscript.check(method, String);
            pyscript.check(method, url);

            var async = pyscript.async();

            headers = pyscript.extend({'Content-Type': 'application/json'}, headers || {});
            if (self.headers) pyscript.extend(headers, self.headers);
            params = JSON.stringify(params);
            var xhr = new XMLHttpRequest();
            xhr.onload = handleResponse;
            xhr.onerror = handleResponse;
            xhr.open(method, url, !sync);
            for (var key in headers)
                if (headers.hasOwnProperty(key))
                    xhr.setRequestHeader(key, headers[key]);

            if (pyscript.isFunction(self.beforeRequest)) {
                self.beforeRequest.call(null, xhr);
            }
            xhr.send(params);

            return sync ? xhr : async.promise;

            function handleResponse() {
                var exit;
                for (var i=0; i<self.interceptors.length; i++) {
                    exit = self.interceptors[i].call(this);
                    if (exit) return;
                }
                self._parseStatus(this);
                async.bind(this).resolve();
            }
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
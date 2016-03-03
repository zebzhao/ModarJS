pyscript.defmodule('cache')

    .__init__(function(self) {
        self.onSyncSuccess = pyscript.noop;
        self._storage = pyscript.dict();
    })

    .def({
        flush: function(self) {
            self._storage.clear();
        },
        /**
         * Files that are uploaded from local will have their location hashed.
         * This enables the use of Spriter in offline mode using local images.
         * @param self
         * @param url   The target id.
         * @param file  The File object that was chosen to be uploaded.
         */
        cacheFile: function(self, url, file) {
            var async = pyscript.async();
            var reader = new FileReader();
            reader.onload = function(e) {
                self._storage[url] = {localUrl: e.target.result, file: file};
                async.resolve(url, e.target.result);
            };
            reader.readAsDataURL(file.file);
            return async.promise;
        },
        /**
         * Fetches a local url if one exists in the cache. Otherwise just returns
         * the remote url.
         * @param self
         * @param url   The remote url to check for.
         */
        fetchUrl: function(self, url) {
            return self._storage.get(url, {localUrl: url}).localUrl;
        },
        /**
         * Uploads all offline image files to the server.
         */
        syncAll: function(self) {
            pyscript.map(self.syncFile, self._storage.keys());
        },
        /**
         * Ignore things in cache which are not files
         * @param self
         * @param url {String}
         */
        syncFile: function(self, url) {
            var cached = self._storage.get(url);
            if (cached) {
                var file = cached.file;
                if (file) {
                    pyscript.requests.upload(cached.url, file.file, file)
                        .then(self.onSyncSuccess)
                }
            }
        },
        fetch: function(self, url, parser) {
            pyscript.check(url, String);

            var async = pyscript.async();

            if (self._storage.contains(url)) {
                pyscript.defer(function() {
                    async.resolve({success: false, url: url, parser: parser, result: self.get(url)});
                });
            }
            else {
                pyscript.requests.get(url)
                    .then(function() {
                        var context = {success: false, url: url, parser: parser};

                        if (this.http.success) {
                            var responseText = this.responseText || "";
                            responseText = parser ? parser(responseText) : responseText;
                            self._storage[url] = responseText;
                            context.result = responseText;
                        }
                        async.resolve(context)
                    })
            }
            return async.promise;
        },
        /**
         * Change the key of existing local key.
         * @param self
         * @param sourceKey {String}
         * @param destKey {String}
         */
        move: function(self, sourceKey, destKey) {
            pyscript.check(destKey, String);
            pyscript.check(sourceKey, String);
            if (destKey == sourceKey) {
                return;
            }
            if (!self._storage.contains(sourceKey)) {
                throw new ReferenceError('Cannot find ' + sourceKey + ' in cache!');
            }
            self._storage[destKey] = self._storage[sourceKey];
            delete self._storage[sourceKey];
        },
        delete: function(self, url) {
            pyscript.check(url, String);
            delete self._storage[url];
        },
        contains: function(self, key) {
            pyscript.check(key, String);
            return self._storage.contains(key);
        },
        store: function(self, key, value) {
            self._storage[key] = value;
        },
        find: function(self, value) {
            return self._storage.find(value);
        },
        get: function(self, id, defaultValue) {
            return self._storage.get(id, defaultValue);
        },
        /**
         * @returns {Array}
         */
        keys: function(self) {
            return self._storage.keys();
        },
        /**
         * @returns {Array}
         */
        values: function(self) {
            return self._storage.values();
        }
    });

pyscript.cache = pyscript.module('cache');
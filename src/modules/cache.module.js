pyscript.module('cache')
    
    .__init__(function(self) {
        self._storage = {};
    })

    .def({
        flush: function(self) {
            self._storage = {};
        },
        /**
         * Files that are uploaded from local will have their location hashed.
         * This enables the use of Spriter in offline mode using local images.
         * @param self
         * @param url   The target id.
         * @param file  The File object that was chosen to be uploaded.
         */
        cacheFile: function(self, url, file) {
            return new core.Promise(function(resolve, reject) {
                var reader = new FileReader();
                
                reader.onload = function(e) {
                    var result = {url: url, localUrl: e.target.result, file: file};
                    self._storage[url] = result;
                    resolve(result);
                };
                reader.onerror = function(e) {
                    reject(e);
                };
                
                reader.readAsDataURL(file);
            });
        },
        /**
         * Fetches a local url if one exists in the cache. Otherwise just returns
         * the remote url.
         * @param self
         * @param url   The remote url to check for.
         */
        fetchUrl: function(self, url) {
            var value = self._storage[url];
            return value ? value.localUrl : url;
        },
        fetch: function(self, url, parser) {
            pyscript.check(url, String);

            return new core.Promise(function(resolve, reject) {
                if (self._storage[url]) {
                    resolve({cached: true, url: url, parser: parser, result: self.get(url)});
                }
                else {
                    pyscript.requests.get(url)
                        .then(function(response) {
                            if (response.http.success) {
                                var result = response.responseText || "";
                                result = parser ? parser(result) : result;
                                resolve({cached: false, url: url, parser: parser, result: result});
                            }
                            else {
                                reject(response);
                            }
                        }, reject);
                }
            });
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
            if (self._storage[sourceKey] === undefined) {
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
            return self._storage[key] !== undefined;
        },
        store: function(self, key, value) {
            self._storage[key] = value;
        },
        get: function(self, id, defaultValue) {
            return self.contains(id) ? self._storage[id] : defaultValue;
        },
        keys: function(self) {
            return Object.keys(self._storage);
        }
    });

pyscript.cache = pyscript.module('cache');
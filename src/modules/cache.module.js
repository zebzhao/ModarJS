/**
 * Created by zeb on 27/11/15.
 */
function Cache() {
    self._storage = new Dict();
}

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
         * @param url   The target API url location, also used as an id.
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
         * Fetches a local URL if one exists in the cache. Otherwise just returns
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
                    async.resolve(self._storage[url], url);
                });
            }
            else {
                pyscript.requests.get(url)
                    .then(function() {
                        if (this.http.success) {
                            self._storage[url] = parser ? parser(this.responseText) : this.responseText;
                            async.resolve(self._storage[url], url)
                        }
                        else {
                            pykit.alert("Failed to retrieve file.", {labels: {Ok: "Ok"}});
                        }
                    })
            }
            return async.promise;
        },
        /**
         * Change the remote URL an existing local URL.
         * @param self
         * @param sourceUrl {String}
         * @param destUrl {String}
         */
        move: function(self, sourceUrl, destUrl) {
            pyscript.check(destUrl, String);
            pyscript.check(sourceUrl, String);
            if (!self._storage[sourceUrl])
                throw new ReferenceError('Cannot find ' + sourceUrl + ' in cache!');
            self._storage[destUrl] = self._storage[sourceUrl];
            delete self._storage[sourceUrl];
        },
        delete: function(self, url) {
            pyscript.check(url, String);
            delete self._storage[url];
        },
        contains: function(self, url) {
            pyscript.check(url, String);
            return self._storage.contains(url);
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

pyscript.initialize('cache');
pyscript.cache = pyscript.module('cache');
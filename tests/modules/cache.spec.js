describe('cache.module', function () {
    it('should move cached keys to another key', function(done) {
        pyscript.initialize('cache')
            .then(function() {
                pyscript.cache.store("keyA", "");
                expect(pyscript.cache.get("keyA")).toBe("");
                pyscript.cache.move("keyA", "keyB");
                expect(pyscript.cache.get("keyA")).toBeUndefined();
                expect(pyscript.cache.get("keyB")).toBe("");
                pyscript.cache.move("keyB", "keyB");
                expect(pyscript.cache.get("keyB")).toBe("");
                done();
            });
    });

    it('should delete cached key', function(done) {
        pyscript.initialize('cache')
            .then(function() {
                pyscript.cache.store("keyB", "test");
                expect(pyscript.cache.get("keyB")).toBe("test");
                expect(pyscript.cache.contains("keyB")).toBeTruthy();
                expect(pyscript.cache.delete("keyB"));
                expect(pyscript.cache.get("keyB")).toBeUndefined();
                expect(pyscript.cache.contains("keyB")).toBeFalsy();
                done();
            });
    });

    it('should get values and keys', function(done) {
        pyscript.initialize('cache')
            .then(function() {
                pyscript.cache.store("keyZ", "one");
                expect(pyscript.cache.values()).toEqual(["one"]);
                expect(pyscript.cache.keys()).toEqual(["keyZ"]);
                done();
            });
    });

    it('should flush all', function(done) {
        pyscript.initialize('cache')
            .then(function() {
                pyscript.cache.store("keyZ", "one");
                expect(pyscript.cache.keys().length).toBe(1);
                pyscript.cache.flush();
                expect(pyscript.cache.keys().length).toBe(0);
                done();
            });
    });

    it('should fetch values from cache', function(done) {
        pyscript.initialize('cache')
            .then(function() {
                pyscript.cache.store("keyZ", "one");
                pyscript.cache.fetch("keyZ", function(a) { return a + "--server-parsing" })
                    .then(function(value) {
                        expect(value.result).toBe("one");
                        expect(value.success).toBe(true);
                        expect(value.cached).toBe(true);
                        done();
                    });
            });
    });

    it('should fetch values from server', function(done) {
        pyscript.initialize('cache')
            .then(function() {
                pyscript.cache.flush();
                pyscript.requests = {};
                pyscript.requests.get = jasmine.createSpy(
                    "get() Request mock").and.returnValue({then: pyscript.noop});

                pyscript.cache.fetch("keyZ");

                expect(pyscript.requests.get).toHaveBeenCalledWith('keyZ');
                done();
            });
    });
});
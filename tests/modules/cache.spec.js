describe('cache.module', function () {
    beforeEach(function(done) {
        pyscript.initialize('cache').then(function() {
            done();
        });
    });


    afterEach(function() {
        pyscript.cache.flush();
    });


    it('should move cached keys to another key', function() {
        pyscript.cache.store("keyA", "");
        expect(pyscript.cache.get("keyA")).toBe("");
        pyscript.cache.move("keyA", "keyB");
        expect(pyscript.cache.get("keyA")).toBeUndefined();
        expect(pyscript.cache.get("keyB")).toBe("");
        pyscript.cache.move("keyB", "keyB");
        expect(pyscript.cache.get("keyB")).toBe("");
    });


    it('should find item by value', function() {
        pyscript.cache.store("keyV", "valueV");
        expect(pyscript.cache.find("valueV")).toBe("keyV");
    });


    it('should delete cached key', function() {
        pyscript.cache.store("keyB", "test");
        expect(pyscript.cache.get("keyB")).toBe("test");
        expect(pyscript.cache.contains("keyB")).toBeTruthy();
        expect(pyscript.cache.delete("keyB"));
        expect(pyscript.cache.get("keyB")).toBeUndefined();
        expect(pyscript.cache.contains("keyB")).toBeFalsy();
    });


    it('should get values and keys', function() {
        pyscript.cache.store("keyZ", "one");
        expect(pyscript.cache.values()).toEqual(["one"]);
        expect(pyscript.cache.keys()).toEqual(["keyZ"]);
    });


    it('should flush all', function() {
        pyscript.cache.store("keyZ", "one");
        expect(pyscript.cache.keys().length).toBe(1);
        pyscript.cache.flush();
        expect(pyscript.cache.keys().length).toBe(0);
    });


    it('should fetch values from cache', function(done) {
        pyscript.cache.store("keyZ", "one");
        pyscript.cache.fetch("keyZ",
            function(a) { return a + "--server-parsing" })
            .then(function(value) {
                expect(value.result).toBe("one");
                expect(value.success).toBe(true);
                expect(value.cached).toBe(true);
                done();
            });
    });


    describe('cache.module fetch', function() {
        beforeEach(function(done) {
            pyscript.initialize('requests').then(function() {
                done();
            });
        });

        it('should fetch values from server', function() {
            pyscript.cache.flush();
            pyscript.requests.mockSetup();
            pyscript.cache.fetch("keyZ");

            expect(pyscript.requests.get).toHaveBeenCalledWith('keyZ');
        });
    });
});
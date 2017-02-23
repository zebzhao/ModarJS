describe('cache.module', function () {
    beforeEach(function(done) {
        jQuip.initialize('cache').then(function() {
            done();
        });
    });


    afterEach(function() {
        jQuip.cache.flush();
    });


    it('should move cached keys to another key', function() {
        jQuip.cache.store("keyA", "");
        expect(jQuip.cache.get("keyA")).toBe("");
        jQuip.cache.move("keyA", "keyB");
        expect(jQuip.cache.get("keyA")).toBeUndefined();
        expect(jQuip.cache.get("keyB")).toBe("");
        jQuip.cache.move("keyB", "keyB");
        expect(jQuip.cache.get("keyB")).toBe("");
    });


    it('should delete cached key', function() {
        jQuip.cache.store("keyB", "test");
        expect(jQuip.cache.get("keyB")).toBe("test");
        expect(jQuip.cache.contains("keyB")).toBeTruthy();
        expect(jQuip.cache.delete("keyB"));
        expect(jQuip.cache.get("keyB")).toBeUndefined();
        expect(jQuip.cache.contains("keyB")).toBeFalsy();
    });


    it('should get keys', function() {
        jQuip.cache.store("keyZ", "one");
        expect(jQuip.cache.keys()).toEqual(["keyZ"]);
    });


    it('should flush all', function() {
        jQuip.cache.store("keyZ", "one");
        expect(jQuip.cache.keys().length).toBe(1);
        jQuip.cache.flush();
        expect(jQuip.cache.keys().length).toBe(0);
    });


    it('should fetch values from cache', function(done) {
        jQuip.cache.store("keyZ", "one");
        jQuip.cache.fetch("keyZ",
            function(a) { return a + "--server-parsing" })
            .then(function(value) {
                expect(value.result).toBe("one");
                expect(value.cached).toBe(true);
                done();
            });
    });


    describe('cache.module fetch', function() {
        beforeEach(function(done) {
            jQuip.initialize('requests').then(function(requests) {
                requests.whenGET(/cachekeyZ/, function() {
                    return [200, "Awesome"];
                });
                done();
            });
        });

        it('should fetch values from server', function(done) {
            jQuip.cache.fetch("cachekeyZ",
                function(value) { return value + ":Parsed"; })
                .then(function(context) {
                    expect(context.result).toBe("Awesome:Parsed");
                    done();
                });
        });
    });
});
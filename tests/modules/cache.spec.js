describe('cache.module', function () {
    beforeEach(function(done) {
        modar.initialize('cache').then(function() {
            done();
        });
    });


    afterEach(function() {
        modar.cache.flush();
    });


    it('should move cached keys to another key', function() {
        modar.cache.store("keyA", "");
        expect(modar.cache.get("keyA")).toBe("");
        modar.cache.move("keyA", "keyB");
        expect(modar.cache.get("keyA")).toBeUndefined();
        expect(modar.cache.get("keyB")).toBe("");
        modar.cache.move("keyB", "keyB");
        expect(modar.cache.get("keyB")).toBe("");
    });


    it('should delete cached key', function() {
        modar.cache.store("keyB", "test");
        expect(modar.cache.get("keyB")).toBe("test");
        expect(modar.cache.contains("keyB")).toBeTruthy();
        expect(modar.cache.delete("keyB"));
        expect(modar.cache.get("keyB")).toBeUndefined();
        expect(modar.cache.contains("keyB")).toBeFalsy();
    });


    it('should get keys', function() {
        modar.cache.store("keyZ", "one");
        expect(modar.cache.keys()).toEqual(["keyZ"]);
    });


    it('should flush all', function() {
        modar.cache.store("keyZ", "one");
        expect(modar.cache.keys().length).toBe(1);
        modar.cache.flush();
        expect(modar.cache.keys().length).toBe(0);
    });


    it('should fetch values from cache', function(done) {
        modar.cache.store("keyZ", "one");
        modar.cache.fetch("keyZ",
            function(a) { return a + "--server-parsing" })
            .then(function(value) {
                expect(value.result).toBe("one");
                expect(value.cached).toBe(true);
                done();
            });
    });


    describe('cache.module fetch', function() {
        beforeEach(function(done) {
            modar.initialize('requests').then(function(requests) {
                requests.whenGET(/cachekeyZ/, function() {
                    return [200, "Awesome"];
                });
                done();
            });
        });

        it('should fetch values from server', function(done) {
            modar.cache.fetch("cachekeyZ",
                function(value) { return value + ":Parsed"; })
                .then(function(context) {
                    expect(context.result).toBe("Awesome:Parsed");
                    done();
                });
        });
    });
});
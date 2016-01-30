describe('deferred', function () {
    it('should resolve', function(done) {
        var async = pyscript.async();
        async.promise.then(function(a, b, c) {
            expect([a, b, c]).toEqual(['1', '2', '3']);
            done();
        });
        async.resolve('1', '2', '3');
    });
});
describe('router.module', function () {
    it('should monitor hash changes', function(done) {
        pyscript.initialize('router')
            .then(function() {
                pyscript.router
                    .route('/test', function() {
                        done();
                    });
                window.location.hash = '/test';
            });
    });

    it('should turn parameters to query string', function(done) {
        pyscript.initialize('router')
            .then(function(router) {
                expect(router.asQueryString(
                    {param1: 600, not: undefined, sing: "master"})).toBe("?param1=600&sing=master");
                done();
            });
    });
});
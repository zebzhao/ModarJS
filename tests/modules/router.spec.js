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
});
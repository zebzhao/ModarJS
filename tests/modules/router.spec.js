describe('router.module', function () {
    beforeEach(function(done) {
        pyscript.initialize('router').then(function() {
            done();
        });
    });


    it('should monitor hash changes', function(done) {
        pyscript.router.route('/test', function() {
            done();
        });
        window.location.hash = '/test';
    });


    it('should turn parameters to query string', function() {
        expect(pyscript.router.asQueryString(
            {param1: 600, not: undefined, sing: "master"})).toBe("?param1=600&sing=master");
    });


    it('should never force page refresh during mock', function() {
        pyscript.router.mockSetup();
        pyscript.router.redirect('nice');
    });

    it('should never force page refresh during mock', function() {
        pyscript.router.mockSetup();
        pyscript.router.query({sample: 'why', my: 'my'});
        expect(pyscript.router.proxy.getHref().split('?')[1]).toBe('sample=why&my=my');
    });
});
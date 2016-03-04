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

    it('should should throw error upon refresh', function() {
        pyscript.router.mockSetup(true);
        expect(function() {
            pyscript.router.query({sample: 'why', my: 'my'});
        }).toThrowError();
    });

    it('should invoke promises during mock', function(done) {
        pyscript.router.mockSetup();
        pyscript.router.go('/route').then(function() {
            done();
        });
    });

    it('should invoke routes callback during mock', function(done) {
        pyscript.router.mockSetup();
        pyscript.router.route('/route', function() {
            done();
        });
        pyscript.router.go('/route');
    });
});
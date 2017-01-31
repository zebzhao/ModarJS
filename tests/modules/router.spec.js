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

    it('should parse query from router', function() {
        expect(pyscript.router.asQueryString(
            {a: 600, b: undefined, c: 0, d: false})).toBe("?a=600&c=0&d=false");
        window.location.hash = '?a=600&c=0&d=false';
        expect(pyscript.router.parseQuery('?a=600&c=0&d=false')).toEqual({a: '600', c: '0', d: 'false'});
        expect(pyscript.router.parseQuery()).toEqual({a: '600', c: '0', d: 'false'});
    });

    it('should query', function() {
        window.location.hash = '';
        pyscript.router.query({a: 1});
        expect(window.location.hash).toBe('#?a=1');
        pyscript.router.query({b: 1, c: 0});
        expect(window.location.hash).toBe('#?a=1&b=1&c=0');
        pyscript.router.query({a: undefined, c: undefined});
        expect(window.location.hash).toBe('#?b=1');
    });
});
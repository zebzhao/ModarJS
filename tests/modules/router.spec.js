describe('router.module', function () {
    beforeEach(function(done) {
        modar.initialize('router').then(function() {
            done();
        });
    });


    it('should monitor hash changes', function(done) {
        modar.router.route('/test', function() {
            done();
        });
        window.location.hash = '/test';
    });


    it('should turn parameters to query string', function() {
        expect(modar.router.asQueryString(
            {param1: 600, not: undefined, sing: "master"})).toBe("?param1=600&sing=master");
    });


    it('should never force page refresh during mock', function() {
        modar.router.mockSetup();
        modar.router.redirect('nice');
    });

    it('should never force page refresh during mock', function() {
        modar.router.mockSetup();
        modar.router.query({sample: 'why', my: 'my'});
        expect(modar.router.proxy.getHref().split('?')[1]).toBe('sample=why&my=my');
    });

    it('should should throw error upon refresh', function() {
        modar.router.mockSetup(true);
        expect(function() {
            modar.router.query({sample: 'why', my: 'my'});
        }).toThrowError();
    });

    it('should invoke promises during mock', function(done) {
        modar.router.mockSetup();
        modar.router.go('/route').then(function() {
            done();
        });
    });

    it('should invoke routes callback during mock', function(done) {
        modar.router.mockSetup();
        modar.router.route('/route', function() {
            done();
        });
        modar.router.go('/route');
    });

    it('should parse query from router', function() {
        expect(modar.router.asQueryString(
            {a: 600, b: undefined, c: 0, d: false})).toBe("?a=600&c=0&d=false");
        window.location.hash = '?a=600&c=0&d=false';
        expect(modar.router.parseQuery('?a=600&c=0&d=false')).toEqual({a: '600', c: '0', d: 'false'});
        expect(modar.router.parseQuery()).toEqual({a: '600', c: '0', d: 'false'});
    });

    it('should query', function() {
        window.location.hash = '';
        modar.router.query({a: 1});
        expect(window.location.hash).toBe('#?a=1');
        modar.router.query({b: 1, c: 0});
        expect(window.location.hash).toBe('#?a=1&b=1&c=0');
        modar.router.query({a: undefined, c: undefined});
        expect(window.location.hash).toBe('#?b=1');
    });
});
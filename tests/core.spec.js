describe('pyscript', function () {
    it('partial should inject arguments', function() {
        var functions = {
            abc: function(a, b, c, d, e, f) {
                expect([a, b, c]).toEqual([1, 2, 3]);
                expect(this).toEqual(0);
                return [a, b, c, d, e, f];
            }
        };
        functions.abc = pyscript.partial(functions.abc, 1, 2, 3);
        expect(functions.abc.call(0, 4, 5, 6)).toEqual([1, 2, 3, 4, 5, 6]);
    });


    it('map', function() {
        expect(pyscript.map(function (x) { return x*2 },
            [1, 2, 3])).toEqual([2, 4, 6]);
        expect(pyscript.map(function (x) { return x*2 },
            {1:1, 2:2, 3:3})).toEqual({1:2, 2:4, 3:6});
    });


    it('type', function() {
        expect(pyscript.type(function () {})).toBe('function');
    });


    it('it should extend like overwrite', function() {
        expect(pyscript.extend({a: "1"}, {a: "2"})).toEqual({a: "2"});
        expect(pyscript.extend({a: "1"}, {a: undefined})).toEqual({a: "1"});
        expect(pyscript.extend({a: "1"}, {a: null})).toEqual({a: null});
    });


    it('range', function() {
        expect(pyscript.range(3)).toEqual([0, 1, 2]);
        expect(pyscript.range(3, 6)).toEqual([3, 4, 5]);
        expect(pyscript.range(3, 6, 2)).toEqual([3, 5]);
    });


    it('any', function() {
        expect(pyscript.any(function(a) {return a==1}, {'1': 1, '2': 2})).toBeTruthy();
        expect(pyscript.any(function(a) {return a==2}, {'2': 1})).toBeFalsy();
    });


    it('all', function() {
        expect(pyscript.all(function(a) {return a==1}, {'1': 1, '2': 2})).toBeFalsy();
        expect(pyscript.all(function(a) {return a==1}, {'2': 1})).toBeTruthy();
    });


    it('should load requests', function(done) {
        pyscript.initialize('requests').then(function() {
            done();
        });
    });


    it('should handle duplicate loading', function(done) {
        var initCount = 0;
        pyscript.module('dup1').__init__(function() {
            initCount++;
        });
        pyscript.initialize('dup1').then(function() {
            // This was called first, will initiate actual loading.
            initCount++;
            expect(initCount).toBe(3);
            done();
        });
        pyscript.initialize('dup1').then(function() {
            initCount++;
        });
    });


    it('should handle aliasing', function() {
        pyscript.alias('http://bull.js', 'cow.js');
        pyscript.import('http://bull.js');
        expect(document.head.getElementsByTagName('script')[0].getAttribute('src')).toBe('cow.js');
    });
});
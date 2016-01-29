describe('PyScript', function () {
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

    it('map should map', function() {
        expect(pyscript.map(function (x) { return x*2 },
            [1, 2, 3])).toEqual([2, 4, 6]);
        expect(pyscript.map(function (x) { return x*2 },
            {1:1, 2:2, 3:3})).toEqual({1:2, 2:4, 3:6});
    });

    it('type should give type', function() {
        expect(pyscript.type(function () {})).toBe('function');
    });

    it('it should extend like overwrite', function() {
        expect(pyscript.extend({a: "1"}, {a: "2"})).toEqual({a: "2"});
        expect(pyscript.extend({a: "1"}, {a: undefined})).toEqual({a: "1"});
        expect(pyscript.extend({a: "1"}, {a: null})).toEqual({a: null});
    });

    it('range should be work', function() {
        expect(pyscript.range(3)).toEqual([0, 1, 2]);
        expect(pyscript.range(3, 6)).toEqual([3, 4, 5]);
        expect(pyscript.range(3, 6, 2)).toEqual([3, 5]);
    })
});
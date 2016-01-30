describe('assert', function () {
    it('check string', function() {
        pyscript.check('', String);
        expect(function() {
            pyscript.check(null, String)
        }).toThrowError();
    });

    it('check array', function() {
        pyscript.check([], Array);
        expect(function() {
            pyscript.check('', Array)
        }).toThrowError();
    });

    it('check obj', function() {
        pyscript.check({a: ''}, {a: String});
        expect(function() {
            pyscript.check({p: ''}, {p: Array})
        }).toThrowError();
    });

    it('assert', function() {
        expect(function() {
            pyscript.assert(false)
        }).toThrowError();
        pyscript.assert(true);
    });
});
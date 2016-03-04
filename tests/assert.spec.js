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


    it('check number', function() {
        pyscript.check(0, Number);
        pyscript.check(-1, Number);
        pyscript.check(1.23, Number);
        expect(function() {
            pyscript.check(false, Number);
        }).toThrowError();
    });


    it('check boolean', function() {
        pyscript.check(false, Boolean);
        pyscript.check(true, Boolean);
        expect(function() {
            pyscript.check(undefined, Boolean);
        }).toThrowError();
    });


    it('check defined', function() {
        pyscript.check(false, pyscript.isDefined);
        pyscript.check(null, pyscript.isDefined);
    });


    it('assert', function() {
        expect(function() {
            pyscript.assert(false)
        }).toThrowError();
        pyscript.assert(true);
    });
});
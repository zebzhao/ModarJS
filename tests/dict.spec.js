describe('dict', function () {
    it('should initialize with object', function() {
        var dict = pyscript.dict({a: 1, b: 2});
        expect(dict.keys()).toEqual(['a', 'b']);
        expect(dict.values()).toEqual([1, 2]);
    });


    it('should contain and clear', function() {
        var dict = pyscript.dict({a: 1, b: 2});
        expect(dict.contains('a')).toBeTruthy();
        expect(dict.contains(2)).toBeFalsy();
        dict.clear();
        expect(dict.contains('a')).toBeFalsy();
    });


    it('should get even if falsey', function() {
        var dict = pyscript.dict({a: false, b: null, c: ""});
        expect(dict.get('a', 500)).toBe(false);
        expect(dict.get('b')).toBe(null);
        expect(dict.get('c')).toBe("");
        expect(dict.get('d', 100)).toBe(100);
    });


    it('should find a', function() {
        var dict = pyscript.dict({a: 1, b: 2});
        expect(dict.find(1)).toBe('a');
    });


    it('should extend dict', function() {
        var dict = pyscript.dict({a: 1, b: 2});
        expect(dict.update({c: 3, d: 4}).keys()).toEqual(['a', 'b', 'c', 'd']);
    });
});
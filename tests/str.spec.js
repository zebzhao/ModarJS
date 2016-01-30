describe('lst', function () {
    it('should initialize with object', function() {
        var str = pyscript.str('great');
        expect(str.string).toBe('great');
    });

    it('should contain', function() {
        var str = pyscript.str('great');
        expect(str.contains('eat')).toBeTruthy();
        expect(str.contains('rest')).toBeFalsy();
    });

    it('should truncate with ellipsis', function() {
        var str = pyscript.str('greater');
        expect(str.ellipsis(5)).toBe('gr...');
    });

    it('should beginsWith', function() {
        var str = pyscript.str('great');
        expect(str.beginsWith('gr')).toBeTruthy();
        expect(str.beginsWith('at')).toBeFalsy();
    });

    it('should endsWith', function() {
        var str = pyscript.str('great');
        expect(str.endsWith('gr')).toBeFalsy();
        expect(str.endsWith('at')).toBeTruthy();
    });

    it('should replaceLastIndexOf', function() {
        var str = pyscript.str('great');
        expect(str.replaceLastIndexOf('gr', 'tr')).toBe('treat');
        expect(str.replaceLastIndexOf('at', 'et')).toBe('greet');
    });

    it('should convert toCamelCase', function() {
        var str = pyscript.str('great');
        expect(str.toCamelCase()).toBe('great');
        expect(pyscript.str('bob the slayer').toCamelCase()).toBe('bobTheSlayer');
    });

    it('should format with sprintf', function() {
        var str = pyscript.str('great {man}, {slayer}');
        expect(str.sprintf({man: 'bob', slayer: 'batter'})).toBe('great bob, batter');
    });
});
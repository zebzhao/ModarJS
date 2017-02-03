describe('lst', function () {
    it('should initialize with object', function() {
        var str = modar.str('great');
        expect(str.string).toBe('great');
    });


    it('should contain', function() {
        var str = modar.str('great');
        expect(str.contains('eat')).toBeTruthy();
        expect(str.contains('rest')).toBeFalsy();
    });


    it('should truncate with ellipsis', function() {
        var str = modar.str('greater');
        expect(str.ellipsis(5)).toBe('gr...');
    });


    it('should beginsWith', function() {
        var str = modar.str('great');
        expect(str.beginsWith('gr')).toBeTruthy();
        expect(str.beginsWith('at')).toBeFalsy();
    });


    it('should endsWith', function() {
        var str = modar.str('great');
        expect(str.endsWith('gr')).toBeFalsy();
        expect(str.endsWith('at')).toBeTruthy();
    });


    it('should replaceLastIndexOf', function() {
        var str = modar.str('great');
        expect(str.replaceLastIndexOf('gr', 'tr')).toBe('treat');
        expect(str.replaceLastIndexOf('at', 'et')).toBe('greet');
        expect(str.replaceLastIndexOf('eat', 'ow')).toBe('grow');
    });


    it('should convert toCamelCase', function() {
        var str = modar.str('great');
        expect(str.toCamelCase()).toBe('great');
        expect(modar.str('bob the slayer').toCamelCase()).toBe('bobTheSlayer');
    });


    it('should format', function() {
        var str = modar.str('great {man}, {slayer}');
        expect(str.format({man: 'bob', slayer: 'batter'})).toBe('great bob, batter');
    });


    it('should split', function() {
        var arr = modar.str('this is awesome').split(" ", 1);
        expect(arr).toEqual(["this", "is awesome"]);
    });
});
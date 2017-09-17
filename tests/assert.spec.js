describe('assert', function () {
    it('should check string', function () {
        expect($Q.check("", String)).toBeTruthy();
        expect($Q.check("", Number)).toBeFalsy();
        expect($Q.check("", Object)).toBeFalsy();
        expect($Q.check("", {})).toBeFalsy();
        expect($Q.check("", Function)).toBeFalsy();
    });

    it('should check number', function () {
        expect($Q.check(0, Number)).toBeTruthy();
        expect($Q.check(-1, Number)).toBeTruthy();
        expect($Q.check(0, String)).toBeFalsy();
        expect($Q.check(0, Object)).toBeFalsy();
        expect($Q.check(1, {})).toBeFalsy();
        expect($Q.check(1, Function)).toBeFalsy();
    });

    it('should check object', function () {
        expect($Q.check({id: "", num: 0}, {id: String, num: Number})).toBeTruthy();
        expect($Q.check({id: "", num: 0}, Object)).toBeTruthy();
        expect($Q.check({id: "", num: ""}, {id: String, num: Number})).toBeFalsy();
        expect($Q.check({id: ""}, {id: String, num: Number})).toBeFalsy();
        expect($Q.check({id: 0, num: 0}, {id: String, num: Number})).toBeFalsy();
    });

    it('should check object', function () {
        expect($Q.check({id: "", num: 0}, {id: String, num: Number})).toBeTruthy();
        expect($Q.check({id: "", num: 0}, Object)).toBeTruthy();
        expect($Q.check({id: "", num: ""}, {id: String, num: Number})).toBeFalsy();
        expect($Q.check({id: ""}, {id: String, num: Number})).toBeFalsy();
        expect($Q.check({id: 0, num: 0}, {id: String, num: Number})).toBeFalsy();
    });

    it('should check function', function () {
        expect($Q.check(function () {}, Function)).toBeTruthy();
        expect($Q.check(function () {}, Object)).toBeFalsy();
        expect($Q.check(function () {}, {})).toBeFalsy();
    });

    it('should check array', function () {
        expect($Q.check([], Array)).toBeTruthy();
        expect($Q.check([], Object)).toBeFalsy();
        expect($Q.check([], Number)).toBeFalsy();
        expect($Q.check([], String)).toBeFalsy();
        expect($Q.check([], {})).toBeFalsy();
    });
});
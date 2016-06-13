describe('lst', function () {
    it('should append', function() {
        var list = pyscript.list([1, 2, 3]);
        list.push(4);
        expect(list.slice()).toEqual([1, 2, 3, 4]);
    });


    it('should remove', function() {
        var list = pyscript.list([1, 2, 3, 4]);
        expect(list.remove(4)).toBeTruthy();
        expect(list.remove(4)).toBeFalsy();
        expect(list.slice()).toEqual([1, 2, 3]);
    });


    it('should get first and last', function() {
        var list = pyscript.list([1, 2, 3, 4]);
        expect(list.first()).toBe(1);
        expect(list.last()).toBe(4);
    });


    it('should invoke', function() {
        var list = pyscript.list([1, 2, 3, 4]);
        expect(list.map(function(a) {return a+1})).toEqual([2, 3, 4, 5]);
    });


    it('should find', function() {
        var list = pyscript.list([{'a': 1}, {'v': 2}, {'a': 2}, {'a': 2}]);
        expect(list.findWhere('a', 1).length).toBe(1);
        expect(list.findWhere('a', 2).length).toBe(2);
    });
});
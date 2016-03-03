describe('cache.module', function () {
    it('should move cached keys to another key', function(done) {
        pyscript.initialize('cache')
            .then(function() {
                pyscript.cache.store("keyA", "");
                expect(pyscript.cache.get("keyA")).toBe("");
                pyscript.cache.move("keyA", "keyB");
                expect(pyscript.cache.get("keyA")).toBeUndefined();
                expect(pyscript.cache.get("keyB")).toBe("");
                pyscript.hotkeys.dispatchKeyEvent({keyCode: 'S'.charCodeAt(0), target: {tagName: ''}});
                pyscript.hotkeys.clearModifiers({keyCode: 32, ctrlKey: true, target: {tagName: ''}});
                done();
            });
    });
});
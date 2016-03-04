describe('hotkeys.module', function () {
    beforeEach(function(done) {
        pyscript.initialize('hotkeys').then(function() {
            done();
        });
    });


    it('should detect key', function(done) {
        pyscript.hotkeys.addKey('s', function() {
            done();
        });
        pyscript.hotkeys.dispatchKeyEvent({keyCode: 'S'.charCodeAt(0), target: {tagName: ''}});
        pyscript.hotkeys.clearModifiers({keyCode: 32, ctrlKey: true, target: {tagName: ''}});
    });


    it('should detect key combos', function(done) {
        pyscript.hotkeys.addKey('ctrl-space', function(e) {
            expect(e.ctrlKey).toBeTruthy();
            done();
        });
        pyscript.hotkeys.dispatchKeyEvent({keyCode: 32, ctrlKey: true, target: {tagName: ''}});
        pyscript.hotkeys.clearModifiers({keyCode: 32, ctrlKey: true, target: {tagName: ''}});
    });
});
describe('hotkeys.module', function () {
    it('should detect key', function(done) {
        pyscript.initialize('hotkeys')
            .then(function() {
                pyscript.hotkeys.addKey('s', function() {
                    done();
                });
                pyscript.hotkeys.dispatchKeyEvent({keyCode: 's'.charCodeAt(0), target: {tagName: ''}});
            });
    });

    it('should detect key combos', function(done) {
        pyscript.initialize('hotkeys')
            .then(function() {
                pyscript.hotkeys.addKey('ctrl-space', function(e) {
                    expect(e.ctrlKey).toBeTruthy();
                    done();
                });
                pyscript.hotkeys.dispatchKeyEvent({keyCode: 32, ctrlKey: true, target: {tagName: ''}});
                pyscript.hotkeys.clearModifiers({keyCode: 32, ctrlKey: true, target: {tagName: ''}});
            });
    });
});
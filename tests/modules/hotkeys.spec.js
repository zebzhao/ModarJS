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
        console.log(pyscript.defmodule('hotkeys')._status)
        pyscript.initialize('hotkeys')
            .then(function() {
                pyscript.hotkeys.addKey('ctrl-space', function() {
                    done();
                });
                pyscript.hotkeys.dispatchKeyEvent({keyCode: 32, ctrlKey: true, target: {tagName: ''}});
            });
    });
});
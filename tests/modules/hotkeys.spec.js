describe('hotkeys.module', function () {
    beforeEach(function(done) {
        modar.initialize('hotkeys').then(function() {
            done();
        });
    });


    it('should detect key', function(done) {
        modar.hotkeys.addKey('s', function() {
            done();
        });
        modar.hotkeys.dispatchKeyEvent({keyCode: 'S'.charCodeAt(0), target: {tagName: ''}});
        modar.hotkeys.clearModifiers({keyCode: 32, ctrlKey: true, target: {tagName: ''}});
    });


    it('should detect key combos', function(done) {
        modar.hotkeys.addKey('ctrl-space', function(e) {
            expect(e.ctrlKey).toBeTruthy();
            done();
        });
        modar.hotkeys.dispatchKeyEvent({keyCode: 32, ctrlKey: true, target: {tagName: ''}});
        modar.hotkeys.clearModifiers({keyCode: 32, ctrlKey: true, target: {tagName: ''}});
    });
});
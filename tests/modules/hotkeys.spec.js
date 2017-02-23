describe('hotkeys.module', function () {
    beforeEach(function(done) {
        jQuip.initialize('hotkeys').then(function() {
            done();
        });
    });


    it('should detect key', function(done) {
        jQuip.hotkeys.addKey('s', function() {
            done();
        });
        jQuip.hotkeys.dispatchKeyEvent({keyCode: 'S'.charCodeAt(0), target: {tagName: ''}});
        jQuip.hotkeys.clearModifiers({keyCode: 32, ctrlKey: true, target: {tagName: ''}});
    });


    it('should detect key combos', function(done) {
        jQuip.hotkeys.addKey('ctrl-space', function(e) {
            expect(e.ctrlKey).toBeTruthy();
            done();
        });
        jQuip.hotkeys.dispatchKeyEvent({keyCode: 32, ctrlKey: true, target: {tagName: ''}});
        jQuip.hotkeys.clearModifiers({keyCode: 32, ctrlKey: true, target: {tagName: ''}});
    });
});
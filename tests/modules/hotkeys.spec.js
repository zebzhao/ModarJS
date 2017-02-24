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
    });


    it('should detect key combos', function(done) {
        jQuip.hotkeys.addKey('ctrl-space', function(e) {
            expect(e.ctrlKey).toBeTruthy();
            done();
        });
        jQuip.hotkeys.dispatchKeyEvent({keyCode: 32, ctrlKey: true, target: {tagName: ''}});
    });

    it('should isolate scope of keys', function() {
        var spyTarget = {method: function() {}, method2: function() {}};
        var spyFunc = spyOn(spyTarget, 'method');
        var spyFunc2 = spyOn(spyTarget, 'method2');
        jQuip.hotkeys.addKey('p', 'scope1', spyTarget.method);
        jQuip.hotkeys.addKey('p', 'all', spyTarget.method2);
        jQuip.hotkeys.scope = 'scope1';
        jQuip.hotkeys.dispatchKeyEvent({keyCode: 'P'.charCodeAt(0), target: {tagName: ''}});
        expect(spyFunc).toHaveBeenCalledTimes(1);
        expect(spyFunc2).toHaveBeenCalledTimes(1);
        jQuip.hotkeys.scope = 'none';
        jQuip.hotkeys.dispatchKeyEvent({keyCode: 'P'.charCodeAt(0), target: {tagName: ''}});
        expect(spyFunc).toHaveBeenCalledTimes(1);
        expect(spyFunc2).toHaveBeenCalledTimes(2);
        jQuip.hotkeys.scope = 'all';
        jQuip.hotkeys.dispatchKeyEvent({keyCode: 'P'.charCodeAt(0), target: {tagName: ''}});
        expect(spyFunc).toHaveBeenCalledTimes(2);
        expect(spyFunc2).toHaveBeenCalledTimes(3);
    });
});
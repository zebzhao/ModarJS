describe('core', function () {

  it('should extend like overwrite', function () {
    expect(jQuip.extend({a: "1"}, {a: "2"})).toEqual({a: "2"});
    expect(jQuip.extend({a: "1"}, {a: undefined})).toEqual({a: "1"});
    expect(jQuip.extend({a: "1"}, {a: null})).toEqual({a: null});
  });


  it("should resolve empty Promise.all", function (done) {
    Promise.all([]).then(function () {
      done();
    });
  });


  it('should handle duplicate loading', function (done) {
    var initCount = 0;
    jQuip.module('dup1').__init__(function () {
      initCount++;
    });
    jQuip.initialize('dup1').then(function () {
      // This was called first, will initiate actual loading.
      initCount++;
      expect(initCount).toBe(3);
      done();
    });
    jQuip.initialize('dup1').then(function () {
      initCount++;
    });
  });


  it('should handle aliasing', function () {
    jQuip.alias('http://bull.js', 'cow.js');
    jQuip.import('http://bull.js');
    expect(document.head.getElementsByTagName('script')[0].getAttribute('src')).toBe('cow.js');
  });
});
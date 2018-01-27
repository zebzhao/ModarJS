describe('core', function () {
  it('partial should inject arguments', function () {
    var functions = {
      abc: function (a, b, c, d, e, f) {
        expect([a, b, c]).toEqual([1, 2, 3]);
        expect(this).toEqual(0);
        return [a, b, c, d, e, f];
      }
    };
    functions.abc = jQuip.partial(functions.abc, 1, 2, 3);
    expect(functions.abc.call(0, 4, 5, 6)).toEqual([1, 2, 3, 4, 5, 6]);
  });


  it('it should extend like overwrite', function () {
    expect(jQuip.extend({a: "1"}, {a: "2"})).toEqual({a: "2"});
    expect(jQuip.extend({a: "1"}, {a: undefined})).toEqual({a: "1"});
    expect(jQuip.extend({a: "1"}, {a: null})).toEqual({a: null});
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
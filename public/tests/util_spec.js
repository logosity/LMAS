describe('util', function() {
  describe('partition',function() {
    it('splits arrays into n sized chunks', function() {
      var a = [1,2,3,4,5,6,7,8];
      expect(util.partition(a,4)).toEqual([[1,2,3,4],[5,6,7,8]]);
    });
    it('retains the tail for partials', function() {
      var a = [1,2,3,4,5,6,7];
      expect(util.partition(a,4)).toEqual([[1,2,3,4],[5,6,7]]);
    });
  });
  describe('get', function() {
    it('finds an object by attribute and value', function() {
      var objs = [{foo:1, bar:2}, {foo:3,bar:4}];
      expect(util.get(objs,"foo",1).bar).toEqual(2);
    });  
  });
});



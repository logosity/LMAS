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



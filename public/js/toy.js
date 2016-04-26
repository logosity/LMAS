function Toy() {
//  this.compile(text) {
//    var src = text.split("\n");
//    if(src[0].substr(0,3) === "#pc")
//    _.each(src, function(inst,idx) {
//      $('#M' + (idx +10)).text(inst);
//    });
//
//  }
  this.load = function(text) {
    _.each(text.split("\n"), function(inst,idx) {
      $('#M' + (idx +10)).text(inst);
    });
  }
}

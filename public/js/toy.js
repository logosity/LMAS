function Toy() {
//  this.compile(text) {
//    var src = text.split("\n");
//    if(src[0].substr(0,3) === "#pc")
//    _.each(src, function(inst,idx) {
//      $('#M' + (idx +10)).text(inst);
//    });
//
//  }
  this.load = function(memory,text) {
    var result = memory.clone();
    _.each(text.trim().split("\n"), function(inst,idx) {
      $(result).find('#M' + (idx + 10)).text(inst);
    });

    return result;
  }
}

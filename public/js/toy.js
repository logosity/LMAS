function Toy() {
  this.load = function(text) {
    _.each(text.split("\n"), function(inst,idx) {
      $('#M' + (idx +10)).text(inst);
    });
  }
}

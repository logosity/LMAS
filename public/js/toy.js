'use strict';

var toy = {};
toy.memoryMap = function() {
  return _.map(_.range(256),function(i) {
    return {id: "M" + sprintf("%02X",i), text: '0000'};
  });
};

toy.rowHeaders = function() {
  return _.map(_.range(16),function(i) {
    return {text: sprintf("%02X",i * 16), elem:'th'};
  });
};

toy.load = function(memory,text) {
  var result = memory.clone();
  _.each(text.trim().split("\n"), function(inst,idx) {
    $(result).find('#M' + (idx + 10)).text(inst);
  });

  return result;
}

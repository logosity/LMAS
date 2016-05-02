'use strict';

var toy = {};
toy.registers = function() {
  var result = [{id:"PC",value:'00'}];
  return result.concat(_.map(_.range(16),function(i) {
    return {id:"R" + sprintf("%X",i), value:'0000'};
  })); 
};

toy.memoryMap = function() {
  return _.map(_.range(256),function(i) {
    return {id: "M" + sprintf("%02X",i), value: '0000'};
  });
};

toy.rowHeaders = function() {
  return _.map(_.range(16),function(i) {
    return {value: sprintf("%02X",i * 16), elem:'th'};
  });
};

toy.load = function(memory,text) {
  var result = memory.clone();
  _.each(text.trim().split("\n"), function(inst,idx) {
    $(result).find('#M' + (idx + 10)).text(inst);
  });

  return result;
}

toy.parseInstruction = function(code) {
  var matches = code.match(/^([0-9,A-F])([0-9,A-F])([0-9,A-F]{2})$/);
  return matches.slice(1);
}


'use strict';

var toy = {};
toy.registers = function() {
  var result = [{name:"PC"}];
  return result.concat(_.map(_.range(16),function(i) {
    return {name: sprintf('R%X',i)};
  })); 
};

toy.memoryMap = function() {
  return _.map(_.range(256),function(i) {
    return {name:i};
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


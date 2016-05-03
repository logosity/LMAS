'use strict';

var toy = function() {
  var pc = new Uint8Array(1);
  pc[0] = 0x10;
  var registers = new Int16Array(16);
  var ram = new Int16Array(256);

  return {
    pc: function() { return pc[0]; },
    registers: function() { return registers; },
    ram: function() { return ram; }
  };
}(); 

toy.coreDump = function() {
  return {
    pc: toy.pc(),
    registers: toy.registers(),
    ram: toy.ram()
  };
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


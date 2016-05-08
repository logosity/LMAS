'use strict';

var toy = {};

toy.offset = {};

toy.offset.PC = 1;
toy.offset.REG = 2;
toy.offset.RAM = 18;
function Toy(handlers) {
  var that = this;
  var pc = new Uint8Array(1);
  var registers = new Uint16Array(16);
  var ram = new Uint16Array(256);

  var setPc = function(value) {
    if(handlers && handlers.pcChange) {
      handlers.pcChange(value);
    }
    pc[0] = value;
  }
  var setRam = function(addr, value) {
    if(handlers && handlers.memoryChange) {
      handlers.memoryChange(addr,value);
    }
    ram[addr] = value;
  };
  var setRegister = function(addr, value) {
    if(handlers && handlers.registerChange) {
      handlers.registerChange(addr,value);
    }
    registers[addr] = value;
  };

  
  that.pc = function() { return pc[0]; },

  that.reset = function() {
    var bytes = new Uint16Array(274);
    bytes[0] = 1;
    bytes[1] = 0x10;
    that.load(bytes);
  };

  that.load = function(bytes) {
    if(!(bytes instanceof Uint16Array)) {
      throw {name: "invalid", message: "invalid binary format for loading"};
    }
    setPc(toy.util.getPcIn(bytes));

    if(bytes[0] === 1) {
      _.each(toy.util.registers(bytes), function(opcode,idx) {
        setRegister(idx,opcode);
      });
      _.each(toy.util.ram(bytes), function(opcode,idx) {
        setRam(idx,opcode);
      });
      ram = Uint16Array.from(toy.util.ram(bytes));
    } else {
      _.each(bytes.slice(2), function(opcode,idx) {
        setRam(that.pc() + idx,opcode);
      });
    }
  };

  that.dump = function() {
      var result = new Uint16Array(274);
      result[0] = 1;
      result.set(pc, toy.offset.PC);
      result.set(registers, toy.offset.REG);
      result.set(ram, toy.offset.RAM);
      return result;
  };

  that.parseInstruction = function(code) {
    var matches = code.match(/^([0-9,A-F])([0-9,A-F])([0-9,A-F]{2})$/);
    return matches.slice(1);
  }
  that.reset();
}; 


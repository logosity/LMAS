'use strict';

var toy = {};
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

  that.reset = function() {
    var bytes = toy.util.create();
    bytes[0] = 1;
    bytes[1] = 0x10;
    that.load(bytes);
  };

  that.load = function(bytes) {
    if(!(bytes instanceof Uint16Array)) {
      throw {name: "invalid", message: "invalid binary format for loading"};
    }
    toy.util.decorate(bytes);
    setPc(bytes.pc());

    if(bytes.header() === 1) {
      _.each(bytes.registers(), function(opcode,idx) {
        setRegister(idx,opcode);
      });
      _.each(bytes.ram(), function(opcode,idx) {
        setRam(idx,opcode);
      });
    } else {
      _.each(bytes.slice(2), function(opcode,idx) {
        setRam(bytes.pc() + idx,opcode);
      });
    }
  };

  that.dump = function() {
      var result = toy.util.create();
      result.header(1);
      result.pc(pc[0]);
      result.registers(registers);
      result.ram(ram);
      return result;
  };

  that.parseInstruction = function(code) {
    var matches = code.match(/^([0-9,A-F])([0-9,A-F])([0-9,A-F]{2})$/);
    return matches.slice(1);
  }
  that.reset();
}; 


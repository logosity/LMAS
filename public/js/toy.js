'use strict';

var toy = {};

toy.create = function(handlers) {
  var machineState = toy.util.create(handlers);
  var result = {};
  result.run = function() {
    machineState.disableCallbacks();
    do {
    } while(result.step());
    machineState.enableCallbacks();
  };

  var raiseEvent = function(name,eventData) {
    if(machineState.callbacksEnabled && handlers && handlers[name]) {
      handlers[name](eventData);
    }
  };

  result.step = function() {
    var instruction = toy.cycle.fetch(machineState.pc,machineState.ram);
    raiseEvent("onStepStart", {pc: machineState.pc(),instruction: instruction});
    var operation = toy.cycle.interpret(instruction);
    machineState.pc(machineState.pc() + 1);
    var stepResult = operation(machineState.pc,machineState.registers,machineState.ram);
    var state = {pc: machineState.pc, registers: machineState.registers, ram: machineState.ram};
    raiseEvent("onStepEnd",{pc: machineState.pc(),state:state, instruction: instruction});
    return stepResult;
  };

  result.reset = function() {
    var bytes = toy.util.create();
    result.load(bytes);
    if(handlers && handlers.onReset) {
      handlers.onReset({pc:bytes.pc()});
    }
  };

  result.load = function(binary) {
    if(!(binary instanceof Uint16Array)) {
      throw {name: "invalid", message: "invalid binary format for loading"};
    }
    var oldPc = machineState.pc();
    toy.util.decorate(binary);
    machineState.pc(binary.pc());

    switch (binary.header()) {
      case 0:
        _.each(binary.slice(2), function(opcode,idx) {
          machineState.ram(10 + idx, opcode);
        });
        break;
      case 1:
        machineState.registers(binary.registers());
        machineState.ram(binary.ram());
        break;
      case 2:
        _.each(binary.slice(2), function(opcode,idx) {
          machineState.ram(machineState.pc() + idx, opcode);
        });
        break;
      default:
        throw new Error(`unknown header value: ${binary.header()}`);
    }

    if(machineState.callbacksEnabled && handlers && handlers.onLoad) {
      handlers.onLoad({oldpc: oldPc, pc:machineState.pc()});
    }
  };

  result.dump = function() {
      var result = toy.util.create();
      result.header(1);
      result.pc(machineState.pc());
      result.registers(machineState.registers());
      result.ram(machineState.ram());
      return result;
  };
  result.reset();
  return result;
};

toy.util = {};

toy.util.create = function(handlers) {
  var binary = toy.util.decorate(new Uint16Array(274), handlers);
  binary.disableCallbacks();
  binary.header(1); // create a full machine state including registers
  binary.pc(0x0A); // per TOY spec PC is in initial 10
  binary.enableCallbacks();
  return binary;
};

toy.util.decorate = function(arr,handlers) {
  arr.handlers = handlers;
  arr.callbacksEnabled = true;
  _.each(_.functions(toy.util.fns), function(fn) {
    arr[fn] = toy.util.fns[fn](arr);
  });

  return arr;
};

toy.util.fns = {};


toy.util.offsets = {};

toy.util.offsets.PC = 1;
toy.util.offsets.REG = 2;
toy.util.offsets.RAM = 18;

toy.util.fns.region = function(obj) {
  return function(start, length) {
    var end = start + length;
    return obj.slice(start,end);
  };
};

toy.util.fns.header = function(obj) {
  return function(value) {
    switch(arguments.length) {
    case 0:
      return obj[0];
    case 1:
      obj[0] = value;
      break;
    default:
      throw {name:"arguments", message: "too many arguments"};
    }
    return obj[0];
  };
};

toy.util.fns.disableCallbacks = function(obj) {
  return function() {
    obj.callbacksEnabled = false;
  };
};

toy.util.fns.enableCallbacks = function(obj) {
  return function() {
    obj.callbacksEnabled = true;
  };
};

toy.util.fns.handleEvent = function(obj) {
  return function(eventType, eventData) {
    if(obj.callbacksEnabled &&
        obj.handlers &&
        obj.handlers[eventType]) {
      obj.handlers[eventType](eventData);
    }
  };
}
toy.util.fns.pc = function(obj) {
  return function(value) {
    var oldPc = obj[toy.util.offsets.PC];
    switch(arguments.length) {
    case 0:
      return oldPc;
    case 1:
      var newPc = value & 0x00FF;
      obj.handleEvent("onPcChange",{oldpc: oldPc ,pc: newPc});
      obj[toy.util.offsets.PC] = newPc;
      break;
    default:
      throw {name:"arguments", message: "too many arguments"};
    }
  };
};

toy.util.fns.setRegister = function(obj) {
    return function(reg,val) {
    if(reg === 0) {
      obj.handleEvent("onRegisterChange",{address: 0, value: 0});
    } else {
      var newValue = val & 0xFFFF;
      obj.handleEvent("onRegisterChange",{address: reg, value: newValue});
      obj[toy.util.offsets.REG + reg] = newValue;
    }
  };
};

toy.util.fns.setRegisters = function(obj) {
  return function(arr) {
    _.each(arr, function(value, idx) {
      obj.setRegister(idx,value);
    });
  };
};
toy.util.fns.setMemory = function(obj) {
    return function(loc,val) {
    var newValue = val & 0xFFFF;
    obj.handleEvent("onMemoryChange",{address: loc, value: newValue});
    obj[toy.util.offsets.RAM + loc] = newValue;
  };
};

toy.util.fns.setMemoryExtent = function(obj) {
  return function(arr) {
    _.each(arr, function(value, idx) {
      obj.setMemory(idx,value);
    });
  };
};

toy.util.fns.registers = function(obj) {
  return function(register,value) {
    switch(arguments.length) {
    case 0:
      return obj.region(toy.util.offsets.REG,16);
    case 1:
      if(typeof register === "number") {
        return obj[toy.util.offsets.REG + register];
      }
      return obj.setRegisters(register);
    case 2:
      obj.setRegister(register,value);
      break;
    default:
      throw {name:"arguments", message: "too many arguments"};
    }
  };
};

toy.util.fns.ram = function(obj) {
  return function(address,value) {
    switch(arguments.length) {
    case 0:
      return obj.region(toy.util.offsets.RAM,256);
    case 1:
      if(typeof address === "number") {
        return obj[toy.util.offsets.RAM + address];
      }
      return obj.setMemoryExtent(address);
    case 2:
      obj.setMemory(address,value);
      break;
    default:
      throw {name:"arguments", message: "too many arguments"};
    }
  };
};



toy.cycle = {};
toy.cycle.parse = function(instruction) {
  var addr = (instruction & 0x00FF);
  return {
    opcode: instruction >> 12,
    d: (instruction & 0x0F00) >> 8,
    s: addr >> 4,
    t: addr & 0x0F,
    addr: addr
  };
};
toy.cycle.fetch = function(pc, ram) {
  var instruction = ram(pc());
  return toy.cycle.parse(instruction);
};

toy.cycle.interpret = function(instruction) {
  var opcode = instruction.opcode;
  var d = instruction.d;
  var s = instruction.s;
  var t = instruction.t;
  var addr = instruction.addr;

  var instructions = {
    0x0: function() {
      return false;
    },
    0x1: function(pc,registers,ram) {
      registers(d, registers(s) + registers(t));
      return true;
    },
    0x2: function(pc,registers,ram) {
      registers(d, registers(s) - registers(t));
      return true;
    },
    0x3: function (pc,registers,ram) {
      registers(d, registers(s) & registers(t));
      return true;
    },
    0x4: function (pc,registers,ram) {
      registers(d, registers(s) ^ registers(t));
      return true;
    },
    0x5: function (pc,registers,ram) {
      registers(d, registers(s) << registers(t));
      return true;
    },
    0x6: function (pc,registers,ram) {
      registers(d, registers(s) >> registers(t));
      return true;
    },
    0x7: function(pc,registers,ram) {
      registers(d, addr);
      return true;
    },
    0x8: function(pc,registers,ram) {
      registers(d, ram(addr));
      return true;
    },
    0x9: function(pc,registers,ram) {
      ram(addr, registers(d));
      return true;
    },
    0xA: function(pc,registers,ram) {
      registers(d, ram(registers(t)));
      return true;
    },
    0xB: function(pc,registers,ram) {
      ram(registers(t), registers(d));
      return true;
    },
    0xC: function(pc,registers,ram) {
      if(registers(d) === 0) pc(addr);
      return true;
    },
    0xD: function(pc,registers,ram) {
      if(registers(d) > 0) pc(addr);
      return true;
    },
    0xE: function(pc,registers,ram) {
      pc(registers(d));
      return true;
    },
    0xF: function(pc,registers,ram) {
      registers(d,pc());
      pc(addr);
      return true;
    }
  };
  return instructions[opcode];
};


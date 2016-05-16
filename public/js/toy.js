'use strict';

var toy = {};

toy.create = function(handlers) {
  var map = toy.util.create(handlers);
  var result = {};
  result.run = function() {
    map.disableCallbacks();
    do {
    } while(result.step());
    map.enableCallbacks();
  };

  var raiseEvent = function(name,eventData) {
    if(map.callbacksEnabled && handlers && handlers[name]) {
      handlers[name](eventData);
    }
  };

  result.step = function() {
    var instruction = toy.cycle.fetch(map.pc,map.ram);
    raiseEvent("stepStart", {pc: map.pc(),instruction: instruction});
    var operation = toy.cycle.interpret(instruction);
    map.pc(map.pc() + 1);
    var stepResult = operation(map.pc,map.registers,map.ram);
    var state = {pc: map.pc, registers: map.registers, ram: map.ram};
    raiseEvent("stepEnd",{pc: map.pc(),state:state, instruction: instruction});
    return stepResult;
  };

  result.reset = function() {
    var bytes = toy.util.create();
    bytes[0] = 1;
    bytes[1] = 0;
    result.load(bytes);
    if(handlers && handlers.reset) {
      handlers.reset({pc:bytes.pc()});
    }
  };

  result.load = function(bytes) {
    if(!(bytes instanceof Uint16Array)) {
      throw {name: "invalid", message: "invalid binary format for loading"};
    }
    var oldPc = map.pc();
    toy.util.decorate(bytes);
    map.pc(bytes.pc());

    if(bytes.header() === 1) {
      map.registers(bytes.registers());
      map.ram(bytes.ram());
    } else {
      _.each(bytes.slice(2), function(opcode,idx) {
        map.ram(map.pc() + idx, opcode);
      });
    }
    if(map.callbacksEnabled && handlers && handlers.load) {
      handlers.load({oldpc: oldPc, pc:map.pc()});
    }
  };

  result.dump = function() {
      var result = toy.util.create();
      result.header(1);
      result.pc(map.pc());
      result.registers(map.registers());
      result.ram(map.ram());
      return result;
  };
  result.reset();
  return result;
}; 

toy.util = {};

toy.util.create = function(handlers) {
  return toy.util.decorate(new Uint16Array(274),handlers);
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
      obj.handleEvent("pcChange",{oldpc: oldPc ,pc: newPc});
      obj[toy.util.offsets.PC] = newPc;
      break;
    default:
      throw {name:"arguments", message: "too many arguments"};
    }
  };
};

toy.util.fns.setAll = function(obj) {
  return function(arr, offset, eventType) {
    _.each(arr, function(value, idx) {
      var newValue = value & 0xFFFF;
      obj.handleEvent(eventType,{address: idx, value: newValue});
      obj[offset + idx] = newValue;
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
      return obj.setAll(register,toy.util.offsets.REG,"registerChange");
    case 2:
      var newValue = value & 0xFFFF;
      obj.handleEvent("registerChange",{address: register, value: newValue});
      obj[toy.util.offsets.REG + register] = value;
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
      return obj.setAll(address,toy.util.offsets.RAM,"memoryChange");
    case 2:
      var newValue = value & 0xFFFF;
      obj.handleEvent("memoryChange",{address: address, value: newValue});
      obj[toy.util.offsets.RAM + address] = value;
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


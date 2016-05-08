toy.util = {};

toy.util.create = function() {
  return toy.util.decorate(new Uint16Array(274));
};

toy.util.decorate = function(arr) {
  _.each(_.functions(toy.util.fns), function(fn) {
    arr[fn] = toy.util.fns[fn];
  });

  return arr;
};

toy.util.fns = {};


toy.util.offsets = {};

toy.util.offsets.PC = 1;
toy.util.offsets.REG = 2;
toy.util.offsets.RAM = 18;

toy.util.fns.region = function(start, length) {
  var end = start + length;
  return this.slice(start,end);
};

toy.util.fns.header = function(value) {
  switch(arguments.length) {
  case 0:
    return this[0];
  case 1:
    this[0] = value;
    break;
  default:
    throw {name:"arguments", message: "too many arguments"};
  }
  return this[0];
}

toy.util.fns.pc = function(value) {
  switch(arguments.length) {
  case 0:
    return this[toy.util.offsets.PC];
  case 1:
    this[toy.util.offsets.PC] = value;
    break;
  default:
    throw {name:"arguments", message: "too many arguments"};
  }
};

toy.util.fns.setAll = function(arr,offset) {
  if(arr instanceof Uint16Array) return this.set(arr,offset);
  if(arr instanceof Array) return this.set(arr,offset);
  throw {name:"setting memory", message: "argument invalid type" };
};

toy.util.fns.registers = function(register,value) {
  switch(arguments.length) {
  case 0:
    return this.region(toy.util.offsets.REG,16);
  case 1:
    if(typeof register === "number") {
      return this[toy.util.offsets.REG + register];
    }
    return this.setAll(register,toy.util.offsets.REG);
  case 2:
    this[toy.util.offsets.REG + register] = value;
    break;
  default:
    throw {name:"arguments", message: "too many arguments"};
  }
};

toy.util.fns.ram = function(address,value) {
  switch(arguments.length) {
  case 0:
    return this.region(toy.util.offsets.RAM,256);
  case 1:
    if(typeof address === "number") {
      return this[toy.util.offsets.RAM + address];
    }
    return this.setAll(address,toy.util.offsets.RAM);
  case 2:
    this[toy.util.offsets.RAM + address] = value;
    break;
  default:
    throw {name:"arguments", message: "too many arguments"};
  }
}



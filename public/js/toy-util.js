toy.util = {};

toy.util.create = function() {
  return toy.util.decorate(new Uint16Array(274));
};

toy.util.decorate = function(arr) {
  _.each(_.functions(toy.util), function(fn) {
    arr[fn] = toy.util[fn];
  });

  return arr;
};

toy.util.region = function(bytes, start, length) {
  var end = start + length;
  return bytes.slice(start,end);
};

toy.util.header = function(bytes) {
  return toy.util.region(bytes,0,1);
}

toy.util.pc = function(bytes) {
  return toy.util.region(bytes,toy.offset.PC,1);
}

toy.util.registers = function(bytes) {
  return toy.util.region(bytes,toy.offset.REG,16);
}

toy.util.ram = function(bytes) {
  return toy.util.region(bytes,toy.offset.RAM,256);
}

toy.util.getPcIn = function(bytes) {
  return toy.util.pc(bytes)[0];
}
toy.util.setPcIn = function(bytes, value) {
  bytes[toy.offset.PC] = value;
}

toy.util.getRegisterIn = function(bytes, register) {
  return toy.util.registers(bytes)[register];
}
toy.util.setRegisterIn = function(bytes, register, value) {
  bytes[toy.offset.REG + register] = value;
}

toy.util.getRamIn = function(bytes, address) {
  return toy.util.ram(bytes)[address];
}
toy.util.setRamIn = function(bytes, address, value) {
  bytes[toy.offset.RAM + address] = value;
}



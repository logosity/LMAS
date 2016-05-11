'use strict';

var toyAsm = function() {
  return {
    defaultPc: function() { return 0x10 }
  };
}();

toyAsm.createError = function(name, preamble, opcode, line) {
  return {
        name: name,
        line: line,
        message: preamble + ', line ' + line + ': ' + opcode 
      }
};

toyAsm.assemble = function(code) {
  var check = function(opcode, regex, exception) {
    if(opcode.toUpperCase().match(regex) === null) {
      throw exception;
    }
  };

  var opcodes =  _.filter(code.trim().split("\n"),function(op) {
    return op !== ""
  });

  opcodes = _.map(opcodes, function(o) { return o.trim(); });

  _.each(opcodes, function(op,idx) { 
    check(op,/^[0-9,A-F]+$/, toyAsm.createError("syntax", "syntax error", op, idx + 1));
    check(op,/^[0-9,A-F]{4}$/, toyAsm.createError( "invalid", "invalid opcode", op, idx + 1));
  });

  var header = ["0",toyAsm.defaultPc().toString(16)];
  return Uint16Array.from(_.map(header.concat(opcodes), function(op) {
    return parseInt(op,16);
  }));
};

toyAsm.serialize = function(bytes) {
  return _.map(bytes, function(b) {
      return sprintf('%04x',b);
  }).join('');
};

toyAsm.deserialize = function(hex) {
  var chunk = function(hex) {
    return hex.match(/(.{4})/g);
  }
  var parse = function(vals) {
    return _.map(vals, function(i) { 
      return parseInt(i,16); 
    });
  };
  return Uint16Array.from(parse(chunk(hex)));
};

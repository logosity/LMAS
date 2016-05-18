var lasm = {};

lasm.prepare = function(code) {
  return _.flatten(_.map(code.split("\n"), function(line) {
    return toyGrammar.parse(line);
  }));
};

lasm.opcodeTable = {
  ORG: {
    symbols: function(opdata,result) { 
      if(opdata.lineNumber === 0) {
        result.pc = opdata.operands.address;
      }
      result.lc = opdata.operands.address;
      return result;
    },
    translate: function(op, code) {
      return code;
    },
  },
  HEX: {
    symbols: function(opdata,result) {
      result.lc += opdata.operands.data.length;
      return result;
    },
    translate: function(op, code) {
      return code.concat(op.operands.data);
    }
  },
  EQU: {
    symbols: function(opdata,result) {
      result.symbols[opdata.operands.label] = opdata.operands.value;
      return result;
    },
    translate: function(op, code) {
      return code;
    }
  },
  BRNZ: {
    symbols: function(opdata,result) { 
      result.lc += 1; 
      return result;
    },
    translate: function(op, code, lookup) { 
      if(op.operands.address) {
        code.push(0xC000 | op.operands.d | op.operands.address);
      } else if(op.operands.label) {
        code.push(0xC000 | op.operands.d | lookup(op.operands.label));
      } else {
        //parser should never allow this to happen, but...
        throw new Error("Invalid BRNZ operation.");
      }
      return code;
    }
  },
  BRNP: {
    symbols: function(opdata,result) { 
      result.lc += 1; 
      return result;
    },
    translate: function(op, code, lookup) { 
      if(op.operands.address) {
        code.push(0xD000 | op.operands.d | op.operands.address);
      } else if(op.operands.label) {
        code.push(0xD000 | op.operands.d | lookup(op.operands.label));
      } else {
        //parser should never allow this to happen, but...
        throw new Error("Invalid BRNP operation.");
      }
      return code;
    }
  },
  HALT: {
    symbols: function(opdata,result) { 
      result.lc += 1; 
      return result;
    },
    translate: function(op, code, lookup) { 
      code.push(0);
      return code; }
  },
  ADDR: {
    symbols: function(opdata, result) { 
      result.lc += 1; 
      return result;
    },
    translate: function(op, code) {
      code.push(0x1000 | op.operands.d | op.operands.s | op.operands.t);
      return code;
    }
  },
  LOAD: {
    symbols: function(opdata,result) { 
      result.lc += 1; 
      return result;
    },
    translate: function(op, code, lookup) {
      if(op.operands.value) {
        code.push(0x7000 | op.operands.d | op.operands.value);
      } else if(op.operands.address) {
        code.push(0x8000 | op.operands.d | op.operands.address);
      } else if(op.operands.label) {
        code.push(0x8000 | op.operands.d | lookup(op.operands.label));
      } else if(op.operands.register) {
        code.push(0xA000 | op.operands.d | op.operands.register);
      } else {
        //parser should never allow this to happen, but...
        throw new Error("Invalid LOAD operation.");
      }

      return code;
    }
  },
  STOR: {
    symbols: function(opdata,result) { 
      result.lc += 1; 
      return result;
    },
    translate: function(op, code, lookup) {
      if(op.operands.address) {
        code.push(0x9000 | op.operands.d | op.operands.address);
      } else if(op.operands.label) {
        code.push(0x9000 | op.operands.d | lookup(op.operands.label));
      } else if(op.operands.register) {
        code.push(0xB000 | op.operands.d | op.operands.register);
      } else {
        //parser should never allow this to happen, but...
        throw new Error("Invalid STOR operation.");
      }

      return code;
    }
  },
  SUBR: {
    symbols: function(opdata, result) { 
      result.lc += 1; 
      return result;
    },
    translate: function(op, code) {
      code.push(0x2000 | op.operands.d | op.operands.s | op.operands.t);
      return code;
    }
  }
};
lasm.assemble = function(code) {
  var lines =  lasm.prepare(code);
  var firstPass = lasm.buildSymbols(lines);
  var result = [0,firstPass.pc];
  var symbolTable = function(symbol) {
    return firstPass.symbols[symbol];
  };
  _.each(lines, function(line) {
    if(!_.isEmpty(line)) {
      var translate = lasm.opcodeTable[line.operation].translate;
      result = translate(line, result, symbolTable);
    }
  });
  return Uint16Array.from(result);
};

lasm.buildSymbols = function(code) {
  var result = {pc: 0, lc: 0, symbols: {}};
  _.each(code, function(line,idx) {
    if(_.isEmpty(line)) return;

    line.lineNumber = idx;

    if(line.label) {
      result.symbols[line.label] = result.lc;
    }
    var handler = lasm.opcodeTable[line.operation];
    if(handler) {
      result = handler.symbols(line,result);
    }
  });
  return _.omit(result, 'lc');
}

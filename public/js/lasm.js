var lasm = {};

lasm.assemble = function(code) {
  var lines =  lasm.prepare(code);
  var firstPass = lasm.buildSymbols(lines);

  var result = [0,firstPass.pc];
  var symbolTable = function(symbol) {
    return firstPass.symbols[symbol];
  };
  _.each(lines, function(line) {
    if(!_.isEmpty(line) && !_.isUndefined(line.operation)) {
      var translate = lasm.internal.opcodeTable[line.operation].translate;
      result = translate(line, result, symbolTable);
    }
  });
  return Uint16Array.from(result);
};

lasm.prepare = function(code) {
  var result = _.flatten(_.map(code.split("\n"), function(line) {
    return toyGrammar.parse(line);
  }));
  return _.filter(result, function(line) {
    return _.has(line, 'operation') || _.has(line, 'label');
  });
};

lasm.buildSymbols = function(code) {
  var result = {pc: 10, lc: 10, symbols: {}}; //per toy spec 10 is the default PC
  _.each(code, function(line,idx) {
    if(_.isEmpty(line)) return;

    line.lineNumber = idx;

    if(line.label) {
      result.symbols[line.label] = result.lc;
    }
    var handler = lasm.internal.opcodeTable[line.operation];
    if(handler) {
      result = handler.symbols(line,result);
    }
  });
  return _.omit(result, 'lc');
}

///////////////////////////////////OPCODES/////////////////////////////////////
lasm.internal = {};
lasm.internal.opcodeTable = function() {
  var type1 = function(instruction) {
    return {
      symbols: function(opdata, result) {
        result.lc += 1;
        return result;
      },
      translate: function(op, code) {
        code.push(instruction | op.operands.d | op.operands.s | op.operands.t);
        return code;
      }
    };
  };
  return {
    ADDR: type1(0x1000),
    SUBR: type1(0x2000),
    ANDR: type1(0x3000),
    XORR: type1(0x4000),
    SHRL: type1(0x5000),
    SHRR: type1(0x6000),
    ORG: {
      symbols: function(opdata,result) {
        if(opdata.lineNumber === 0) {
          result.pc = opdata.operands.address;
        }
        result.lc = opdata.operands.address;
        return result;
      },
      translate: function(op, code) {
        var times = op.operands.address - (code.length - 2);
        _.each(_.range(0,times), function(i) {
          code.push(0);
        });
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
    LOAD: {
      symbols: function(opdata,result) {
        result.lc += 1;
        return result;
      },
      translate: function(op, code, lookup) {
        if(!_.isUndefined(op.operands.value)) {
          code.push(0x7000 | op.operands.d | op.operands.value);
        } else if(!_.isUndefined(op.operands.address)) {
          code.push(0x8000 | op.operands.d | op.operands.address);
        } else if(!_.isUndefined(op.operands.label)) {
          if(op.operands.label[0] === "#") {
            code.push(0x7000 | op.operands.d | lookup(op.operands.label.slice(1)));
          } else {
            code.push(0x8000 | op.operands.d | lookup(op.operands.label));
          }
        } else if(!_.isUndefined(op.operands.register)) {
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
    JMPR: {
      symbols: function(opdata, result) {
        result.lc += 1;
        return result;
      },
      translate: function(op, code) {
        code.push(0xE000 | op.operands.d);
        return code;
      }
    },
    JMPL: {
      symbols: function(opdata, result) {
        result.lc += 1;
        return result;
      },
      translate: function(op, code) {
        code.push(0xF000 | op.operands.d);
        return code;
      }
    },
  };
}();

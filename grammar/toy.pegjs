// vim: ft=javascript
{

  function upjoin(arr) {
    return up(join(arr));
  }

  function up(text) {
    return text.toUpperCase();
  }

  function join(arr) {
    return _.flatten(arr).join("").trim();
  }

  function splitOpcode(op) {
    return op.split(",");
  }

  function toNumber(val) {
  return val[0].match(/[R$]/) ? toHex(val.slice(1)) : parseInt(val,10);
  }

  function toHex(val) {
    return parseInt(val,16);
  }

  function toHexArray(valString) {
    var numbers = util.partition(valString, 4);
    return _.map(numbers, function(v) {
      return toHex(join(v));
    });
  }

  function createOrg(lc) {
    return _.extend({ operation: "ORG" },
                    { operands: { address: toNumber(lc) }});
  }

  function createHex(data, label) {
    return _.extend({},label, { operation: "HEX" },
                    { operands: {data: data }});
  }

  function invalidLabel(line) {
    error("Invalid label character. (missing initial whitespace?)");
  }

  function invalidData(chr) {
    error("Invalid character: '" + chr + "' in data.");
  }
}

start
  = line

EOL ""
  = !.

_ "whitespace"
  = [ \t\n\r]

letter
  = [a-z]i
  / "," { invalidLabel(); }

word
  = result:letter+ { return upjoin(result); }

hexNumber
  = val:([0-9a-f]i) { return up(val); }


register
  = result:([Rr] hexNumber) { return upjoin(result); }

address
  = addr:([$%]? hexNumber hexNumber) { return upjoin(addr); }
value
  = val:("#" address) { return upjoin(val.slice(1)); }

label
  = text:word { return {label: text}; }

comment
  = _* symbol:";" text:.* { return {comment: join(text) }; }

instruction
  = type_one_instruction
  / type_two_instruction
  / type_three_instruction

type_one_instruction
  = _+ op:type_one_opcode _+ s:register _+ t:register {
    return { 
      operation: op.operation, 
      operands: _.extend(op.operands, {s: toNumber(s), t: toNumber(t) })
    };
  }
  / _+ op:type_one_opcode .* { error("Type 1 operations must have form XXXX,RX RX RX"); }

type_one_opcode
  = op:type_one_mnemonic "," reg:register { return {operation:op, operands: { d: toNumber(reg) }}; }

type_one_mnemonic
  = "ADDR"i
  / "SUBR"i
  / "ANDR"i
  / "XORR"i
  / "SHLR"i
  / "SHRR"i

type_two_instruction
  = _+ op:type_two_opcode _+ register _+ register { error("Type 2 operations must have form XXXX,RX [#]address"); }
  / _+ op:type_two_opcode _+ operand:type_two_argument {
    return { 
      operation: op.operation, 
      operands: _.extend(op.operands, operand) 
    };
  }
  / _+ op:type_two_opcode .* { error("Type 2 operations must have form XXXX,RX [#]address"); }

type_two_argument
  = result:value { return { value: toNumber(result) }; }
  / result:address { return { address: toNumber(result) }; }
  / result:register { return { register: toNumber(result) }; }
  / result:label { return { address: result.label }; }

type_two_opcode
  = op:type_two_mnemonic "," reg:register { return {operation:op, operands: { d: toNumber(reg) }}; }

type_two_mnemonic
  = "LOAD"i
  / "STOR"i
  / "BRNP"i
  / "BRNZ"i

type_three_instruction
  = _+ op:type_three_opcode _+ .* { error("Type 3 operations cannot have operands"); }
  / _+ op:type_three_opcode _* { return op; }
  / _+ "HALT"i { return {operation: "HALT"}; }

type_three_opcode
  = op:type_three_mnemonic "," reg:register { return {operation:op, operands: { d: toNumber(reg) }}; }

type_three_mnemonic
  = "JMPR"i
  / "JMPL"i

directive
  = org
  / hex

org
  = _+ "ORG"i _+ addr:address { return createOrg(addr); }
hex
  = _+ "HEX"i data:hexDataArray { return createHex(data); }

hexData
  = val:([0-9a-f ]i) { return up(val); }
  / val:[^;] { invalidData(val); }

hexDataArray
  = values:(hexData)+ {
    return toHexArray(_.filter(_.flatten(values), function(v) {
      return v.match(/[0-9a-fA-F]/);
    }));
  }

macro
  = _+ m:at { return m; }

at
  = "@" val:address _+ data:hexDataArray {
    return [createOrg(val), createHex(data, text)];
  }
  / "@" _+ data:hexDataArray {
    return [createHex(data)];
  }


line
  = text:label dir:directive comm:comment {
    return _.extend({}, text, dir, comm);
  }
  / text:label dir:directive {
    return _.extend({}, text, dir);
  }
  / dir:directive comm:comment {
    return _.extend({}, dir, comm);
  }
  / dir:directive { return dir ; }

  / text:label inst:instruction comm:comment {
    return _.extend({}, text, inst, comm);
  }
  / text:label inst:instruction {
    return _.extend({}, text, inst);
  }
  / inst:instruction comm:comment {
    return _.extend({}, inst, comm);
  }
  / inst:instruction { return inst; }

  / text:label m:macro comm:comment {
      return [_.first(m), _.extend(text, comm), _.last(m)];
    }
  / m:macro {
      return m;
    }

  / text:label comm:comment { return _.extend({}, text, comm); }
  / text:label { return text; }
  / comm:comment { return comm; }

  / _+ { return {}; }
  / EOL { return {}; }

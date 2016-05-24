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

  function dRegisterShift(val) {
    return val << 8;
  }

  function sRegisterShift(val) {
    return val << 4;
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

  function toAscii(chrString) {
    var padding = chrString.length % 2 === 0 ? "\0\0" : "\0";
    var chars = util.partition(chrString + padding, 2);
    var result = [chars.length];
    return result.concat(_.map(chars,function(chr) {
      var high = _.first(chr).charCodeAt();
      var low = _.last(chr).charCodeAt();
      return (high << 8) | low;
    }));
  }

  function createOp(operation, operands, label, comment) {
    var opArgs = operands ? { operands: operands } : undefined;
    return _.extend({ operation: up(operation) },opArgs , label, comment);

  }

  function createOrg(addr) {
    return createOp("ORG",addr);
  }

  function createHex(data, label) {
    return createOp("HEX",{data: data},label);
  }

  function createEqu(label, val) {
    return createOp("EQU",_.extend(label, val));
  }

  function invalidString() {
    error("Escaped quotes not supported");
  }
  function invalidLabel(line) {
    error("Invalid label character. (missing initial whitespace?)");
  }

  function invalidData(chr) {
    error("Invalid character: '" + chr + "' in data.");
  }

  function invalidBranch(op, arg) {
    error("Invalid operand for " + op + ": R" + arg); 
  }

  function invalidStore() {
    error("Cannot STOR to literal (#) value"); 
  }

  function invalidMove() {
    error("MOV is register -> register"); 
  }
  function invalidJmp() {
    error("JMP must have an address"); 
  }
}

start
  = line

line
  = text:label dir:directive comm:comment {
    return _.extend({}, text, dir, comm);
  }
  / text:label dir:directive {
    return _.extend({}, text, dir);
  }
  / text:label equ:equ_directive comm:comment{
    return _.extend(createEqu(text,equ),comm);
  }
  / text:label equ:equ_directive {
    return createEqu(text,equ);
  }
  / dir:directive comm:comment {
    return _.extend({}, dir, comm);
  }
  / dir:directive { return dir ; }

  / equ_directive { error("LABEL required for EQU directive."); }

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

  / label:label at:at_directive comm:comment {
      return [_.first(at), _.extend(label, comm), _.last(at)];
    }
  / label:label at:at_directive {
      return [_.first(at), label, _.last(at)];
    }
  / at:at_directive { return at; }

  / text:label comm:comment { return _.extend({}, text, comm); }
  / text:label { return text; }
  / comm:comment { return comm; }

  / ws+ { return {}; }
  / E { return {}; }

E ""
  = !.

ws "whitespace"
  = [ \t\n\r]

letter
  = [a-z]i
  / "," { invalidLabel(); }

register
  = reg:([Rr] hexChar) { return toNumber(upjoin(reg)); }

d_reg
  = "," reg:register { return {d: dRegisterShift(reg)}; }

address
  = addr:numericLiteral { return { address: addr}; }
  / "#" label:label { return { label: "#" + label.label }; }
  / label:label { return label; }

value
  = "#" val:numericLiteral { return {value: val}; }

hexChar
  = [0-9A-F]i

numericLiteral
  = n:("$" hexChar+) { return toNumber(upjoin(n)); } 
  / n:("%" [01]+) { return toNumber(upjoin(n)); } 
  / n:([0-9]+) { return toNumber(upjoin(n)); } 

label
  = text:letter+ { return {label: upjoin(text)}; }

comment
  = ws* symbol:";" text:.* { return {comment: join(text) }; }

instruction
  = type_one_instruction
  / type_two_instruction
  / stor_instruction
  / brn_instruction
  / type_three_instruction
  / type_four_instructions
  / type_five_instructions

type_one_instruction
  = ws+ op:type_one_opcode ws+ s:register ws+ t:register {
    return createOp(op.operation,_.extend(op.operands, {s: sRegisterShift(s), t: t }));
  }
  / ws+ op:type_one_opcode .* { error("Type 1 operations must have form XXXX,RX RX RX"); }

type_one_mnemonic
  = "ADDR"i
  / "SUBR"i
  / "ANDR"i
  / "XORR"i
  / "SHRL"i
  / "SHRR"i

type_one_opcode
  = op:type_one_mnemonic d:d_reg { return createOp(op,d); }

type_two_instruction
  = ws+ t2_mnemonic d_reg ws+ register ws+ register { 
    error("Type 2 operations must have form XXXX,RX register|address|value"); 
  }
  / load_instruction
  / stor_instruction
  / brn_instruction
  / mov_instruction
  / ws+ t2_mnemonic d_reg .* { 
    error("Type 2 operations must have form XXXX,RX register|address|value"); 
  }

t2_mnemonic
  = "LOAD"i
  / "STOR"i
  / "BRNZ"i
  / "BRNP"i

load_instruction
  = ws+ op:"LOAD"i d:d_reg ws+ val:value {
    return createOp(op, _.extend(d, val)); 
  }
  / ws+ op:"LOAD"i d:d_reg ws+ reg:register {
    return createOp(op, _.extend(d, {register:reg})); 
  }
  / ws+ op:"LOAD"i d:d_reg ws+ addr:address {
    return createOp(op, _.extend(d, addr)); 
  }

stor_instruction
  = ws+ op:"STOR"i d:d_reg ws+ reg:register {
    return createOp(up(op),_.extend(d,{register:reg}));
  }
  / ws+ op:"STOR"i d:d_reg ws+ addr:address {
    return createOp(up(op),_.extend(d,addr));
  }
  / ws+ op:"STOR"i d:d_reg ws+ value { invalidStore(); }

brn_instruction
  = ws+ op:brn d_reg ws+ arg:register { invalidBranch(op,arg); } 
  / ws+ op:brn d:d_reg ws+ addr:address { return createOp(op, _.extend(d, addr)); }

brn
  = "BRNP"i
  / "BRNZ"i

mov_instruction
  = ws+ op:"MOV"i d:d_reg ws+ reg:register {
    return createOp('ADDR',_.extend(d, {s:0, t:reg }));
  }
  / ws+ "MOV"i d_reg ws+ address { invalidMove(); }
  / ws+ "MOV"i d_reg ws+ value { invalidMove(); }
  / ws+ "MOV"i d_reg ws+ [^;]* { invalidMove(); }
  
type_three_instruction
  = ws+ t3_mnemonic d_reg ws+ .* { error("Type 3 operations cannot have operands"); }
  / ws+ op:"JMPR"i d:d_reg ws* {return createOp(op,d);}
  / ws+ op:"JMPL"i d:d_reg ws* {return createOp(op,d);}

t3_mnemonic
  = "JMPR"i
  / "JMPL"i

type_four_instructions
  = ws+ t4_mnemonic ws+ .* { error("Type 4 operations cannot have operands"); }
  / ws+ "HALT"i { return createOp("HALT"); }
  / ws+ "NOP"i { return createOp("BRNP",{d:0}); }

t4_mnemonic
  = "HALT"i
  / "NOP"i

type_five_instructions
  = ws+ "JMP"i ws+ register { invalidJmp(); }
  / ws+ "JMP"i ws+ addr:address { 
    return createOp("BRNZ",_.extend({d:0}, addr)); 
  }
  / ws+ "JMP"i ws+ val:value { 
    return createOp("BRNZ",_.extend({d:0}, {address: val.value})); 
  }
  / ws+ "JMP"i [^;]* { invalidJmp(); }

directive
  = ws+ "ORG"i ws+ addr:address { return createOrg(addr); }
  / ws+ "HEX"i data:hexDataArray { return createHex(data); }
  / ws+ "ASCII"i ws+ str:charString { return createHex(toAscii(str)); }

charString
  = '"' text:([\x20\x21\x23-\x7e]+) '"' ws* [^;]+ { invalidString(); }
  / "'" text:([\x20\x21\x23-\x7e]+) "'" ws* [^;]+ { invalidString(); }
  / '"' text:([\x20\x21\x23-\x7e]+) '"' { return join(text); }
  / "'" text:([\x20-\x26\x28-\x7e]+) "'" { return join(text); }


equ_directive
  = ws+ "EQU"i ws+ val:value { return val; }
  / ws+ "EQU"i ws+ addr:address { return {value: addr.address}; }

hexData
  = val:([0-9a-f ]i) { return up(val); }
  / val:[^;] { invalidData(val); }

hexDataArray
  = values:(hexData)+ {
    return toHexArray(_.filter(_.flatten(values), function(v) {
      return v.match(/[0-9a-fA-F]/);
    }));
  }

at_directive
  = ws+ "@" val:address ws+ data:hexDataArray {
    return [createOrg(val), createHex(data, text)];
  }
  / ws+ "@" ws+ data:hexDataArray { return [createHex(data)]; }

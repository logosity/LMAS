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
    return _.extend({ directive: "ORG" },
                    { operands: { address:lc }});
  }

  function createHex(data, label) {
    return _.extend({},label, { directive: "HEX" },
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
  = addr:([$%]? hexNumber hexNumber) { return upjoin(addr) }

label
  = text:word { return {label: text}; }

comment
  = _* symbol:";" text:.* { return {comment: join(text) }; }

instruction
  = _+ op:t1_opcode _+ s:register _+ t:register {
    return { opcode: op,
      operands: { s: up(s), t: up(t) }
    };
  }

t1_opcode
  = result:(mnemonic "," register) { return upjoin(result); }

mnemonic
  = "ADDR"i
  / "SUBR"i
  / "ANDR"i
  / "XORR"i
  / "SHLR"i
  / "SHRR"i

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
    return [createOrg('*'), createHex(data)];
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

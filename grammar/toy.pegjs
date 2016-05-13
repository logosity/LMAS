// vim: ft=javascript
{
  function up(text) {
    return text.toUpperCase();
  }

  function upjoin(arr) {
    return up(arr.join(""));
  }

  function format(comment) {
    if(comment === null) {
      return null;
    } else if(typeof comment === 'undefined') {
      return null;
    } else if(comment instanceof Array) {
      return _.flatten(comment).join("").trim();
    }
    return comment.trim();
  }
}

start
  = instruction

instruction
  = sym:label _+ op:opcode _+ args:operands comm:(_+ comment)? {
    return {
      label: sym,
      opcode: op, 
      operands: args, 
      comment: format(comm)
    }; 
  }
  / _* op:opcode _+ args:operands comm:(_+ comment)? {
    return {
      label: null,
      opcode: op, 
      operands: args, 
      comment: format(comm)
    }; 
  }

_ "whitespace"
  = chars:[ \t\n\r]+ { return chars.join(""); }

letter
  = [a-z]i

word
  = result:letter+ { return upjoin(result); }

register
  = result:([Rr][0-9a-f]i) { return upjoin(result); }

label
  = word

opcode
  = result:(letter letter letter letter "," register) { return upjoin(result); }

operands
  = s:register _* t:register { return { s: up(s), t: up(t) }; }

comment
  = symbol:";" text:.* { return text.join("").trim() }




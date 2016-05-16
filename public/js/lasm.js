var lasm = {};


lasm.assemble = function(code) {
  var lc = 0;
  var lines = _.flatten(_.map(code.split("\n"), function(line) {
    return toyGrammar.parse(line);
  }));
  if(_.first(lines).operation === "ORG") {
    lc = _.first(lines).operands.address;
    lines = lines.slice(1);
  }
  var result = [0,lc];
  _.each(lines, function(line) {
    if(!_.isEmpty(line)) {
      result = result.concat(line.operands.data); 
    }
  });
  return Uint16Array.from(result);
};

describe('TOY assembly grammar', function() {
  describe('type one instructions', function() {
    it('have four parts', function() {
      var expected = {
        label: "FOO",
        opcode: "ADDR,R2",
        operands: { s: "R3", t: "R4" },
        comment: "stuff, and more"
      };
      var line = "foo ADDR,R2 R3 R4 ; stuff, and more";
      expect(toyGrammar.parse(line)).toEqual(expected);
    });  
    it('labels are optional', function() {
      var expected = {
        label: null,
        opcode: "ADDR,R2",
        operands: { s: "R3", t: "R4" },
        comment: "stuff, and more"
      };
      var line = "ADDR,R2 R3 R4 ; stuff, and more";
      expect(toyGrammar.parse(line)).toEqual(expected);
    });
    it('comments are optional', function() {
      var expected = {
        label: "FOO",
        opcode: "ADDR,R2",
        operands: { s: "R3", t: "R4" },
        comment: null
      };
      var line = "foo ADDR,R2 R3 R4";
      expect(toyGrammar.parse(line)).toEqual(expected);
    });
    it('can be just opcode and operand', function() {
      var expected = {
        label: null,
        opcode: "ADDR,R2",
        operands: { s: "R3", t: "R4" },
        comment: null
      };
      var line = "ADDR,R2 R3 R4";
      expect(toyGrammar.parse(line)).toEqual(expected);
    });
  });
});


describe('TOY assembly grammar', function() {
  function shouldThrow(expression, msg) {
    var fn = function() { toyGrammar.parse(expression); }
    if(msg) {
      expect(fn).toThrowError(toyGrammar.SyntaxError, msg);
    } else {
      expect(fn).toThrowError(toyGrammar.SyntaxError);
    }
  }
  describe('lines, labels and comments', function() {
    it('it can be an empty line', function() {
      expect(toyGrammar.parse("")).toEqual({});
    });
    it('it can be a line with just whitespace', function() {
      expect(toyGrammar.parse("        ")).toEqual({});
    });
    it('can be just a label and a comment', function() {
      var expected = {
        label: "FOO",
        comment: "stuff, and more"
      };
      expect(toyGrammar.parse( "FOO ; stuff, and more")).toEqual(expected);
    });
    it('can be just a label', function() {
      var expected = {
        label: "FOO",
      };
      expect(toyGrammar.parse("foo")).toEqual(expected);
    });
    it('can be just a comment', function() {
      var expected = {
        comment: "stuff, and more"
      };
      expect(toyGrammar.parse("; stuff, and more")).toEqual(expected);
    });
    it('does not need to be whitespace between labels and comments', function() {
      var expected = {
        label: "FOO",
        comment: "stuff, and more"
      };
      expect(toyGrammar.parse("foo; stuff, and more")).toEqual(expected);
    });
  });
  describe('macros', function() {
    it('@ macro', function() {
      var expected = [
        {
          operation: "ORG",
          operands: {address: 0x10},
        }, {
          label: "FOO",
          comment: "stuff, and more"
        }, {
          operation: "HEX",
          operands: {data: [0x1234,0x5678]}
        }
      ];
      var line = "foo @$10 1234 5678 ; stuff, and more";
      expect(toyGrammar.parse(line)).toEqual(expected);
    });
    it('@ macro will use current lc', function() {
      var expected = [
        {
          operation: "HEX",
          operands: {data: [0x1234,0x5678]}
        }
      ];
      var line = " @ 1234 5678";
      expect(toyGrammar.parse(line)).toEqual(expected);
    });
  });
  describe('directives', function() {
    it('ORG directive', function() {
      var expected = {
        label: "FOO",
        operation: "ORG",
        operands: { address: 10 },
        comment: "stuff, and more"
      };

      var line = "foo ORG 10 ; stuff, and more";
      expect(toyGrammar.parse(line)).toEqual(expected);
    });
    it('HEX directive', function() {
      var expected = {
        label: "BAR",
        operation: "HEX",
        operands: { data: [0x1234,0x5678] },
        comment: "a different comment"
      };

      var line = "BAR HEX 1234 5678 ; a different comment";
      expect(toyGrammar.parse(line)).toEqual(expected);
    });
    it('HEX directive spacing is free-form', function() {
      var expected = { operation: "HEX", operands: { data: [0x1234,0x5678] }};
      expect(toyGrammar.parse(" HEX 12345678")).toEqual(expected);
    });
    it('HEX directive can only contain numbers & spaces', function() {
      var expected = { operation: "HEX", operands: { data: [0x1234,0x5678] }};
      shouldThrow(" HEX 1234,5678","Invalid character: ',' in data.");
    });
  });
  describe('type one instructions', function() {
    describe('overall structure', function() {
      it('has four parts', function() {
        var expected = {
          label: "FOO",
          operation: "ADDR",
          operands: { d: 2, s: 3, t: 4 },
          comment: "stuff, and more"
        };
        var line = "foo ADDR,R2 R3 R4 ; stuff, and more";
        expect(toyGrammar.parse(line)).toEqual(expected);
      });
      it('labels are optional', function() {
        var expected = {
          operation: "ADDR",
          operands: { d: 2, s: 3, t: 4 },
          comment: "stuff, and more"
        };
        var line = " ADDR,R2 R3 R4 ; stuff, and more";
        expect(toyGrammar.parse(line)).toEqual(expected);
      });
      it('comments are optional', function() {
        var expected = {
          label: "FOO",
          operation: "ADDR",
          operands: { d: 2, s: 3, t: 4 },
        };
        var line = "foo ADDR,R2 R3 R4";
        expect(toyGrammar.parse(line)).toEqual(expected);
      });
      it('can be just opcode and operand', function() {
        var expected = { operation: "ADDR", operands: { d: 2, s: 3, t: 0xC }, };
        var line = " ADDR,R2 R3 RC";
        expect(toyGrammar.parse(line)).toEqual(expected);
      });
      it('must start with space if no label', function() {
        shouldThrow('ADDR,R2 R3 R4', "Invalid label character. (missing initial whitespace?)");
      });
    });
    it('supported codes', function() {
      _.each(["ADDR","SUBR","ANDR","XORR","SHLR","SHRR"],function(mnemonic) {
        var expected = { operation: mnemonic, operands: { d: 0xF, s: 3, t: 4 }, };
        var inst = " " + mnemonic + ",RF R3 R4";

        expect(toyGrammar.parse(inst)).toEqual(expected);
      });
    });
  });
});


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
    it('whitespace after operations ok', function() {
      var fn = function(cmd) {
        return function() {
          toyGrammar.parse(cmd)
        }
      };
      expect(fn(" STOR,R2 RC   ")).not.toThrow();
      expect(fn("FOO STOR,R2 RC   ")).not.toThrow();
      expect(fn(" ORG $42   ")).not.toThrow();
      expect(fn("FOO ORG $42   ")).not.toThrow();
      expect(fn("FOO EQU $42   ")).not.toThrow();
      expect(fn(" @ 4545   ")).not.toThrow();
      expect(fn("FOO @ 4545   ")).not.toThrow();
    });
  });
  describe('@ directive', function() {
    it('can have labels and comments', function() {
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
    it('uses current lc if one not specified', function() {
      var expected = [
        {
          operation: "HEX",
          operands: {data: [0x1234,0x5678]}
        }
      ];
      var line = " @ 1234 5678";
      expect(toyGrammar.parse(line)).toEqual(expected);
    });
    it('handles hex values', function() {
      expect(toyGrammar.parse("MSG @$E0 4441")).toEqual([
        {
          operation: "ORG",
          operands: {address: 0xE0}
        },
        {
          label: "MSG",
        },
        {
          operation: "HEX",
          operands: {data: [0x4441]}
        }
      ]);
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
    it('EQU directive from literal', function() {
      var expected = {
        operation: "EQU",
        operands: { label: "IO", value: 0xFF }
      };

      expect(toyGrammar.parse( "IO EQU #$FF")).toEqual(expected);
    });

    it('EQU directive from address', function() {
      var expected = {
        operation: "EQU",
        operands: { label: "IO", value: 0xFF }
      };

      expect(toyGrammar.parse( "io equ $FF")).toEqual(expected);
    });
    it('EQU directive can have comment', function() {
      var expected = {
        operation: "EQU",
        operands: { label: "IO", value: 0xFF },
        comment: "a comment"
      };
      var line =  "io equ $FF ; a comment";
      expect(toyGrammar.parse(line)).toEqual(expected);
    });
    it('EQU directive must have label', function() {
      shouldThrow(" equ $42", "LABEL required for EQU directive.");
    });
    describe('ASCII directive', function() {
      it('expands to length-prefixed HEX padded with null', function() {
        expect(toyGrammar.parse(' ASCII "Hello!"')).toEqual({
          operation: "HEX",
          operands: { data: [4, 0x4865, 0x6C6C, 0x6F21,0x0000] }
        });
      });
      it('odd length strings padded in low-byte', function() {
        expect(toyGrammar.parse(' ASCII "Hello"')).toEqual({
          operation: "HEX",
          operands: { data: [3, 0x4865, 0x6C6C, 0x6F00] }
        });
      });
      it('single quotes OK', function() {
        expect(toyGrammar.parse(" ASCII 'Hello'")).toEqual({
          operation: "HEX",
          operands: { data: [3, 0x4865, 0x6C6C, 0x6F00] }
        });
      });
      it('escaped quotes will not work properly', function() {
        shouldThrow(' ASCII "Hel\"lo"', "Escaped quotes not supported");
      });
    });
  });
  describe('instructions', function() {
    describe('overall structure', function() {
      it('has four parts', function() {
        var expected = {
          label: "FOO",
          operation: "ADDR",
          operands: { d: 0x200, s: 0x30, t: 4 },
          comment: "stuff, and more"
        };
        var line = "foo ADDR,R2 R3 R4 ; stuff, and more";
        expect(toyGrammar.parse(line)).toEqual(expected);
      });
      it('labels are optional', function() {
        var expected = {
          operation: "ADDR",
          operands: { d: 0x200, s: 0x30, t: 4 },
          comment: "stuff, and more"
        };
        var line = " ADDR,R2 R3 R4 ; stuff, and more";
        expect(toyGrammar.parse(line)).toEqual(expected);
      });
      it('comments are optional', function() {
        var expected = {
          label: "FOO",
          operation: "ADDR",
          operands: { d: 0x200, s: 0x30, t: 4 },
        };
        var line = "foo ADDR,R2 R3 R4";
        expect(toyGrammar.parse(line)).toEqual(expected);
      });
      it('can be just opcode and operand', function() {
        var expected = { operation: "ADDR", operands: { d: 0x200, s: 0x30, t: 0xC }, };
        expect(toyGrammar.parse(" ADDR,R2 R3 RC")).toEqual(expected);
      });
      it('must start with space if no label', function() {
        shouldThrow('ADDR,R2 R3 R4', "Invalid label character. (missing initial whitespace?)");
      });
    });
    describe('type one', function() {
      it('must have two registers as operands', function() {
        shouldThrow(" ADDR,RD", "Type 1 operations must have form XXXX,RX RX RX");
      });
      it('all supported codes have same format', function() {
        _.each(["ADDR","SUBR","ANDR","XORR","SHRL","SHRR"],function(mnemonic) {
          var expected = { operation: mnemonic, operands: { d: 0xF00, s: 0x30, t: 4 }, };
          var inst = " " + mnemonic + ",RF R3 R4";

          expect(toyGrammar.parse(inst)).toEqual(expected);
        });
      });
    });

    describe('type 2', function() {
      it('must have an address or a value as operands', function() {
        shouldThrow(" LOAD,RD", "Type 2 operations must have form XXXX,RX register|address|value");
        shouldThrow(" LOAD,RD R1 R2", "Type 2 operations must have form XXXX,RX register|address|value");
      });
      it('can have a label as operand', function() {
        var expected = { operation: "LOAD", operands: { d: 0x200, label: "FOO" }, };
        expect(toyGrammar.parse(" LOAD,R2 foo")).toEqual(expected);
      });
      it('can have value label as operand', function() {
        var expected = { operation: "LOAD", operands: { d: 0x200, label: "#FOO" }, };
        expect(toyGrammar.parse(" LOAD,R2 #foo")).toEqual(expected);
      });
      it('BRN instructions do not accept registers', function() {
        shouldThrow(" BRNP,R2 R3","Invalid operand for BRNP: R3");
        shouldThrow(" BRNZ,R2 R3","Invalid operand for BRNZ: R3");
      });
      describe('LOAD', function() {
        it('an immediate value', function() {
          expect(toyGrammar.parse(" load,r2 #$10")).toEqual({
            operation: "LOAD", 
            operands: { d: 0x200, value: 0x10 }, 
          });
          expect(toyGrammar.parse(" load,r2 #1")).toEqual({
            operation: "LOAD", 
            operands: { d: 0x200, value: 1 }, 
          });
          expect(toyGrammar.parse(" LOAD,R1 #0")).toEqual({
            operation: "LOAD", 
            operands: { d: 0x100, value: 0 }, 
          });
          expect(toyGrammar.parse(" LOAD,R1 #0")).toEqual({
            operation: "LOAD", 
            operands: { d: 0x100, value: 0 }, 
          });
        });
        it('from an address', function() {
          var expected = { operation: "LOAD", operands: { d: 0x200, address: 0x10 }, };
          expect(toyGrammar.parse(" LOAD,R2 $10")).toEqual(expected);
        });
        it('from an address pointed to by a register', function() {
          var expected = { operation: "LOAD", operands: { d: 0x200, register: 0xC }, };
          expect(toyGrammar.parse(" LOAD,R2 RC")).toEqual(expected);
        });
      });
      it('BRNP (BRaNch if register is Positive)', function() {
        var expected = { operation: "BRNP", operands: { d: 0x200, address: 0x1C }, };
        expect(toyGrammar.parse(" BRNP,R2 $1C")).toEqual(expected);
      });
      it('BRNZ (BRaNch if register is Zero)', function() {
        var expected = { operation: "BRNZ", operands: { d: 0xD00, address: 0x1C }, };
        expect(toyGrammar.parse(" BRNZ,RD $1C")).toEqual(expected);
      });
      describe('STOR', function() {
        it('to an address', function() {
          var expected = { operation: "STOR", operands: { d: 0x200, address: 0x10 }, };
          expect(toyGrammar.parse(" STOR,R2 $10")).toEqual(expected);
        });
        it('to an address pointed to by a register', function() {
          var expected = { operation: "STOR", operands: { d: 0x200, register: 0xC }, };
          expect(toyGrammar.parse(" STOR,R2 RC")).toEqual(expected);
        });
        it('cannot store to a literal', function() {
          shouldThrow(" STOR,R2 #$42", "Cannot STOR to literal (#) value");
        });
      });
      it('MOV', function() {
        var expected = { 
          operation: "ADDR", 
          operands: { d:0x200, s:0, t:3 }
        };
        expect(toyGrammar.parse(" MOV,R2 R3")).toEqual(expected);
      });
      it('MOV does not accept an adress', function() {
        shouldThrow(" MOV,R2 $42", "MOV is register -> register");
      });
      it('MOV does not accept a value', function() {
        shouldThrow(" MOV,R2 #$42", "MOV is register -> register");
      });
      it('MOV does not accept any arguments', function() {
        shouldThrow(" MOV,R2 asdf", "MOV is register -> register");
      });
    });
    describe('type 3', function() {
      it('cannot have operands', function() {
        shouldThrow(" JMPL,RD $10", "Type 3 operations cannot have operands");
      });
      it('HALT', function() {
        expect(toyGrammar.parse(" HALT")).toEqual({ operation: "HALT" });
      });
      it('JMPR (JuMP to address pointed to by Register)', function() {
        var expected = { operation: "JMPR", operands: { d: 0xD00 }, };
        expect(toyGrammar.parse(" JMPR,RD")).toEqual(expected);
      });
      it('JMPL (JuMP to address pointed to by register and Link (put PC into register))', function() {
        var expected = { operation: "JMPL", operands: { d: 0xD00 }, };
        expect(toyGrammar.parse(" JMPL,RD")).toEqual(expected);
      });
    });
    describe('pseudo ops', function() {
      it('NOP', function() {
       expect(toyGrammar.parse(" NOP")).toEqual({ 
         operation: "BRNP", operands: {d:0}
       });
      });
      it('NOP accepts no args', function() {
       shouldThrow(" NOP #$80", "Type 4 operations cannot have operands");
       });
       it('JMP', function() {
         expect(toyGrammar.parse(" JMP $42")).toEqual({ 
           operation: "BRNZ", operands: {d:0, address:0x42}
         });
       });
       it('JMP values treated as addresess', function() {
         expect(toyGrammar.parse(" JMP #$42")).toEqual({ 
           operation: "BRNZ", operands: {d:0, address:0x42}
         });
       });
       it('JMP cannot have a register', function() {
         shouldThrow(" JMP R2", "JMP must have an address");
       });
       it('JMP cannot have no argument', function() {
         shouldThrow(" JMP", "JMP must have an address");
       });
    });
  });
});


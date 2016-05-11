'use strict';

describe('TOY ASM', function() {
  describe('assemble', function() {
    it('pads the front of the assembly with a 16 bit 0 and a default program counter of 0x10', function() {
      expect().toEqual();
      var code = "";
      var binary = Uint16Array.from([0,16]);
      expect(toyAsm.assemble(code)).toEqual(binary);
    });
    it('assembles TOY opcodes to binary', function() {
      var code = "1234\n45FF\n891C";
      var binary = Uint16Array.from([0,16,4660,17919,35100]);
      expect(toyAsm.assemble(code)).toEqual(binary);
    });
    it('handles empty lines in code', function() {
      var code = "1234\n\n891C";
      var binary = Uint16Array.from([0,16,4660,35100]);
      expect(toyAsm.assemble(code)).toEqual(binary);
    });
    it('will throw if given a non-numeric (hex) string', function() {
      var code = "1234\n567Z\nFF4F";
      var actual = function() { toyAsm.assemble(code); };
      expect(actual).toThrow({name:"syntax", line: 2, message: "syntax error, line 2: 567Z"});
    });

    it('will throw if given a numeric opcode fewer than 4 digits', function() {
      var code = "1234\n5678\nF4F";
      var actual = function() { toyAsm.assemble(code); };
      expect(actual).toThrow({name:"invalid", line: 3, message: "invalid opcode, line 3: F4F"});
    });
    it('will not throw if instruction surrounded by whitespace', function() {
      var code = "    1234   \n   5678\nFFFF";
      var binary = Uint16Array.from([0,16,0x1234,0x5678,0xFFFF]);
      expect(toyAsm.assemble(code)).toEqual(binary);
    });
  });
  describe('serialization', function() {
    it('deserializes to TOY byte code', function() {
      var code = ['0000', '0020','1234'].join('');
      var result = Uint16Array.from([0x0000, 0x0020,0x1234]);
      expect(toyAsm.deserialize(code)).toEqual(result);
    });  

    it('serializes to hex string', function() {
      var code = Uint16Array.from([0x0000, 0x0020,0x1234]);
      var result = '000000201234';
      expect(toyAsm.serialize(code)).toEqual(result);
    });
  });
});


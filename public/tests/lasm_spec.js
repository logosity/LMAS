'use strict';

describe('LMAS Assembler', function() {
  it('pads the front of the assembly with a 16 bit header of 0 and a default program counter of 0', function() {
    var code = "";
    var binary = Uint16Array.from([0,10]);
    expect(lasm.assemble(code)).toEqual(binary);
  });
  describe('@ macro processing', function() {
    it('converts @ arguments to binary format', function() {
    var code = ' @ 1234 45FF 891C';
    var binary = Uint16Array.from([0,10,0x1234,0x45ff,0x891c]);
    expect(lasm.assemble(code)).toEqual(binary);
    });
    it('sets the lc if an address is given', function() {
    var code = ' @3 1234 45FF 891C';
    var binary = Uint16Array.from([0,3,0,0,0,0x1234,0x45ff,0x891c]);
    expect(lasm.assemble(code)).toEqual(binary);
    });
    it('handles a label if given', function() {
    var code = 'MSG @3 1234 45FF 891C';
    var binary = Uint16Array.from([0,3,0,0,0,0x1234,0x45ff,0x891c]);
    expect(lasm.assemble(code)).toEqual(binary);
    });
  });
  describe('symbol table', function() {
    it('for an EQU directive', function() {
      var code = lasm.prepare("IO EQU $42\n");
      var symbols = lasm.buildSymbols(code).symbols;
      expect(symbols).toEqual({ IO: 0x42 });
    });
    it('for a single line', function() {
      var code = lasm.prepare("foo LOAD,R2 $10\n");
      expect(lasm.buildSymbols(code)).toEqual({
        pc: 10,
        symbols: {
          FOO: 10
      }});
    });
    it('for multiple lines', function() {
      var code = lasm.prepare("foo LOAD,R2 $10\nBAR ADDR,R2 R3 R4");
      expect(lasm.buildSymbols(code)).toEqual({
        pc: 10,
        symbols: {
          FOO: 0x0A,
          BAR: 0x0B
      }});
    });
    it('for multiple lines including lines without labels', function() {
      var code = lasm.prepare("foo LOAD,R3 #$41\n LOAD,R4 #$01\nBAR ADDR,R2 R3 R4");
      expect(lasm.buildSymbols(code)).toEqual({
        pc: 0x0A,
        symbols: {
          FOO: 0x0A,
          BAR: 0x0C
      }});
    });
    it('for multiple labels in a row', function() {
      var code = lasm.prepare("foo\nbar\n LOAD,R4 #$01");
      expect(lasm.buildSymbols(code)).toEqual({
        pc: 10,
        symbols: {
          FOO: 10,
          BAR: 10
      }});
    });
    it('adjusted by a midpoint ORG directive', function() {
      var code = lasm.prepare("foo LOAD,R3 #$41\n LOAD,R4 #$01\n ORG $42\nBAR ADDR,R2 R3 R4");
      expect(lasm.buildSymbols(code)).toEqual({
        pc: 0x0A,
        symbols: {
          FOO: 0x0A,
          BAR: 0x42
      }});
    });
    it('adjusted by an initial ORG directive', function() {
      var code = lasm.prepare(" ORG $42\nfoo LOAD,R3 #$41\n LOAD,R4 #$01\nBAR ADDR,R2 R3 R4");
      expect(lasm.buildSymbols(code)).toEqual({
        pc: 0x42,
        symbols: {
          FOO: 0x42,
          BAR: 0x44
      }});
    });
    it('strips out comments', function() {
      var code = lasm.prepare("; comment one\n;comment two\n ORG $42\n");
      lasm.buildSymbols(code)
      expect(code[0].operation).toEqual("ORG");
      expect(code[0].lineNumber).toEqual(0);
    });
  });
  describe('translate', function() {
    it('ADDR (ADD Register)', function() {
      var code = ' ADDR,R2 R3 R4';
      var binary = Uint16Array.from([0,10,0x1234]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('ANDR (AND Registers)', function() {
      var code = ' ANDR,R2 R3 R4';
      var binary = Uint16Array.from([0,10,0x3234]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('BRNP (BRaNch if Positive)', function() {
      var code = 'FOO EQU $42\n BRNP,R2 $80\n BRNP,R2 FOO\n';
      var binary = Uint16Array.from([0,10,0xD280,0xD242]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('BRNZ (BRaNch if Zero)', function() {
      var code = 'FOO EQU $42\n BRNZ,R2 $80\n BRNZ,R2 FOO\n';
      var binary = Uint16Array.from([0,10,0xC280,0xC242]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('HALT', function() {
      var code = ' HALT';
      var binary = Uint16Array.from([0,10,0]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('JMPL (JuMP and Link register)', function() {
      var code = ' JMPL,R2\n';
      var binary = Uint16Array.from([0,10,0xF200]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('JMPR (JuMP Register)', function() {
      var code = ' JMPR,R2\n';
      var binary = Uint16Array.from([0,10,0xE200]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    describe('LOAD', function() {
      it('from literal value', function() {
        var code = ' LOAD,R2 #$80\n load,r2 #$FF\n load,r3 #1\n LOAD,R1 #0';
        var binary = Uint16Array.from([0,10,0x7280,0x72FF,0x7301,0x7100]);
        expect(lasm.assemble(code)).toEqual(binary);
      });
      it('from address', function() {
        var code = ' LOAD,R2 $80';
        var binary = Uint16Array.from([0,10,0x8280]);
        expect(lasm.assemble(code)).toEqual(binary);
      });
      it('from address label', function() {
        var code = 'IO EQU $FF\n LOAD,R2 IO';
        var binary = Uint16Array.from([0,10,0x82FF]);
        expect(lasm.assemble(code)).toEqual(binary);
      });
      it('from value label', function() {
        var code = 'IO EQU $FF\n LOAD,R2 #IO';
        var binary = Uint16Array.from([0,10,0x72FF]);
        expect(lasm.assemble(code)).toEqual(binary);
      });
      it('from address pointed to by register', function() {
        var code = ' LOAD,R2 RF';
        var binary = Uint16Array.from([0,10,0xA20F]);
        expect(lasm.assemble(code)).toEqual(binary);
      });
    });
    it('SHRL (SHift Register Left)', function() {
      var code = ' SHRL,R2 R3 R4';
      var binary = Uint16Array.from([0,10,0x5234]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('SHRR (SHift Register Right)', function() {
      var code = ' SHRR,R2 R3 R4';
      var binary = Uint16Array.from([0,10,0x6234]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('STOR', function() {
      var code = 'FOO EQU $42\n STOR,R2 R3\n STOR,R2 $80\n STOR,R2 FOO\n';
      var binary = Uint16Array.from([0,10,0xB203,0x9280,0x9242]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('SUBR (SUBtract Register)', function() {
      var code = ' SUBR,R2 R3 R4';
      var binary = Uint16Array.from([0,10,0x2234]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('XORR (eXlusive OR Registers)', function() {
      var code = ' XORR,R2 R3 R4';
      var binary = Uint16Array.from([0,10,0x4234]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('ORG padding', function() {
      var code = ' ADDR,R2 R3 R4\n ORG 3\n ADDR,R2 R3 R4\n ORG 9\n ADDR,R2 R3 R4';
      var binary = Uint16Array.from([0,10,0x1234,0,0,0x1234,0,0,0,0,0,0x1234]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
  });
});


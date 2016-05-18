'use strict';

describe('LMAS Assembler', function() {
  it('pads the front of the assembly with a 16 bit header of 0 and a default program counter of 0', function() {
    var code = "";
    var binary = Uint16Array.from([0,0]);
    expect(lasm.assemble(code)).toEqual(binary);
  });
  describe('@ macro processing', function() {
    it('converts @ arguments to binary format', function() {
    var code = ' @ 1234 45FF 891C';
    var binary = Uint16Array.from([0,0,0x1234,0x45ff,0x891c]);
    expect(lasm.assemble(code)).toEqual(binary);
    });
    it('sets the lc if an address is given', function() {
    var code = ' @$10 1234 45FF 891C';
    var binary = Uint16Array.from([0,0x10,0x1234,0x45ff,0x891c]);
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
        pc: 0,
        symbols: {
          FOO: 0
      }});
    });
    it('for multiple lines', function() {
      var code = lasm.prepare("foo LOAD,R2 $10\nBAR ADDR,R2 R3 R4");
      expect(lasm.buildSymbols(code)).toEqual({
        pc: 0,
        symbols: {
          FOO: 0,
          BAR: 1
      }});
    });
    it('for multiple lines including lines without labels', function() {
      var code = lasm.prepare("foo LOAD,R3 #$41\n LOAD,R4 #$01\nBAR ADDR,R2 R3 R4");
      expect(lasm.buildSymbols(code)).toEqual({
        pc: 0,
        symbols: {
          FOO: 0,
          BAR: 2
      }});
    });
    it('for multiple labels in a row', function() {
      var code = lasm.prepare("foo\nbar\n LOAD,R4 #$01");
      expect(lasm.buildSymbols(code)).toEqual({
        pc: 0,
        symbols: {
          FOO: 0,
          BAR: 0
      }});
    });
    it('adjusted by a midpoint ORG directive', function() {
      var code = lasm.prepare("foo LOAD,R3 #$41\n LOAD,R4 #$01\n ORG $42\nBAR ADDR,R2 R3 R4");
      expect(lasm.buildSymbols(code)).toEqual({
        pc: 0,
        symbols: {
          FOO: 0,
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
  });
  describe('translate', function() {
    describe('LOAD', function() {
      it('from literal value', function() {
        var code = ' LOAD,R2 #$80';
        var binary = Uint16Array.from([0,0,0x7280]);
        expect(lasm.assemble(code)).toEqual(binary);
      });
      it('from address', function() {
        var code = ' LOAD,R2 $80';
        var binary = Uint16Array.from([0,0,0x8280]);
        expect(lasm.assemble(code)).toEqual(binary);
      });
      it('from address label', function() {
        var code = 'IO EQU $FF\n LOAD,R2 IO';
        var binary = Uint16Array.from([0,0,0x82FF]);
        expect(lasm.assemble(code)).toEqual(binary);
      });
      it('from address pointed to by register', function() {
        var code = ' LOAD,R2 RF';
        var binary = Uint16Array.from([0,0,0xA20F]);
        expect(lasm.assemble(code)).toEqual(binary);
      });
    });
    it('ADDR', function() {
      var code = ' ADDR,R2 R3 R4';
      var binary = Uint16Array.from([0,0,0x1234]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('SUBR', function() {
      var code = ' SUBR,R2 R3 R4';
      var binary = Uint16Array.from([0,0,0x2234]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('HALT', function() {
      var code = ' HALT';
      var binary = Uint16Array.from([0,0,0]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('BRNP', function() {
      var code = 'FOO EQU $42\n BRNP,R2 $80\n BRNP,R2 FOO\n';
      var binary = Uint16Array.from([0,0,0xD280,0xD242]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
    it('BRNZ', function() {
      var code = 'FOO EQU $42\n BRNZ,R2 $80\n BRNZ,R2 FOO\n';
      var binary = Uint16Array.from([0,0,0xC280,0xC242]);
      expect(lasm.assemble(code)).toEqual(binary);
    });
  });
});


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
});


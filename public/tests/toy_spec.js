'use strict';

describe('TOY machine', function() {
  it('can load a program into memory at default location', function() {
    var program = ['1234','4567','89AB'];
    var memmap = $('<div>');

    memmap.append($('<div>').attr('id','M10'));
    memmap.append($('<div>').attr('id','M11'));
    memmap.append($('<div>').attr('id','M12'));
    memmap.append($('<div>').attr('id','M13').text("0000"));

    var result = toy.load(memmap,program.join('\n') + '\n');
    expect($(result).find("#M10").text()).toEqual(program[0]);
    expect($(result).find("#M11").text()).toEqual(program[1]);
    expect($(result).find("#M12").text()).toEqual(program[2]);
    expect($(result).find("#M13").text()).toEqual('0000');
  });
  it('can parse an opcode', function() {
    expect(toy.parseInstruction('1249')).toEqual(['1','2','49']);

  });
  describe('memory map',function() {
    it('can be accessed via core dump', function() {
      var core = toy.coreDump();
      var isZero = function(num) { return num === 0; };
      expect(core.pc).toEqual(0x10);
      expect(core.registers.length).toEqual(16);
      expect(_.every(core.registers, isZero)).toBe(true);
      expect(core.ram.length).toEqual(256);
      expect(_.every(core.ram, isZero)).toBe(true);
    });
  });
});

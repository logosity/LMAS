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
    it('contains 256 objects', function() {
      expect(toy.memoryMap().length).toEqual(256);
    });
    it('memory addresses are sequential and numeric', function() {
      expect(toy.memoryMap()[0].name).toEqual(0);
      expect(toy.memoryMap()[25].name).toEqual(25);
      expect(toy.memoryMap()[44].name).toEqual(44);
      expect(toy.memoryMap()[128].name).toEqual(128);
      expect(toy.memoryMap()[255].name).toEqual(255);
    });

    it('has 17 registers', function() {
      expect(toy.registers().length).toEqual(17);
    });

    it('register names are by position', function() {
      expect(util.attrs(toy.registers(),'name')[0]).toEqual("PC");
      expect(util.attrs(toy.registers(),'name')[1]).toEqual("R0");
      expect(util.attrs(toy.registers(),'name')[16]).toEqual("RF");
    });
  });
});

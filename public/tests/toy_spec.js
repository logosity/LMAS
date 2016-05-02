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
    it('contains 256, 16-bit memory objects', function() {
      expect(toy.memoryMap().length).toEqual(256);
    });
    it('location ids are based on their position in hex', function() {
      expect(toy.memoryMap()[0].id).toEqual("M00");
      expect(toy.memoryMap()[25].id).toEqual("M19");
      expect(toy.memoryMap()[44].id).toEqual("M2C");
      expect(toy.memoryMap()[128].id).toEqual("M80");
      expect(toy.memoryMap()[255].id).toEqual("MFF");
    });

    it('location contents are initialized to 0 (16 bit hex)', function() {
      expect(_.filter(toy.memoryMap(), function(i) { return i.value === "0000";}).length).toEqual(256);
    });

    it('generates a row header for every 16th element', function() {
      expect(toy.rowHeaders().length).toEqual(16);
    });

    it('row header contents are the memory location at the head of the row', function() {
      expect(toy.rowHeaders()[0].value).toEqual("00");
      expect(toy.rowHeaders()[1].value).toEqual("10");
      expect(toy.rowHeaders()[10].value).toEqual("A0");
      expect(toy.rowHeaders()[15].value).toEqual("F0");
    });

    it('row header elements are th', function() {
      expect(_.filter(toy.rowHeaders(), function(i) { return i.elem === "th";}).length).toEqual(16);
    });

    it('has 17 registers', function() {
      expect(toy.registers().length).toEqual(17);
    });

    it('register ids are their TOY names', function() {
      expect(util.attrs(toy.registers(),'id')[0]).toEqual("PC");
      expect(util.attrs(toy.registers(),'id')[1]).toEqual("R0");
      expect(util.attrs(toy.registers(),'id')[16]).toEqual("RF");
    });

    it('registers are initialized to zero', function() {
      var registers = toy.registers();
      expect(util.get(registers,"id","PC").value).toEqual("00");
      expect(util.get(registers,"id","R0").value).toEqual("0000");
      expect(util.get(registers,"id","RF").value).toEqual("0000");
    });
  });
});

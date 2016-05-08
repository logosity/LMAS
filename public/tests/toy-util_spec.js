'use strict';

describe('TOY util', function() {
  describe('decoration', function() {
    var bytes;
    beforeEach(function() {
      bytes = toy.util.create();
    });
    it('creates a representation of toy binary format', function() {
      expect(bytes instanceof Uint16Array).toBe(true);
      expect(bytes.length).toBe(274);
    });
    it('decorates the result with toy.util fns', function() {
      _.each(_.functions(toy.util),function(fn) {
        expect(_.contains(_.functions(bytes), fn)).toBe(true);
      })
    });
    it('decorates an existing representation with fns', function() {
      var arr = toy.util.decorate(new Uint16Array(274));
      _.each(_.functions(toy.util),function(fn) {
        expect(_.contains(_.functions(arr), fn)).toBe(true);
      })
    });
  });

  describe('utility array functions', function() {
    var bytes;
    beforeEach(function() {
      bytes = new Uint16Array(274);
    });
    it('picks out a region of the bytes', function() {
      _.each([2,4,6,8], function(n) {
        bytes[n] = n;
      });
     
      var result = toy.util.region(bytes,2,7);
      expect(result).toEqual(Uint16Array.from([2,0,4,0,6,0,8]));
    });
    it('picks out header', function() {
      bytes[0] = 1;
      expect(toy.util.header(bytes)).toEqual(Uint16Array.from([1]));
    });  
    it('picks out program counter', function() {
      bytes[1] = 0x10;
      expect(toy.util.pc(bytes)).toEqual(Uint16Array.from([0x10]));
    });
    it('picks out registers', function() {
      bytes[3] = 0x1234;
      bytes[17] = 0xFF00;
      var registers = toy.util.registers(bytes);
      expect(registers.length).toEqual(16);
      expect(registers[1]).toEqual(0x1234);
      expect(registers[15]).toEqual(0xFF00);
    });
    it('picks out RAM', function() {
      bytes[18] = 0x1234;
      bytes[200] = 0xCC00;
      bytes[273] = 0xFFFF;
      var ram = toy.util.ram(bytes);
      expect(ram.length).toEqual(256);
      expect(ram[0]).toEqual(0x1234);
      expect(ram[182]).toEqual(0xCC00);
      expect(ram[255]).toEqual(0xFFFF);
    });
  });
  describe('utility scalar functions', function() {
    var bytes;
    beforeEach(function() {
      bytes = new Uint16Array(274);
    });
    it('get and set the PC', function() {
      expect(toy.util.getPcIn(bytes)).toEqual(0);
      expect(bytes[1]).toEqual(0);
      toy.util.setPcIn(bytes,0x10);
      expect(toy.util.getPcIn(bytes)).toEqual(0x10);
      expect(bytes[1]).toEqual(0x10);
    });
    it('get and set a register', function() {
      expect(toy.util.getRegisterIn(bytes,1)).toEqual(0);
      expect(bytes[3]).toEqual(0);
      toy.util.setRegisterIn(bytes,1,0x1234);
      expect(toy.util.getRegisterIn(bytes,1)).toEqual(0x1234);
      expect(bytes[3]).toEqual(0x1234);
    });
    it('get and set a memory location', function() {
      expect(toy.util.getRamIn(bytes,0)).toEqual(0);
      expect(bytes[18]).toEqual(0);
      toy.util.setRamIn(bytes,0,0xFF00);
      expect(toy.util.getRamIn(bytes,0)).toEqual(0xFF00);
      expect(bytes[18]).toEqual(0xFF00);
    });
  });
});


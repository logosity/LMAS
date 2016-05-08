'use strict';

describe('TOY util', function() {
  var bytes;
  beforeEach(function() {
    bytes = toy.util.create();
  });
  describe('decoration', function() {
    it('creates an empty representation of toy binary format', function() {
      expect(bytes instanceof Uint16Array).toBe(true);
      expect(bytes.length).toBe(274);
    });
    it('decorates the result with toy.util fns', function() {
      _.each(_.functions(toy.util.fns),function(fn) {
        expect(_.contains(_.functions(bytes), fn)).toBe(true);
      })
    });
    it('decorates an existing representation with fns', function() {
      var arr = toy.util.decorate(new Uint16Array(274));
      _.each(_.functions(toy.util.fns),function(fn) {
        expect(_.contains(_.functions(arr), fn)).toBe(true);
      })
    });
  });

  describe('getting and setting portions of memory', function() {
    it('picks out a region of the bytes', function() {
      _.each([2,4,6,8], function(n) {
        bytes[n] = n;
      });
     
      var result = bytes.region(2,7);
      expect(result).toEqual(Uint16Array.from([2,0,4,0,6,0,8]));
    });
    it('get header', function() {
      bytes[0] = 0;
      expect(bytes.header()).toEqual(0);
      bytes.header(1);
      expect(bytes.header()).toEqual(1);
      bytes[0] = 1;
    });  
    it('get and set program counter', function() {
      bytes[1] = 0x10;
      expect(bytes.pc()).toEqual(0x10);
      bytes.pc(0x20);
      expect(bytes.pc()).toEqual(0x20);
      expect(bytes[1]).toEqual(0x20);
    });
    it('get and set registers', function() {
      bytes[3] = 0x1234;
      bytes[17] = 0xFF00;
      expect(bytes.registers().length).toEqual(16);
      expect(bytes.registers(1)).toEqual(0x1234);
      expect(bytes.registers(15)).toEqual(0xFF00);
      bytes.registers(1,0x1234);
      expect(bytes.registers(1)).toEqual(0x1234);
      expect(bytes[3]).toEqual(0x1234);
      var reg = Uint16Array.from([0,1,2,0,0,0,0,0,0,0,0,0xB,0,0,0,0xF]);
      bytes.registers(reg);
      expect(bytes.registers()).toEqual(reg);
    });
    it('get and set RAM', function() {
      bytes[18] = 0x1234;
      bytes[200] = 0xCC00;
      bytes[273] = 0xFFFF;

      expect(bytes.ram().length).toEqual(256);
      expect(bytes.ram(0)).toEqual(0x1234);
      expect(bytes.ram(182)).toEqual(0xCC00);
      expect(bytes.ram(255)).toEqual(0xFFFF);
      bytes.ram(0,0xFF00);
      expect(bytes.ram(0)).toEqual(0xFF00);
      expect(bytes[18]).toEqual(0xFF00);

      var ram = new Uint16Array(256);
      ram[0] = 0x1234;
      ram[10] = 0xFFCC;
      ram[255] = 0xFFFF;
      bytes.ram(ram);
      expect(bytes.ram()).toEqual(ram);
    });
  });
});


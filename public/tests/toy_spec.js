'use strict';

describe('TOY machine', function() {
  var toyObj;
  beforeEach(function() {
    toyObj = new Toy();
  });
  it('can parse an opcode', function() {
    expect(toyObj.parseInstruction('1249')).toEqual(['1','2','49']);

  });
  describe('reset', function() {
     it('sets the state of the machine to default', function() {
      var defaultState = toyObj.dump();
      var newState = toy.util.decorate(Uint16Array.from(defaultState));
      newState.pc(0x20);
      newState.registers(1, 0xFFCC);
      newState.ram(0xC0,0x1F1C);
      toyObj.load(newState);
      expect(toyObj.dump()).not.toEqual(defaultState);
      toyObj.reset();

      expect(toyObj.dump()).toEqual(defaultState);
      
     });
  });
  describe('dump',function() {
    it('can be dumped to bytes', function() {
      var bytes = toyObj.dump();
      expect(bytes.length).toEqual(274);
      expect(bytes.header()).toEqual(1);
      expect(bytes.pc()).toEqual(0x10);
      _.each(bytes.slice(2),function(b) {
        expect(b).toEqual(0);
      });
    });
  });
  describe('load',function() {
    it('can load a byte dump', function() {
      var bytes = toy.util.create();
      bytes[0] = 1;
      bytes.pc(0x20);
      bytes.registers(1, 0x4f56);
      bytes.ram(0x14, 0x1234);
      bytes.ram(0xFF, 0xFF00);

      toyObj.load(bytes);
      
      var dump = toyObj.dump();
      expect(dump.pc()).toEqual(0x20);
      expect(dump.registers(1)).toEqual(0x4f56);
      expect(dump.ram(0x14)).toEqual(0x1234);
      expect(dump.ram(0xFF)).toEqual(0xff00);
    });
    it('can load a program', function() {
      var bytes = toy.util.decorate(new Uint16Array(5));
      var code = Uint16Array.from([0x1234,0x45ff,0x3455]);
      bytes.set([0,0x20],0);
      bytes.set([0x1234,0x45ff,0x3455],2);

      toyObj.load(bytes);

      var dump = toyObj.dump();
      expect(dump.pc()).toEqual(0x20);
      expect(dump.ram(0x20)).toEqual(0x1234);
      expect(dump.ram(0x21)).toEqual(0x45ff);
      expect(dump.ram(0x22)).toEqual(0x3455);
    });
    it('will only load an array of type Uint16Array', function() {
      expect(function() {toyObj.load("foobarbaz");}).toThrow({name:"invalid", message: "invalid binary format for loading"});
      expect(function() {toyObj.load("foo\nbar\nbaz");}).toThrow({name:"invalid", message: "invalid binary format for loading"});
      expect(function() {toyObj.load([1,2,3]);}).toThrow({name:"invalid", message: "invalid binary format for loading"});
      expect(function() {toyObj.load(Uint8Array.from([1,2,3]));}).toThrow({name:"invalid", message: "invalid binary format for loading"});
    });
    describe('raising change events', function() {
      var handlers;
      beforeEach(function() {
        handlers = {
          memoryChange: function() {},
          registerChange: function() {},
          pcChange: function() {}
        };

        spyOn(handlers,'memoryChange');
        spyOn(handlers,'registerChange');
        spyOn(handlers,'pcChange');
        toyObj = new Toy(handlers);
      });
      describe('a program load', function() {
        it('triggers a memory event for each opcode', function() {
          toyObj.load(Uint16Array.from([0, 0x20,0x1234]));
          expect(handlers.memoryChange).toHaveBeenCalledWith(0x20,0x1234);
        });  
      });
      describe('a full core load', function() {
        it('triggers a memory event for each address in RAM', function() {
          var bytes = toy.util.create();
          bytes[0] = 1;
          bytes.pc(0x10);
          toyObj.load(bytes);
          expect(handlers.memoryChange).toHaveBeenCalledWith(0,0);
          expect(handlers.memoryChange).toHaveBeenCalledWith(0x10,0);
          expect(handlers.memoryChange).toHaveBeenCalledWith(0xC0,0);
          expect(handlers.memoryChange).toHaveBeenCalledWith(0xFF,0);
        });
        it('triggers a register event for every register', function() {
          var bytes = toy.util.create();
          bytes[0] = 1;
          bytes.pc(0x10);
          bytes.set([0,1,2,3,4,5,6,7,8,9,0xA,0xB,0xC,0xD,0xE,0xF],2);
          toyObj.load(bytes);
          expect(handlers.registerChange).toHaveBeenCalledWith(0,0);
          expect(handlers.registerChange).toHaveBeenCalledWith(1,0);
          expect(handlers.registerChange).toHaveBeenCalledWith(0xC,0);
          expect(handlers.registerChange).toHaveBeenCalledWith(0xF,0);
        });
        it('triggers a pc event for the program counter', function() {
          var bytes = toy.util.create();
          bytes[0] = 1;
          bytes.pc(0x10);
          toyObj.load(bytes);
          expect(handlers.pcChange).toHaveBeenCalledWith(0x10);
        });
      });  
    });
  });
});

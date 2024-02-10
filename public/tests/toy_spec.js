'use strict';

describe('TOY machine', function() {
  var toyObj;
  beforeEach(function() {
    toyObj = toy.create();
  });
  describe('run', function() {
    it('can run a program', function() {
      toyObj.load(Uint16Array.from([2,0x10,0x7341,0x7401,0x1234,0x0000]));
      toyObj.run();
      var dump = toyObj.dump();
      expect(dump.pc()).toEqual(0x14);
      expect(dump.registers(3)).toEqual(0x41);
      expect(dump.registers(4)).toEqual(0x01);
      expect(dump.registers(2)).toEqual(0x42);
    });
    it('can step through a program', function() {
      toyObj.load(Uint16Array.from([2,0x10,0x7341,0x7401,0x1234,0x0000]));

      toyObj.step();
      var dump = toyObj.dump();
      expect(dump.pc()).toEqual(0x11);
      expect(dump.registers(3)).toEqual(0x41);
      expect(dump.registers(4)).toEqual(0x00);
      expect(dump.registers(2)).toEqual(0x00);

      toyObj.step();
      var dump = toyObj.dump();
      expect(dump.pc()).toEqual(0x12);
      expect(dump.registers(4)).toEqual(0x01);

      toyObj.step();
      var dump = toyObj.dump();
      expect(dump.pc()).toEqual(0x13);
      expect(dump.registers(2)).toEqual(0x42);

      toyObj.step();
      var dump = toyObj.dump();
      expect(dump.pc()).toEqual(0x14);

      toyObj.step();
      var dump = toyObj.dump();
      expect(dump.pc()).toEqual(0x15);
    });
    it('raises an event at the start of a step', function() {
      var handlers = { onStepStart: function() {} };
      spyOn(handlers,"onStepStart");
      var toyObj = toy.create(handlers);
      toyObj.load(Uint16Array.from([2,0x10,0x1234]));
      toyObj.step();
      expect(handlers.onStepStart).toHaveBeenCalledWith({pc: 0x10,instruction:toy.cycle.parse(0x1234)});
    });
    it('raises an event at the end of a step', function() {
      var handlers = { onStepEnd: function() {} };
      spyOn(handlers,"onStepEnd");
      var map = toy.util.create(handlers);
      spyOn(toy.util,"create").and.returnValue(map);
      var toyObj = toy.create(handlers);
      toyObj.load(Uint16Array.from([2,0x10,0x1234]));
      toyObj.step();
      expect(handlers.onStepEnd).toHaveBeenCalledWith({pc: 0x11,state: {pc: map.pc, registers: map.registers, ram: map.ram}, instruction:toy.cycle.parse(0x1234)});
    });
    it('raises an event on reset', function() {
      var handlers = { onReset: function() {} };
      spyOn(handlers,"onReset");
      var toyObj = toy.create(handlers);
      toyObj.reset();
      expect(handlers.onReset).toHaveBeenCalledWith({pc:10});
    });
    it('register zero is updated on on reset', function() {
      var handlers = { onRegisterChange: function() {} };
      spyOn(handlers,"onRegisterChange");
      var toyObj = toy.create(handlers);
      toyObj.reset();
      expect(handlers.onRegisterChange).toHaveBeenCalledWith({address: 0, value: 0});
    });
    it('raises an event on load', function() {
      var handlers = { onLoad: function() {} };
      spyOn(handlers,"onLoad");
      var toyObj = toy.create(handlers);
      toyObj.load(toy.util.create());
      expect(handlers.onLoad).toHaveBeenCalledWith({oldpc: 0x0A, pc:0x0A});
    });
  });

  describe('reset', function() {
     it('sets the state of the machine to default', function() {
      var defaultState = toyObj.dump();
      var newState = toy.util.decorate(Uint16Array.from(defaultState));
      newState.pc(0x20);
      newState.registers(1, 0xFFCC);
      newState.ram(0xC0,0x1F1C);
      toyObj.load(newState);

      var firstDump = toyObj.dump();
      expect(firstDump.pc()).not.toEqual(defaultState.pc());
      expect(firstDump.registers(1)).not.toEqual(defaultState.registers(1));
      expect(firstDump.ram(0xC0)).not.toEqual(defaultState.ram(0xC0));

      toyObj.reset();

      var secondDump = toyObj.dump();
      expect(secondDump.pc()).toEqual(defaultState.pc());
      expect(secondDump.registers(1)).toEqual(defaultState.registers(1));
      expect(secondDump.ram(0xC0)).toEqual(defaultState.ram(0xC0));

     });
  });
  describe('dump',function() {
    it('can be dumped to binary', function() {
      var binary = toyObj.dump();
      expect(binary.length).toEqual(274);
      expect(binary.header()).toEqual(1);
      expect(binary.pc()).toEqual(10);
      _.each(binary.slice(2),function(b) {
        expect(b).toEqual(0);
      });
    });
  });
  describe('load',function() {
    it('from zero mode (header 0)', function() {
      var binary = toy.util.create();
      binary.header(0)
      binary.pc(3);
      binary.set([0, 0, 0, 0x1234,0x45ff,0x3455],2);

      toyObj.load(binary);

      var dump = toyObj.dump();

      expect(dump.pc()).toEqual(0x03);
      expect(dump.ram(0x00)).toEqual(0);
      expect(dump.ram(0x01)).toEqual(0);
      expect(dump.ram(0x02)).toEqual(0);
      expect(dump.ram(0x03)).toEqual(0x1234);
      expect(dump.ram(0x04)).toEqual(0x45ff);
      expect(dump.ram(0x05)).toEqual(0x3455);
    });

    it('machine state mode (header 1)', function() {
      var binary = toy.util.create();
      binary.header(1);
      binary.pc(0x20);
      binary.registers(1, 0x4f56);
      binary.ram(0x14, 0x1234);
      binary.ram(0xFF, 0xFF00);

      toyObj.load(binary);

      var dump = toyObj.dump();

      expect(dump.pc()).toEqual(0x20);
      expect(dump.registers(1)).toEqual(0x4f56);
      expect(dump.ram(0x14)).toEqual(0x1234);
      expect(dump.ram(0xFF)).toEqual(0xff00);
    });

    it('pc offset mode (header 2)', function() {
      var binary = toy.util.create();
      binary.header(2);
      binary.pc(0x20);
      binary.set([0x1234,0x45ff,0x3455],2);

      toyObj.load(binary);

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
  });
  describe('TOY util', function() {
    var binary;
    beforeEach(function() {
      binary = toy.util.create();
    });
    describe('decoration', function() {
      it('creates an empty representation of toy binary format', function() {
        expect(binary instanceof Uint16Array).toBe(true);
        expect(binary.length).toBe(274);
      });
      it('decorates the result with toy.util fns', function() {
        _.each(_.functions(toy.util.fns),function(fn) {
          expect(_.contains(_.functions(binary), fn)).toBe(true);
        });
      });
      it('decorates an existing representation with fns', function() {
        var underlying = new Uint16Array(274);
        toy.util.decorate(underlying);
        _.each(_.functions(toy.util.fns),function(fn) {
          expect(_.contains(_.functions(underlying), fn)).toBe(true);
        });
      });
      describe('raising change events', function() {
        var handlers;
        var binary;
        beforeEach(function() {
          handlers = {
            onMemoryChange: function() {},
            onRegisterChange: function() {},
            onPcChange: function() {}
          };

          spyOn(handlers,'onMemoryChange');
          spyOn(handlers,'onRegisterChange');
          spyOn(handlers,'onPcChange');
          binary = toy.util.create(handlers);
        });
        it('changes to pc', function() {
          binary.pc(0x20);
          expect(handlers.onPcChange).toHaveBeenCalledWith({oldpc: 0x0A, pc: 0x20});
        });
        it('pc changes are 8-bit', function() {
          binary.pc(0x100);
          expect(handlers.onPcChange).toHaveBeenCalledWith({oldpc: 0x0A, pc: 0x00});
        });
        it('changes to single registers', function() {
          binary.registers(1,0);
          binary.registers(0xC,0x42);
          expect(handlers.onRegisterChange).toHaveBeenCalledWith({address:1, value: 0});
          expect(handlers.onRegisterChange).toHaveBeenCalledWith({address:0xC, value: 0x42});
        });
        it('changes to all registers', function() {
          binary.registers([0x10000,1,2,3,4,5,6,7,8,9,0xa,0xb,0xc,0xd,0xe,0xf]);
          _.each(_.range(1,16), function(register) {
            expect(handlers.onRegisterChange).toHaveBeenCalledWith({address: register,value: register});
          });
        });
        it('register changes are 16-bit', function() {
          binary.registers(2,0x10000);
          expect(handlers.onRegisterChange).toHaveBeenCalledWith({address: 2, value: 0x00});
        });
        it('changes to ram', function() {
          binary.ram(0x10,0xFF);
          expect(handlers.onMemoryChange).toHaveBeenCalledWith({address:0x10, value: 0xFF});
        });
        it('ram changes are 16-bit', function() {
          binary.ram(2,0x10000);
          expect(handlers.onMemoryChange).toHaveBeenCalledWith({address: 2, value: 0});
        });
        describe('turning handlers on and off', function() {
          it('disable all handlers', function() {
            binary.disableCallbacks();
            binary.pc(0x10);
            binary.registers(0,0x42);
            binary.ram(0,0x42);
            expect(handlers.onPcChange).not.toHaveBeenCalled();
            expect(handlers.onRegisterChange).not.toHaveBeenCalled();
            expect(handlers.onMemoryChange).not.toHaveBeenCalled();
          });
          it('enable all handlers', function() {
            binary.disableCallbacks();
            binary.enableCallbacks();
            binary.pc(0x10);
            binary.registers(1,0x42);
            binary.ram(0,0x42);
            expect(handlers.onPcChange).toHaveBeenCalled();
            expect(handlers.onRegisterChange).toHaveBeenCalled();
            expect(handlers.onMemoryChange).toHaveBeenCalled();
          });
        });
      });
    });

    describe('getting and setting portions of memory', function() {
      it('picks out a region of the binary', function() {
        _.each([2,4,6,8], function(n) {
          binary[n] = n;
        });

        var result = binary.region(2,7);
        expect(result).toEqual(Uint16Array.from([2,0,4,0,6,0,8]));
      });
      it('get header', function() {
        binary[0] = 0;
        expect(binary.header()).toEqual(0);
        binary.header(1);
        expect(binary.header()).toEqual(1);
      });
      describe('PC manipulation', function() {
        it('has a default of 10', function() {
          expect(binary.pc()).toEqual(0x0A)
        });

        it('get and set program counter', function() {
          binary.pc(0x10);
          expect(binary.pc()).toEqual(0x10);
          binary.pc(0x20);
          expect(binary.pc()).toEqual(0x20);
          expect(binary[1]).toEqual(0x20);
        });
        it('8-bit overflow', function() {
          binary.pc(0x0100);
          expect(binary.pc()).toEqual(0x00);
        });
      });

      describe('Register manipulation', function() {
        beforeEach(function() {
          binary[3] = 0x1234;
          binary[17] = 0xFF00;
        });
        it('get all of it', function() {
          expect(binary.registers().length).toEqual(16);
        });
        it('get single registers', function() {
          expect(binary.registers(1)).toEqual(0x1234);
          expect(binary.registers(15)).toEqual(0xFF00);
        });
        it('set single registers', function() {
          binary.registers(1,0x1234);
          expect(binary.registers(1)).toEqual(0x1234);
          expect(binary[3]).toEqual(0x1234);
        });
        it('set all registers', function() {
          var reg = Uint16Array.from([0,1,2,0,0,0,0,0,0,0,0,0xB,0,0,0,0xF]);
          binary.registers(reg);
          expect(binary.registers()).toEqual(reg);
        });
        it('16-bit overflow', function() {
          binary.registers(2,0x10000);
          expect(binary.registers(2)).toEqual(0x00);
        });
        it('register zero is always zero', function() {
          binary.registers(0,0x42);
          expect(binary.registers(0)).toEqual(0x00);
        });
      });
      describe('RAM manipulation', function() {
        beforeEach(function() {
          binary[18] = 0x1234;
          binary[200] = 0xCC00;
          binary[273] = 0xFFFF;
        });

        it('get all of it', function() {
          expect(binary.ram().length).toEqual(256);
        });
        it('getting single addresses', function() {
          expect(binary.ram().length).toEqual(256);
          expect(binary.ram(0)).toEqual(0x1234);
          expect(binary.ram(182)).toEqual(0xCC00);
          expect(binary.ram(255)).toEqual(0xFFFF);
        });
        it('setting a single address', function() {
          binary.ram(0,0xFF00);
          expect(binary.ram(0)).toEqual(0xFF00);
          expect(binary[18]).toEqual(0xFF00);
        });
        it('setting all of it', function() {
          var ram = new Uint16Array(256);
          ram[0] = 0x1234;
          ram[10] = 0xFFCC;
          ram[255] = 0xFFFF;
          binary.ram(ram);
          expect(binary.ram()).toEqual(ram);
        });
        it('16-bit overflow', function() {
          binary.ram(2,0x10000);
          expect(binary.ram(2)).toEqual(0x00);
        });
      });
    });
  });
  describe('instruction cycle', function() {
    it('can parse an instruction', function() {
      expect(toy.cycle.parse(0x124C)).toEqual({opcode: 1, d: 2, s:4, t: 0xc, addr: 0x4c});

    });
    it('can fetch instructions', function() {
      var map = toy.util.create();
      map.pc(0x10);
      map.ram(map.pc(),0x12fe);
      expect(toy.cycle.fetch(map.pc, map.ram)).toEqual({opcode:1,d:2,addr:0xfe,s:0xf,t:0xe});
    });
    describe('TOY instruction set', function() {
      var map;
      var callInterpret = function(instruction) {
        return toy.cycle.interpret(toy.cycle.parse(instruction))(map.pc,map.registers,map.ram);
      };
      beforeEach(function() {
        map = toy.util.create();
        map.pc(0x11);
      });
      it('halt', function() {
        expect(callInterpret(0)).toBe(false);
        expect(callInterpret(0x01c0)).toBe(false);
        expect(callInterpret(0x0fff)).toBe(false);
      });
      it('add', function() {
        map.registers(3,0x41);
        map.registers(4,1);
        expect(callInterpret(0x1234)).toBe(true);
        expect(map.registers(2)).toEqual(0x42);
        expect(map.registers(3)).toEqual(0x41);
        expect(map.registers(4)).toEqual(1);
      });
      it('subtract', function() {
        map.registers(3,0x43);
        map.registers(4,1);
        expect(callInterpret(0x2234)).toBe(true);
        expect(map.registers(2)).toEqual(0x42);
        expect(map.registers(3)).toEqual(0x43);
        expect(map.registers(4)).toEqual(0x01);
      });
      it('and', function() {
        map.registers(3,0xFF00);
        map.registers(4,0x0F00);
        expect(callInterpret(0x3234)).toBe(true);
        expect(map.registers(2)).toEqual(0x0f00);
        expect(map.registers(3)).toEqual(0xff00);
        expect(map.registers(4)).toEqual(0x0f00);
      });
      it('xor', function() {
        map.registers(3,0xFF0F);
        map.registers(4,0x0F00);
        expect(callInterpret(0x4234)).toBe(true);
        expect(map.registers(2)).toEqual(0xf00f);
        expect(map.registers(3)).toEqual(0xff0f);
        expect(map.registers(4)).toEqual(0x0f00);
      });
      it('left shift', function() {
        map.registers(3,0xFF0F);
        map.registers(4,4);
        expect(callInterpret(0x5234)).toBe(true);
        expect(map.registers(2)).toEqual(0xf0f0);
        expect(map.registers(3)).toEqual(0xff0f);
        expect(map.registers(4)).toEqual(4);
      });
      it('right shift', function() {
        map.registers(3,0xFF0F);
        map.registers(4,4);
        expect(callInterpret(0x6234)).toBe(true);
        expect(map.registers(2)).toEqual(0x0ff0);
        expect(map.registers(3)).toEqual(0xff0f);
        expect(map.registers(4)).toEqual(4);
      });
      it('load address', function() {
        expect(callInterpret(0x7334)).toBe(true);
        expect(map.registers(3)).toEqual(0x34);
      });
      it('load', function() {
        map.ram(0x34,0x42);
        expect(callInterpret(0x8334)).toBe(true);
        expect(map.registers(3)).toEqual(0x42);
      });
      it('store', function() {
        map.registers(3,0x42);
        expect(callInterpret(0x9334)).toBe(true);
        expect(map.ram(0x34)).toEqual(0x42);
      });
      it('load indirect', function() {
        map.ram(0x34,0x42);
        map.registers(4,0x34);
        expect(callInterpret(0xA304)).toBe(true);
        expect(map.registers(3)).toEqual(0x42);
      });
      it('store indirect', function() {
        map.registers(3,0x42);
        map.registers(4,0x34);
        expect(callInterpret(0xB304)).toBe(true);
        expect(map.ram(0x34)).toEqual(0x42);
      });
      it('branch zero (true)', function() {
        map.pc(0x11);
        map.registers(3,0);
        expect(callInterpret(0xC334)).toBe(true);
        expect(map.pc()).toEqual(0x34);
      });
      it('branch zero (false)', function() {
        map.pc(0x11);
        map.registers(3,1);
        expect(callInterpret(0xC334)).toBe(true);
        expect(map.pc()).toEqual(0x11);
      });
      it('branch positive (true)', function() {
        map.pc(0x11);
        map.registers(3,1);
        expect(callInterpret(0xD334)).toBe(true);
        expect(map.pc()).toEqual(0x34);
      });
      it('branch positive (false)', function() {
        map.pc(0x11);
        map.registers(3,0);
        expect(callInterpret(0xD334)).toBe(true);
        expect(map.pc()).toEqual(0x11);
      });
      it('jump register', function() {
        map.pc(0x11);
        map.registers(3,0x34);
        expect(callInterpret(0xE300)).toBe(true);
        expect(map.pc()).toEqual(0x34);
      });
      it('jump and link', function() {
        map.pc(0x11);
        map.registers(3,0x00);
        expect(callInterpret(0xF334)).toBe(true);
        expect(map.registers(3)).toEqual(0x11);
        expect(map.pc()).toEqual(0x34);
      });
    });
  });
});


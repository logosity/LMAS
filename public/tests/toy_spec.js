'use strict';

describe('TOY machine', function() {
  var _toy;
  beforeEach(function() {
    _toy = new Toy();
  });
  it('can parse an opcode', function() {
    expect(_toy.parseInstruction('1249')).toEqual(['1','2','49']);

  });
  describe('memory map',function() {
    it('can be dumped to bytes', function() {
      var bytes = _toy.dump();
      expect(bytes.length).toEqual(274);
      expect(bytes[0]).toEqual(1);
      expect(bytes[1]).toEqual(0x10);
      _.each(bytes.slice(2),function(b) {
        expect(b).toEqual(0);
      });
    });

    it('can load a byte dump', function() {
      var bytes = new Uint16Array(274);
      bytes[0] = 1;
      toy.util.setPcIn(bytes,0x20);
      toy.util.setRegisterIn(bytes, 1, 0x4f56);
      toy.util.setRamIn(bytes, 0x14, 0x1234);
      toy.util.setRamIn(bytes, 0xFF, 0xFF00);

      _toy.load(bytes);
      
      var dump = _toy.dump();
      expect(toy.util.getPcIn(dump)).toEqual(0x20);
      expect(toy.util.getRegisterIn(dump,1)).toEqual(0x4f56);
      expect(toy.util.getRamIn(dump,0x14)).toEqual(0x1234);
      expect(toy.util.getRamIn(dump,0xFF)).toEqual(0xff00);
    });
    it('can load a program', function() {
      var bytes = new Uint16Array(5);
      var code = Uint16Array.from([0x1234,0x45ff,0x3455]);
      bytes.set([0,0x20],0);
      bytes.set([0x1234,0x45ff,0x3455],2);

      _toy.load(bytes);

      var dump = _toy.dump();
      expect(toy.util.getPcIn(dump)).toEqual(0x20);
      expect(toy.util.getRamIn(dump,0x20)).toEqual(0x1234);
      expect(toy.util.getRamIn(dump,0x21)).toEqual(0x45ff);
      expect(toy.util.getRamIn(dump,0x22)).toEqual(0x3455);
    });
    it('will only load an array of type Uint16Array', function() {
      expect(function() {_toy.load("foobarbaz");}).toThrow({name:"invalid", message: "invalid binary format for loading"});
      expect(function() {_toy.load("foo\nbar\nbaz");}).toThrow({name:"invalid", message: "invalid binary format for loading"});
      expect(function() {_toy.load([1,2,3]);}).toThrow({name:"invalid", message: "invalid binary format for loading"});
      expect(function() {_toy.load(Uint8Array.from([1,2,3]));}).toThrow({name:"invalid", message: "invalid binary format for loading"});
    });
    describe('raising change events', function() {
      var handlers;
      beforeEach(function() {
        handlers = {
          memoryChange: function() {}
        };

        spyOn(handlers,'memoryChange');
        _toy = new Toy(handlers);
      });
      it('a memory event is trigged by load', function() {
        _toy.load(Uint16Array.from([0, 0x20,0x1234]));
        expect(handlers.memoryChange).toHaveBeenCalledWith(0x20,0x1234);
      });  
    });
  });
});

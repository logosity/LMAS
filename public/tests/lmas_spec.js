'use strict';

describe('LMAS', function() {
  beforeEach(function() {
    spyOn(lmas.animation,"stateChange");
  });

  it('initializes everything when page is ready', function() {
    spyOn(lmas,"initHandlers");

    lmas.onReady();
    expect(lmas.initHandlers).toHaveBeenCalled();
  });

  describe('table generation',function() {
    it('creates rows and columns', function() {
      var cells = util.partition([{},{},{},{}],2);
      var result = lmas.table.appendToElement($('<div>'),cells);
      expect($(result).find('tr').length).toBe(2);
      expect($(result).find('td').length).toBe(4);
    });
    it('makes header cells', function() {
      var cells = util.partition([{elem:'th'},{elem:'td'},{},{}],2);
      var result = lmas.table.appendToElement($('<div>'),cells);
      expect($(result).find('th').length).toBe(1);
      expect($(result).find('td').length).toBe(3);
    });
    it('sets the text field for each cell', function() {
      var cells = util.partition([{value:1},{value:2},{value:3},{value:4}],2);
      var result = lmas.table.appendToElement($('<div>'),cells);
      expect($(result).find('td').text()).toBe('1234');
    });
    it('sets the id of each cell', function() {
      var cells = util.partition([{id:'a'},{id:'b'},{id:'c'},{id:'d'}],2);
      var result = lmas.table.appendToElement($('<div>'),cells);
      expect(_.map($(result).find('td'), function(td) { return $(td).attr('id')})).toEqual(['a','b','c','d']);
    });
    it('sets the id of each cell', function() {
      var cells = util.partition([{id:'a'},{id:'b'},{id:'c'},{id:'d'},{}],2);
      var result = lmas.table.appendToElement($('<div>'),cells);
      expect(util.attrs($(result).find('td'), 'id')).toEqual(['a','b','c','d',undefined]);
    });
    it('sets the class of each cell', function() {
      var cells = util.partition([{klass:'a'},{klass:'a'},{klass:'b'},{klass:'c d'}, {}],2);
      var result = lmas.table.appendToElement($('<div>'),cells);
      expect($(result).find('td.a').length).toBe(2);
      expect($(result).find('td.b').length).toBe(1);
      expect($(result).find('td.c').length).toBe(1);
      expect($(result).find('td.d').length).toBe(1);
      expect($(result).find('td.c.d').length).toBe(1);
    });
    it('treats first partition as row headers', function() {
      var cells = util.partition([{},{},{},{}],2);
      var result = lmas.table.appendToElement($('<div>'),cells,[{value:'a'},{value:'b'}]);
      expect($(result).find('tr').length).toBe(2);
      expect($(result).find('tr:first').children().length).toBe(3);
      expect($(result).find('tr:first>th:first').text()).toEqual('a');
      expect($(result).find('tr:last').children().length).toBe(3);
      expect($(result).find('tr:last>th:first').text()).toEqual('b');
    });
  });

  describe('views', function() {
    it('subscribes to the hash change event', function() {
      lmas.initHandlers();
      spyOn(lmas,'showView');
      $(window).trigger('hashchange');
      expect(lmas.showView).toHaveBeenCalledWith(window.location.hash);
    });

    describe('TOY view', function() {
      it('passes the hash view parameter to the view function', function() {
        spyOn(lmas, 'machineView');
        lmas.showView('#machine-toy');
        expect(lmas.machineView).toHaveBeenCalledWith('toy',$('.view-container').empty());
      });
      it('template, editor & terminal added', function() {
        lmas.showView('#machine-toy');
        expect($('.view-container .machine-view').length).toEqual(1);
        expect($('.view-container .machine-view .text-editor .CodeMirror').length).toEqual(1);
        expect($('.view-container .machine-view .screen.terminal').length).toEqual(1);
      });
      describe('memory table',function() {
        beforeEach(function() {
          lmas.showView('#machine-toy');
        });
        it('generates a table of the proper dimensions', function() {
          expect($('.view-container .machine-view tbody').find('tr').length).toBe(16);
          expect($('.view-container .machine-view tbody').find('th').length).toBe(16);
          expect($('.view-container .machine-view tbody').find('td').length).toBe(256);
        });
        it('has row for registers and their labels', function() {
          expect($('.view-container .machine-view thead').find('th').length).toBe(17);
          expect($('.view-container .machine-view thead').find('th').hasClass("lead")).toBe(true);
          expect($('.view-container .machine-view thead').find('tr').length).toBe(2);
          expect($('.view-container .machine-view thead').find('td').length).toBe(17);

          var text = "PCR0R1R2R3R4R5R6R7R8R9RARBRCRDRERF";
          expect($('.view-container .machine-view thead').find('th').text()).toEqual(text);
        });
        it('row header contents are the memory location at the head of the row', function() {
          var text = "00102030405060708090A0B0C0D0E0F0"
          expect($('.view-container .mem-cells th').text()).toEqual(text);
        });
        it('row header elements are th', function() {
          expect($('.view-container .mem-cells th').length).toEqual(16);
          $('.view-container .mem-cells tr').each(function() {
            var rowHeader = $(this).find(':first-child');
            expect(rowHeader.get(0).tagName).toEqual("TH");
          });
        });
      });

      describe('machine state event handlers',function() {
        it('resets the last instruction', function() {
          lmas.events.toy.reset({pc:0x10});
          expect(lmas.lastOperation).toBe(undefined);
        });
        it('invokes all of the memory handlers', function() {
          var stubs = {
            fn1: function() {},
            fn2: function() {}
          };
          spyOn(stubs,"fn1");
          spyOn(stubs,"fn2");
          var fns = [stubs.fn1, stubs.fn2];
          spyOn(lmas.events.handlers,"onMemory").and.returnValue(fns);
          lmas.events.toy.memoryChange({});
          expect(stubs.fn1).toHaveBeenCalled();
          expect(stubs.fn2).toHaveBeenCalled();
        });
        it('updates a memory address', function() {
          lmas.showView('#machine-toy');
          lmas.events.toy.memoryChange({address:0xc0, value:0x1234});
          expect($('#MC0').text()).toEqual('1234');

          lmas.events.toy.memoryChange({address:0xc0, value: 0xcf24});
          expect($('#MC0').text()).toEqual('CF24');
        });
        it('invokes stdOut handler only on writes to FF', function() {
          lmas.showView('#machine-toy');
          spyOn(lmas.terminal,"flush");
          spyOn(lmas.terminal,"echo");
          lmas.events.toy.memoryChange({address:0x42, value: 0x2244});
          expect(lmas.terminal.flush).not.toHaveBeenCalled();
          expect(lmas.terminal.echo).not.toHaveBeenCalled();

          lmas.events.toy.memoryChange({address:0xFF, value: 0x6869});
          expect(lmas.terminal.echo).toHaveBeenCalledWith("h",{flush:false});
          expect(lmas.terminal.echo).toHaveBeenCalledWith("i",{flush:false});
          expect(lmas.terminal.flush).not.toHaveBeenCalled();
          lmas.events.toy.memoryChange({address:0xFF, value: 0x000});
          expect(lmas.terminal.flush).toHaveBeenCalled();
        });
        it('animates changes to pc', function() {
          lmas.events.toy.pcChange({pc:0x10});
          expect(lmas.animation.stateChange).toHaveBeenCalledWith('#PC',{bgcolor: '#08b9ee'});
        });
        it('animates memory location & pc after load', function() {
          lmas.events.toy.load({oldpc: 0x42, pc: 0x11});
          expect(lmas.animation.stateChange).toHaveBeenCalledWith('#PC',{bgcolor: '#08b9ee', queue:true,persist:true});
          expect(lmas.animation.stateChange).toHaveBeenCalledWith('#M42',{bgcolor: '#FFFFFF', queue:true,persist:true});
          expect(lmas.animation.stateChange).toHaveBeenCalledWith('#M11',{bgcolor: '#08b9ee', queue:true,persist:true});
        });
        it('animates memory location pointed to by pc at step-end', function() {
          lmas.events.toy.stepEnd({pc: 0x11});
          expect(lmas.animation.stateChange).toHaveBeenCalledWith('#M11',{bgcolor: '#08b9ee'});
        });
        it('stepStart clears the last instruction background color', function() {
          lmas.showView('#machine-toy');
          lmas.events.toy.stepStart({pc: 0x10, instruction: toy.cycle.parse(0x1234)});
          expect($('#M10').css('background-color')).toEqual('rgb(255, 255, 255)');
        });
        it('stepEnd sets the last instruction', function() {
            lmas.events.toy.stepEnd({pc: 0x11, instruction: toy.cycle.parse(0x1234)});
            expect(lmas.lastOperation).toEqual(1);
            lmas.events.toy.stepEnd({pc: 0x12, instruction: toy.cycle.parse(0x0000)});
            expect(lmas.lastOperation).toEqual(0);
        });
        describe('animating instructions', function() {
          it('stepEnd animates add and all other type1 instructions', function() {
            lmas.events.toy.stepEnd({pc: 0x11, instruction: toy.cycle.parse(0x1334)});
            expect(lmas.animation.stateChange).toHaveBeenCalledWith('#R3',{bgcolor: '#ff0000',color: '#ffc145'});
            expect(lmas.animation.stateChange).toHaveBeenCalledWith('#R4',{bgcolor: '#ffffff',color: '#ffc145'});
          });
          it('stepEnd animates load', function() {
            lmas.events.toy.stepEnd({pc: 0x11, instruction: toy.cycle.parse(0x8434)});
            expect(lmas.animation.stateChange).toHaveBeenCalledWith('#M34',{bgcolor: '#ffffff',color: '#ffc145'});
          });
          it('stepEnd animates store', function() {
            lmas.events.toy.stepEnd({pc: 0x11, instruction: toy.cycle.parse(0x9434)});
            expect(lmas.animation.stateChange).toHaveBeenCalledWith('#R4',{bgcolor: '#ffffff',color: '#ffc145'});
          });
          it('stepEnd animates load indirect', function() {
            var state = { pc: function(){}, registers: function() {}, ram: function() {} };
            spyOn(state,"registers").and.returnValue(0x34);
            lmas.events.toy.stepEnd({pc: 0x11, state: state, instruction: toy.cycle.parse(0xA403)});
            expect(state.registers).toHaveBeenCalledWith(3);
            expect(lmas.animation.stateChange).toHaveBeenCalledWith('#R3',{bgcolor: '#ffffff',color: '#ffc145'});
            expect(lmas.animation.stateChange).toHaveBeenCalledWith('#M34',{bgcolor: '#ffffff',color: '#ffc145'});
          });
          it('stepEnd animates store indirect', function() {
            lmas.events.toy.stepEnd({pc: 0x11, instruction: toy.cycle.parse(0xB403)});
            expect(lmas.animation.stateChange).toHaveBeenCalledWith('#R4',{bgcolor: '#ffffff',color: '#ffc145'});
            expect(lmas.animation.stateChange).toHaveBeenCalledWith('#R3',{bgcolor: '#ffffff',color: '#ffc145'});
          });
          it('stepEnd animates branch zero', function() {
            lmas.events.toy.stepEnd({pc: 0x11, instruction: toy.cycle.parse(0xC242)});
            expect(lmas.animation.stateChange).toHaveBeenCalledWith('#R2',{bgcolor: '#ffffff',color: '#ffc145'});
          });
          it('stepEnd animates branch zero', function() {
            lmas.events.toy.stepEnd({pc: 0x11, instruction: toy.cycle.parse(0xD242)});
            expect(lmas.animation.stateChange).toHaveBeenCalledWith('#R2',{bgcolor: '#ffffff',color: '#ffc145'});
          });
          it('stepEnd animates jump register', function() {
            lmas.events.toy.stepEnd({pc: 0x11, instruction: toy.cycle.parse(0xE200)});
            expect(lmas.animation.stateChange).toHaveBeenCalledWith('#R2',{bgcolor: '#ffffff',color: '#ffc145'});
          });
          it('stepEnd animates jump and link', function() {
            lmas.events.toy.stepEnd({pc: 0x11, instruction: toy.cycle.parse(0xF242)});
            expect(lmas.animation.stateChange).toHaveBeenCalledWith('#PC',{bgcolor: '#ffffff',color: '#ffc145'});
            expect(lmas.animation.stateChange).toHaveBeenCalledWith('#R2',{bgcolor: '#ffffff',color: '#ffc145'});
          });
        });
        it('animates changes to memory', function() {
          lmas.events.toy.memoryChange({address:0xc0, value: 0xcf24});
          expect(lmas.animation.stateChange).toHaveBeenCalledWith('#MC0');
        });
        it('animates changes to registers', function() {
          lmas.events.toy.registerChange({address:1,value: 0xcf24});
          expect(lmas.animation.stateChange).toHaveBeenCalledWith('#R1');
        });
      });
      describe('editor setup', function() {
        var editor;
        beforeEach(function() {
          editor = {
            getValue: function() {},
            setValue: function() {},
            undo: function() {},
            redo: function() {},
            refresh: function() {}
          };
          spyOn(lmas,'createEditor').and.returnValue(editor);
          spyOn(editor, 'setValue');
          spyOn(editor, 'undo');
          spyOn(editor, 'redo');
          spyOn(editor, 'refresh');

          lmas.showView('#machine-toy');
        });

        it('refreshes the editor', function() {
          lmas.showView('#machine-toy');
          expect(editor.refresh).toHaveBeenCalled();
        });
        xit('resets the machine', function() {
          spyOn(lmas.toy,"reset");
          lmas.showView('#machine-toy');
          expect(lmas.toy.reset).toHaveBeenCalled();
        });

        describe('event handlers', function() {
          it('calls undo on editor when button is clicked', function() {
            $('.editor-undo').trigger('click');
            expect(editor.undo).toHaveBeenCalled();
          });
          it('calls redo on editor when button is clicked', function() {
            $('.editor-redo').trigger('click');
            expect(editor.redo).toHaveBeenCalled();
          });
          it('loads the editor contents into machine memory', function() {
            spyOn(editor, 'getValue').and.returnValue(' @ 4111');
            $('.editor-load').trigger('click');
            expect($('.mem-cells').find('#M00').text()).toBe("4111");
          });
        });
      });
    });
  });
});


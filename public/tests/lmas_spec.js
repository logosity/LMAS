'use strict';

describe('LMAS', function() {
  beforeEach(function() {
    spyOn(lmas,"animateCell");
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
    it('shows the landing page view when there is no hash', function() {
      lmas.showView('');
      expect($('.view-container .landing-view').length).toEqual(1);
    });
    it('shows the landing page view after another view is selected', function() {
      lmas.showView('#machine-toy');
      lmas.showView('');
      expect($('.view-container .landing-view').length).toEqual(1);
    });
    it('changes the active tab when navigating to a view', function() {
      $('.machine-tab').removeClass("active");
      lmas.showView('');
      expect($('#home-tab').hasClass('active')).toBe(true);

      $('.machine-tab').removeClass("active");
      lmas.showView('#machine-toy');
      expect($('#toy-tab').hasClass('active')).toBe(true);

//      $('.machine-tab').removeClass("active");
//      lmas.showView('#machine-lmc');
//      expect($('#lmc-tab').hasClass('active')).toBe(true);
    });

    it('changes the view when tab is click', function() {
      lmas.initHandlers();
      $('#home-tab').trigger('click');
      expect($('.view-container .landing-view').length).toEqual(1);
      $('#toy-tab').trigger('click');
      expect($('.view-container .machine-view').length).toEqual(1);
    });

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

      it('retrieves the proper template and appends it to the document adding the live class to the element', function() {
        lmas.showView('#machine-toy');
        expect($('.view-container .machine-view').length).toEqual(1);
      });

      it('creates an editor and appends it to the document', function() {
        lmas.showView('#machine-toy');
        expect($('.view-container .machine-view .text-editor .CodeMirror').length).toEqual(1);
      });

      it('creates a terminal and appends it to the document', function() {
        lmas.showView('#machine-toy');
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
        it('updates a memory address', function() {
          lmas.showView('#machine-toy');
          lmas.events.toy.memoryChange(0xc0,0x1234);
          expect($('#MC0').text()).toEqual('1234');

          lmas.events.toy.memoryChange(0xc0,0xcf24);
          expect($('#MC0').text()).toEqual('CF24');
        });
        it('animates changes to memory', function() {
          lmas.events.toy.memoryChange(0xc0,0xcf24);
          expect(lmas.animateCell).toHaveBeenCalledWith('#MC0');
        });
        it('animates changes to registers', function() {
          lmas.events.toy.registerChange(1,0xcf24);
          expect(lmas.animateCell).toHaveBeenCalledWith('#R1');
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
            spyOn(editor, 'getValue').and.returnValue('4111');
            $('.editor-load').trigger('click');
            expect($('.mem-cells').find('#M10').text()).toBe("4111");
          });
        });
      });
    });
  });
});


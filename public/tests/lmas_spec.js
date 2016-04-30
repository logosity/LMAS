'use strict';

describe('LMAS', function() {
  it('shows the landing page view when there is no has', function() {
    lmas.showView('');
    expect($('.view-container .landing-view').length).toEqual(1);
  });

  it('passes the hash view parameter to the view function', function() {
    spyOn(lmas, 'machineView');
    lmas.showView('#machine-lmc');
    expect(lmas.machineView).toHaveBeenCalledWith('lmc');
  });

  it('subscribes to the hash change event', function() {
    lmas.initHandlers();
    spyOn(lmas,'showView');
    $(window).trigger('hashchange');
    expect(lmas.showView).toHaveBeenCalledWith(window.location.hash);
  });

  it('changes the active tab when clicked', function() {
    lmas.initHandlers();
    $('.machine-tab').removeClass("active");
    $('#machine-toy').trigger('click');
    expect($('#machine-toy').hasClass('active')).toBe(true);
    $('#machine-lmc').trigger('click');
    expect($('#machine-lmc').hasClass('active')).toBe(true);
    expect($('#machine-toy').hasClass('active')).toBe(false);
  });

  describe('editor panel', function() {
    var editor;
    beforeEach(function() {
      editor = {
        setValue: function() {},
        getValue: function() {},
        undo: function() {},
        redo: function() {},

      };
      spyOn(editor, "setValue");
      spyOn(editor, "getValue").and.returnValue("1234");
      spyOn(editor, "undo");
      spyOn(editor, "redo");
    });
    it('loads code from local storage into the editor when starting', function() {
      spyOn(localStorage,'getItem').and.returnValue("1234");
      lmas.initEditor(editor);
      expect(localStorage.getItem).toHaveBeenCalledWith("code");
      expect(lmas.editor.setValue).toHaveBeenCalledWith("1234");
    });
    it('saves editor to local storage before the page unloads', function() {
      lmas.initHandlers();
      spyOn(localStorage,'setItem');
      lmas.initEditor(editor);
      $(window).trigger('beforeunload');
      expect(localStorage.setItem).toHaveBeenCalledWith("code","1234");
    });
    it('calls undo on editor when button is clicked', function() {
      lmas.initHandlers();
      lmas.initEditor(editor);
      $('.editor-undo').trigger('click');
      expect(lmas.editor.undo).toHaveBeenCalled();
    });
    it('calls redo on editor when button is clicked', function() {
      lmas.initHandlers();
      lmas.initEditor(editor);
      $('.editor-redo').trigger('click');
      expect(lmas.editor.redo).toHaveBeenCalled();
    });
    it('loads the editor contents into machine memory', function() {
      lmas.onReady();
      lmas.initEditor(editor);
      var cell = $('<tr>').append($('<td>').attr('id','M10').text("0000"));
      $('#mem-cells').append(cell);
      $('.editor-load').trigger('click');
      expect($('#mem-cells').find('#M10').text()).toBe("1234");
    });
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
    describe('toy memory table',function() {
      it('generates a table of the proper dimensions', function() {
        var elem = $('<tbody>');
        lmas.appendToyMemory(elem);
        expect($(elem).find('tr').length).toBe(16);
        expect($(elem).find('th').length).toBe(16);
        expect($(elem).find('td').length).toBe(256);
      });

      it('has a row for registers', function() {
        var elem = $('<thead>');
        lmas.appendToyRegisters(elem);
        expect($(elem).find('tr').length).toBe(1);
        expect($(elem).find('td').length).toBe(17);
      });
      it('has a row for register labels', function() {
        var elem = $('<thead>');
        lmas.appendToyRegisterLabels(elem);
        expect($(elem).find('tr').length).toBe(1);
        expect($(elem).find('th').length).toBe(17);
        expect($(elem).find('th').hasClass("lead")).toBe(true);

        var text = "PCR0R1R2R3R4R5R6R7R8R9RARBRCRDRERF";
        expect($(elem).find('th').text()).toEqual(text);
      });
    });
  });

});


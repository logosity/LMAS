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

});


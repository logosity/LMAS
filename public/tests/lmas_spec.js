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

  describe('editor panel', function() {
    it('saves editor to local storage before the page unloads', function() {
      lmas.initEditor();
      lmas.initHandlers();
      spyOn(localStorage,'setItem');
      spyOn(lmas.editor,'getValue').and.returnValue("1234");
      $(window).trigger('beforeunload');
      expect(localStorage.setItem).toHaveBeenCalledWith("code","1234");
    });
    it('calls undo on editor when button is clicked', function() {
      lmas.initEditor();
      lmas.initHandlers();
      spyOn(lmas.editor,'undo');
      $('.editor-undo').trigger('click');
      expect(lmas.editor.undo).toHaveBeenCalled();
    });
    it('calls redo on editor when button is clicked', function() {
      lmas.initEditor();
      lmas.initHandlers();
      spyOn(lmas.editor,'redo');
      $('.editor-redo').trigger('click');
      expect(lmas.editor.redo).toHaveBeenCalled();
    });
  });

});


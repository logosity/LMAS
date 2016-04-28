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
    lmas.onReady();
    spyOn(lmas,'showView');
    $(window).trigger('hashchange');
    expect(lmas.showView).toHaveBeenCalledWith(window.location.hash);
  });
});


var fixture;

function loadFixture(path) {
  var html;
  jQuery.ajax({
    url: '/index.html',
    success: function(result) {
      html = result;
    },
    async: false
  });
  return $.parseHTML(html);
}

function resetFixture() {
  if (!fixture) {
    var index = $('<div>').append(loadFixture('/index.html'));
    var markup = index.find('div.jasmine-fixture-hook');
    fixture = $('<div class="fixture" style="display: none">').append(markup);
    $('body').append(fixture.clone());
  } else {
    $('.fixture').replaceWith(fixture.clone());
  }
}

//var lmastest = {};
//lmastest.startTime = 0;
//lmastest.lastSpec = null;
//
//lmastest.execute = jasmine.Spec.prototype.execute;
//jasmine.Spec.prototype.execute = function (...args) {
//  lmastest.lastSpec = this.result
//  lmastest.execute.apply(this, args)
//};

beforeEach(function() {
  resetFixture();
//  lmastest.startTime = Date.now();
});

afterEach(function() {
//  console.log((Date.now() - lmastest.startTime) + " - " + lmastest.lastSpec.description);

});

'use strict';

var lmas = {};

lmas.landingView = function(unused, targetElement) {
  $('#home-tab').addClass('active');   
  targetElement.append($('.templates .landing-view').clone());
};

lmas.machineView = function(machineType, targetElement) {
  $('#' + machineType + '-tab').addClass('active');   
  var view = $('.templates .machine-view').clone();
  var editor = lmas.createEditor(view.find('.text-editor'));

  lmas.initViewHandlers(machineType,view,editor);

  lmas.restoreEditor(machineType,editor);

  lmas.appendToyRegisterLabels($(view).find('.mem-header'));
  lmas.appendToyRegisters($(view).find('.mem-header'));
  lmas.appendToyMemory($(view).find('.mem-cells'));
  targetElement.append(view);
  editor.refresh();
};

lmas.showView = function(hash) {
  var routes = {
    '' : lmas.landingView,
    '#machine': lmas.machineView
  };

  var hashParts = hash.split("-");

  var viewFn = routes[hashParts[0]];
  if (viewFn) {
    $('.machine-tab').removeClass('active');   
    viewFn(hashParts[1], $('.view-container').empty());
  }

  var tab = $(this).attr('id');
};

lmas.table = {};
lmas.table.appendToElement = function(elem, rows, rowHeaders) {
  var createElement = function(cell) {
    var elemType = cell.elem ? cell.elem : 'td';
    var elem = $('<' + elemType + '>');
    return elem.attr('id',cell.id).addClass(cell.klass).text(cell.value);
  };
  var createHeaderElement = function(cell) {
    if(cell.elem === undefined) cell.elem = 'th';
    return createElement(cell);
  };

  _.each(rows, function(row,idx) {
    var tr = $('<tr>');
    if(rowHeaders) tr.append(createHeaderElement(rowHeaders[idx]));
    _.each(row,function(cell) {
      tr.append(createElement(cell));
    });
    elem.append(tr);
  });
  return elem;
};

lmas.appendToyMemory = function(elem) {
  var rowHeaders = _.map(_.range(16),function(i) {
    return {value: sprintf("%02X",i * 16), elem:'th'};
  });
  var cells = _.map(toy.coreDump().ram,function(val,idx) {
    return {id: sprintf("M%02X",idx), value: sprintf('%04X',val)};
  });
  
  lmas.table.appendToElement(elem,util.partition(cells,16),rowHeaders); 
};


lmas.appendToyRegisters = function(elem) {
  var dump = toy.coreDump();
  var pc = {id: "PC", value: sprintf('%02X',dump.pc)};
  var rest = _.map(dump.registers, function(val,idx) {
    return {id: "R" + sprintf('%X',idx), value: sprintf('%04X',val)};
  });

  var cells = util.partition([pc].concat(rest),17);
  lmas.table.appendToElement(elem, cells);
};

lmas.appendToyRegisterLabels = function(elem) {
  var pc = [{value:"PC", klass: "lead", elem: 'th'}];
  var cells = _.map(_.range(16), function(i) {
    return {value: "R" + sprintf('%X',i), klass: "lead", elem: 'th' }; 
  });
  lmas.table.appendToElement(elem,util.partition(pc.concat(cells),17));
}

lmas.initHandlers = function() {
  $(".machine-tab").click(function(){
    var tab = $(this).attr('id');
    if(tab === 'home-tab') {
      lmas.showView('');
    } else {
      var tabParts = tab.split("-");
      lmas.showView('#machine-' + tabParts[0]);
    }
  });

  $(window).on("hashchange",function() { 
    lmas.showView(window.location.hash);
  });
  lmas.showView(window.location.hash);
};

lmas.initViewHandlers = function(storageKey, elem, editor) {
  elem.find('.editor-undo').click(function(){
    editor.undo();
  });

  elem.find('.editor-redo').click(function(){
    editor.redo();
  });

  elem.find('.editor-load').click(function(){
    var memory = toy.load(elem.find('.mem-cells'), editor.getValue());
    elem.find('.mem-cells').replaceWith(memory);
  });

  $(window).on('beforeunload', function() {
    localStorage.setItem(storageKey + '-code', editor.getValue());
  });
};

lmas.createEditor = function(elem) {
  return CodeMirror(elem[0], {
    theme:'cobalt',
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true
  });
};

lmas.initTerminal = function() {
  lmas.terminal = $('.screen').terminal(function(command, term) {
    }, {
      greetings: 'TOY Interface console',
      name: 'toy_console',
      height: 200,
      prompt: '$ '
  });
};

lmas.restoreEditor = function(storageKey, editor) {
  var viewState = localStorage.getItem(storageKey + "-code");
  editor.setValue(viewState);
};

lmas.onReady = function() {
  lmas.initTerminal();
  lmas.initHandlers();
};

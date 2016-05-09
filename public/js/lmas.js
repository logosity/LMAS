'use strict';

var lmas = {};

lmas.animateCell = function(id) {
  var elem = $(id);
  elem.css("background-color",'#ff0000');
  elem.animate({ backgroundColor: "#ffffff"},{
    duration: 2000,
    easing: "swing",
  });
}

lmas.events = {
  toy: { 
    memoryChange: function(value,address) {
      var id = '#M' + sprintf('%02X',address);
      lmas.animateCell(id);
      $(id).text(sprintf('%04X',value));
    },
    registerChange: function(value,address) {
      var id = '#R' + sprintf('%X',address);
      lmas.animateCell(id);
      $(id).text(sprintf('%04X',value));
    },
    pcChange: function(value) {
      $('#PC').text(sprintf('%02X',value));
    }
  }
};

lmas.landingView = function(unused, targetElement) {
  $('#home-tab').addClass('active');   
  targetElement.append($('.templates .landing-view').clone());
};

lmas.machineView = function(machineType, targetElement) {
  lmas.toy = toy.create(lmas.events.toy);
  $('#' + machineType + '-tab').addClass('active');   
  var view = $('.templates .machine-view').clone();
  lmas.editor = lmas.createEditor(view.find('.text-editor'));
  lmas.terminal = lmas.initTerminal(machineType, view.find('.screen'));
  
  lmas.initViewHandlers(machineType,view,lmas.editor);

  lmas.appendToyRegisterLabels($(view).find('.mem-header'));
  lmas.appendToyRegisters($(view).find('.mem-header'));
  lmas.appendToyMemory($(view).find('.mem-cells'));
  targetElement.append(view);
  lmas.editor.refresh();
  lmas.toy.reset();
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
  var cells = _.map(lmas.toy.dump().ram(),function(val,idx) {
    return {id: sprintf("M%02X",idx)};
  });
  
  lmas.table.appendToElement(elem,util.partition(cells,16),rowHeaders); 
};


lmas.appendToyRegisters = function(elem) {
  var registers = _.map(lmas.toy.dump().registers(), function(val,idx) {
    return {id: "R" + sprintf('%X',idx)};
  });

  var cells = util.partition([{id: "PC"}].concat(registers),17);
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
    lmas.toy.load(toyAsm.assemble(editor.getValue()));
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

lmas.initTerminal = function(machineType, elem) {
  return elem.terminal(function(command, term) {
    if(command === 'run') {
      lmas.toy.run();
    } else if(command === 'reset') {
      lmas.toy.reset();
    } else if(command === 'load') {
      lmas.toy.load(toyAsm.assemble(lmas.editor.getValue()));
    } else {
      term.echo('unknown command');
    }
  }, {
      greetings: machineType.toUpperCase() + ' Interface console\n',
      name: 'console',
      height: 200,
      prompt: machineType +'$ '
  });
};

lmas.onReady = function() {
  lmas.initHandlers();
};

'use strict';

var lmas = {};

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
  var cells = util.partition(toy.memoryMap(),16);
  lmas.table.appendToElement(elem,cells,toy.rowHeaders()); 
};

lmas.appendToyRegisters = function(elem) {
  var cells = util.partition(toy.registers(),17);
  lmas.table.appendToElement(elem,cells);
}
lmas.appendToyRegisterLabels = function(elem) {
  var cells = _.map(toy.registers(), function(r) {
    return {value: r.id, klass: "lead", elem: 'th' }; 
  });
  lmas.table.appendToElement(elem,util.partition(cells,17));
}

lmas.colors=["black","silver","gray","white","maroon","red","purple","fuchsia","green","lime","olive","yellow","navy","blue","teal","aqua"];

lmas.machineView = function(machineType) {
  return $('<div class="machine-view">');
};

lmas.showView = function(hash) {
  var routes = {
    '#machine': lmas.machineView
  };

  var hashParts = hash.split("-");

  var viewFn = routes[hashParts[0]];
  if (viewFn) {
    $('.view-container').empty().append(viewFn(hashParts[1]));
  }
};

lmas.parseInstruction = function(code) {
  var matches = code.match(/^([0-9,A-F])([0-9,A-F])([0-9,A-F]{2})$/);
}

lmas.initHandlers = function() {
  $(".machine-tab").click(function(){
    $('.machine-tab').removeClass('active');   
    $(this).addClass('active');   
  });

  $(".editor-undo").click(function(){
    lmas.editor.undo();
  });

  $(".editor-redo").click(function(){
    lmas.editor.redo();
  });

  $(".editor-load").click(function(){
    var memory = toy.load($('#mem-cells'),lmas.editor.getValue());
    $('#mem-cells').replaceWith(memory);
  });

  $(window).on('beforeunload', function() {
    localStorage.setItem("code",lmas.editor.getValue());
  });

  $(window).on("hashchange",function() { 
    lmas.showView(window.location.hash);
  });
  lmas.showView(window.location.hash);
};

lmas.initEditor = function(editor) {
  lmas.editor = editor;
  var code = localStorage.getItem('code');
  if(code !== null) {
    lmas.editor.setValue(code);
  }
};

lmas.onReady = function() {
  var editor = CodeMirror($('#text-editor')[0], {
    theme:'cobalt',
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true
  });

  lmas.terminal = $('#screen').terminal(function(command, term) {
    }, {
      greetings: 'TOY Interface console',
      name: 'toy_console',
      height: 200,
      prompt: '$ '
  });

  lmas.initEditor(editor);
  lmas.initHandlers();
  lmas.appendToyRegisterLabels($('#mem-header'));
  lmas.appendToyRegisters($('#mem-header'));
  lmas.appendToyMemory($('#mem-cells'));
};

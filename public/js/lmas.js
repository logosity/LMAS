'use strict';

var lmas = {};
lmas.partition = function(items, size) {
    //via: http://stackoverflow.com/a/11345570
    var result = _.groupBy(items, function(item, i) {
        return Math.floor(i/size);
    });
    return _.values(result);
}

lmas.addToElement = function(elem, rows, rowHeaders) {
  var createElement = function(cell) {
    var elemType = cell.elem ? cell.elem : 'td';
    var elem = $('<' + elemType + '>');
    return elem.attr('id',cell.id).addClass(cell.klass).text(cell.text);
  };
  var createHeaderElement = function(cell) {
    if(cell.elem === undefined) cell.elem = 'th';
    return createElement(cell);
  };

  var result = elem.clone();
  _.each(rows, function(row,idx) {
    var tr = $('<tr>');
    if(rowHeaders) tr.append(createHeaderElement(rowHeaders[idx]));
    _.each(row,function(cell) {
      tr.append(createElement(cell));
    });
    result.append(tr);
  });
  return result;
};
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

lmas.packPixel = function(color, bgcolor, ascii) {
  return (color << 12) | (bgcolor << 8) | ascii;
}

lmas.setPixel = function(coords, val) {
  var ascii = String.fromCharCode(0xFF & val);
  var bgcolor = (0xF00 & val) >> 8;
  var color = (0xF000 & val) >> 12;
  $('#' + 'V' + coords).text(ascii).css("background-color",lmas.colors[bgcolor]).css("color",lmas.colors[color]); 
}

lmas.parseInstruction = function(code) {
  var matches = code.match(/^([0-9,A-F])([0-9,A-F])([0-9,A-F]{2})$/);
}

lmas.genColumns = function(length, idPrefix, classes) {
  return _.map(_.range(length), function(columnNumber) {
    return $('<td>').addClass(classes).attr("id", idPrefix + sprintf('%X',columnNumber));
  });
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
    var memory = lmas.toy.load($('#mem-cells'),lmas.editor.getValue());
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
  lmas.toy = new Toy();

  lmas.initHandlers();
};

function onReady() {
  var editor = CodeMirror($('#text-editor')[0], {
    theme:'cobalt',
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true
  });

  lmas.initEditor(editor);
  var screenLabels = $('<tr>').append($('<th>'));
  _.each(_.range(16), function(columnNumber) {
    screenLabels.append($('<th>').addClass('lead').text(sprintf('%X',columnNumber)));
  });
  $('#screen-header').append(screenLabels);

  _.each(_.range(8), function(rowNumber) {
    var row = $('<tr>').append($('<th>').text(sprintf('%X',rowNumber)));
    _.each(lmas.genColumns(16,"V" + sprintf('%X',rowNumber), "pixel"), function(col) {
      row.append(col.text(" "));
    });
    $('#screen-body').append(row);
  });

  var registerLabels = $('<tr>').append($('<th>').addClass('lead').text('PC'));
  var registerValues = $('<tr>').append($('<td>').text('00'));
  _.each(_.range(16), function(columnNumber) {
    registerLabels.append($('<th>').addClass('lead').text(sprintf('R%X',columnNumber)));
    registerValues.append($('<td>').text('0000'));
  });
  $('#mem-header').append(registerLabels).append(registerValues);

  _.each(_.range(16), function(rowNumber) {
    var row = $('<tr>').append($('<th>').text(sprintf('%02X',rowNumber * 16)));
    _.each(lmas.genColumns(16,"M" + sprintf('%X',rowNumber)), function(col) {
      row.append(col.text("0000"));
    });
    $('#mem-cells').append(row);
  });

  lmas.setPixel("44", lmas.packPixel(3,0,72));
  lmas.setPixel("45", lmas.packPixel(3,0,101));
  lmas.setPixel("46", lmas.packPixel(3,0,108));
  lmas.setPixel("47", lmas.packPixel(3,0,108));
  lmas.setPixel("48", lmas.packPixel(3,0,111));


  lmas.onReady();
}



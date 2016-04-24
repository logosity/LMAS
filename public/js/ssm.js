colors=["black","silver","gray","white","maroon","red","purple","fuchsia","green","lime","olive","yellow","navy","blue","teal","aqua"];
function packPixel(color, bgcolor, ascii) {
  return (color << 12) | (bgcolor << 8) | ascii;
}

function setPixel(coords, val) {
  var ascii = String.fromCharCode(0xFF & val);
  var bgcolor = (0xF00 & val) >> 8;
  var color = (0xF000 & val) >> 12;
  $('#' + 'V' + coords).text(ascii).css("background-color",colors[bgcolor]).css("color",colors[color]); 
}

function genRow(id) {
  return $('<div>').addClass('data-row').attr('id', id);
}
function genColumns(length, idPrefix, classes) {
  return _.map(_.range(length), function(columnNumber) {
    var columnId = columnNumber.toString(16).toLocaleUpperCase();
    return $('<div>').addClass(classes).attr("id", idPrefix + columnId);
  });
}

function onReady() {
  var screenLabels = genRow("screen-H");
  screenLabels.append($("<div>").addClass("screen-label").text('*'));
  _.each(_.range(16), function(num) { 
    screenLabels.append($("<div>").addClass("screen-label").text(sprintf("%X",num))); 
  });

  $('#screen').append(screenLabels);
  _.each(_.range(16), function(rowNumber) {
    var rowId = rowNumber.toString(16).toLocaleUpperCase();
    var row = genRow("V" + rowId);
    row.append($("<div>").addClass("screen-label").text(sprintf("%X",rowNumber)));
    _.each(genColumns(16,"V" + rowId, "pixel"), function(col) {
      row.append(col);
    });
    $('#screen').append(row);
  });

  _.each(_.range(16), function(rowNumber) {
    var rowId = rowNumber.toString(16).toLocaleUpperCase();
    var row = genRow("M" + rowId);
    row.append("<div>").addClass("memlabel").text(sprintf("%02X",rowNumber * 16) + ": ");
    _.each(genColumns(16,"M" + rowId, "memcell"), function(col) {
      row.append(col.text("0000"));
    });
    $('#memory').append(row);
  });

  $('#register-labels').append($("<div>").addClass("pc-label").text("PC"));
  $('#registers').append($("<div>").attr("id","pc").text("00"));
  _.each(_.range(16), function(colNumber) {
    $('#register-labels').append($("<div>").addClass("register-label").text(sprintf("R%X",colNumber)));
    $('#registers').append($("<div>").addClass("memcell").attr("id",sprintf("R%X",colNumber)).text("0000"));
  });

  setPixel("C4", packPixel(3,0,72));
  setPixel("C5", packPixel(3,0,101));
  setPixel("C6", packPixel(3,0,108));
  setPixel("C7", packPixel(3,0,108));
  setPixel("C8", packPixel(3,0,111));

  var editor = CodeMirror.fromTextArea($('#editor-text')[0], {
    theme:'cobalt',
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true
  });
}



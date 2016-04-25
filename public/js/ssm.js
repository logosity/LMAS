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

function parseInstruction(code) {
  var matches = code.match(/^([0-9,A-F])([0-9,A-F])([0-9,A-F]{2})$/);
}

function genRow(id) {
  return $('<div>').addClass('row').addClass('data-row').attr('id', id);
}
function genColumns(length, idPrefix, classes) {
  return _.map(_.range(length), function(columnNumber) {
    return $('<td>').addClass(classes).attr("id", idPrefix + sprintf('%X',columnNumber));
  });
}

function onReady() {
  //var screenLabels = genRow("screen-H");
  //screenLabels.append($("<div>").addClass("screen-label").text('*'));
  //_.each(_.range(16), function(num) { 
  //  screenLabels.append($("<div>").addClass("screen-label").text(sprintf("%X",num))); 
  //});

  //$('#screen').append(screenLabels);
  //_.each(_.range(16), function(rowNumber) {
  //  var rowId = rowNumber.toString(16).toLocaleUpperCase();
  //  var row = genRow("V" + rowId);
  //  row.append($("<div>").addClass("screen-label").text(sprintf("%X",rowNumber)));
  //  _.each(genColumns(16,"V" + rowId, "pixel"), function(col) {
  //    row.append(col);
  //  });
  //  $('#screen').append(row);
  //});

  var registerLabels = $('<tr>').append($('<th>').addClass('lead').text('PC'));
  var registerValues = $('<tr>').append($('<td>').text('00'));
  _.each(_.range(16), function(columnNumber) {
    registerLabels.append($('<th>').addClass('lead').text(sprintf('R%X',columnNumber)));
    registerValues.append($('<td>').text('0000'));
  });
  $('#memheader').append(registerLabels).append(registerValues);

  _.each(_.range(16), function(rowNumber) {
    var rowId = sprintf('%02X',rowNumber * 16);
    var row = $('<tr>').append($('<th>').text(rowId));
    _.each(genColumns(16,"M" + rowId, "memcell"), function(col) {
      row.append(col.text("0000"));
    });
    $('#membody').append(row);
  });

  setPixel("C4", packPixel(3,0,72));
  setPixel("C5", packPixel(3,0,101));
  setPixel("C6", packPixel(3,0,108));
  setPixel("C7", packPixel(3,0,108));
  setPixel("C8", packPixel(3,0,111));

  var editor = CodeMirror.fromTextArea($('#text-editor')[0], {
    theme:'cobalt',
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true
  });
}



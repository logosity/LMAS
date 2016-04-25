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

function genColumns(length, idPrefix, classes) {
  return _.map(_.range(length), function(columnNumber) {
    return $('<td>').addClass(classes).attr("id", idPrefix + sprintf('%X',columnNumber));
  });
}

function onReady() {
  var screenLabels = $('<tr>').append($('<th>'));
  _.each(_.range(16), function(columnNumber) {
    screenLabels.append($('<th>').addClass('lead').text(sprintf('%X',columnNumber)));
  });
  $('#screen-header').append(screenLabels);

  _.each(_.range(8), function(rowNumber) {
    var row = $('<tr>').append($('<th>').text(sprintf('%X',rowNumber)));
    _.each(genColumns(16,"V" + sprintf('%X',rowNumber), "pixel"), function(col) {
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
    var rowId = sprintf('%02X',rowNumber * 16);
    var row = $('<tr>').append($('<th>').text(rowId));
    _.each(genColumns(16,"M" + rowId), function(col) {
      row.append(col.text("0000"));
    });
    $('#mem-body').append(row);
  });

  setPixel("44", packPixel(3,0,72));
  setPixel("45", packPixel(3,0,101));
  setPixel("46", packPixel(3,0,108));
  setPixel("47", packPixel(3,0,108));
  setPixel("48", packPixel(3,0,111));

  var editor = CodeMirror.fromTextArea($('#text-editor')[0], {
    theme:'cobalt',
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true
  });
  $(".dropdown-menu li a").click(function(){
    var selText = $(this).text();
    $(this).parents('.btn-group').find('.dropdown-toggle').html(selText+' <span class="caret"></span>');
  });
}



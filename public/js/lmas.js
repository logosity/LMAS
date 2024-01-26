'use strict';

var lmas = {};

lmas.animation = {};
lmas.animation.duration = 2000;
lmas.animation.stateChange = function(id,settings) {
  var config = _.extend({
    bgcolor: '#ff0000',
    color:'#000000',
    duration: lmas.animation.duration,
    queue: false,
    persist: false
  },settings);
  var elem = $(id);
  elem.css("background-color",config.bgcolor);
  elem.css("color",config.color);
  elem.animate({ backgroundColor: "#ffffff",color: "#000000"},{
    duration: config.duration,
    easing: "swing",
    queue: config.queue,
    complete: function() {
      if(config.persist) {
        elem.css("background-color",config.bgcolor);
        elem.css("color",config.color);
      }
    }
  });
}
lmas.ui = {};
lmas.ui.regId = function(register) {
  return '#R' + sprintf('%X',register);
};
lmas.ui.memId = function(address) {
  return '#M' + sprintf('%02X', address);
};
lmas.ui.hex8 = function(value) {
  return sprintf('%02X',value);
};
lmas.ui.hex16 = function(value) {
  return sprintf('%04X',value);
};
lmas.events = {
  handlers: {
    stdOut: function(eventData) {
      var sendToTerminal = function(chr) {
        if(chr === 0) {
          lmas.terminal.flush();
        } else {
          lmas.terminal.echo(String.fromCharCode(chr),{flush:false});
        }
      };
      if(!_.isUndefined(lmas.terminal)) {
        sendToTerminal(eventData.value >> 8);
        sendToTerminal(eventData.value & 0x00FF);
      }
    },
    onMemory: function() {
      return [
        function(eventData) {
          var id = lmas.ui.memId(eventData.address);
          lmas.animation.stateChange(id);
          $(id).text(lmas.ui.hex16(eventData.value));
        },
        function(eventData) {
          if(eventData.address === 0xFF) {
            lmas.events.handlers.stdOut(eventData);
          }
        }
      ];
    }
  },
  toy: {
    memoryChange: function(eventData) {
      _.each(lmas.events.handlers.onMemory(),function(fn) {
        fn(eventData);
      });
    },
    registerChange: function(eventData) {
      var id = lmas.ui.regId(eventData.address);
      lmas.animation.stateChange(id);
      $(id).text(lmas.ui.hex16(eventData.value));
    },
    pcChange: function(eventData) {
      lmas.animation.stateChange('#PC',{bgcolor:'#08b9ee'});
      $('#PC').text(lmas.ui.hex8(eventData.pc));
    },
    load: function(eventData) {
      lmas.animation.stateChange('#PC',{bgcolor:'#08b9ee',queue:true,persist:true});
      lmas.animation.stateChange(lmas.ui.memId(eventData.oldpc),{bgcolor:'#FFFFFF',queue:true,persist:true});
      lmas.animation.stateChange(lmas.ui.memId(eventData.pc),{bgcolor:'#08b9ee',queue:true,persist:true});
    },
    stepStart: function(eventData) {
      $(lmas.ui.memId(eventData.pc)).css('background-color','#FFFFFF');
      lmas.animation.stateChange({bgcolor:'#08b9ee',queue:true,persist:true});
    },
    stepEnd: function(eventData) {
      var config = {bgcolor: "#ffffff", color:'#ffc145'};
      var type1 = function(settings) {
        var sConfig = _.clone(config);
        var tConfig = _.clone(config);

        if(settings.d === settings.s) sConfig.bgcolor = "#ff0000";
        if(settings.d === settings.t) tConfig.bgcolor = "#ff0000";

        lmas.animation.stateChange(lmas.ui.regId(settings.s), sConfig);
        lmas.animation.stateChange(lmas.ui.regId(settings.t), tConfig);
      };
      var branch = function(settings) {
        lmas.animation.stateChange(lmas.ui.regId(settings.d), config);
      };

      var animations = {
        0x1: type1,
        0x2: type1,
        0x3: type1,
        0x4: type1,
        0x5: type1,
        0x6: type1,
        0x7: undefined, //no animation
        0x8: function(settings) { lmas.animation.stateChange(lmas.ui.memId(settings.addr), config); },
        0x9: function(settings) { lmas.animation.stateChange(lmas.ui.regId(settings.d), config); },
        0xA: function(settings) {
          lmas.animation.stateChange(lmas.ui.regId(settings.t), config);
          lmas.animation.stateChange(lmas.ui.memId(eventData.state.registers(settings.t)), config);
        },
        0xB: function(settings) {
          lmas.animation.stateChange(lmas.ui.regId(settings.d), config);
          lmas.animation.stateChange(lmas.ui.regId(settings.t), config);
        },
        0xC: branch,
        0xD: branch,
        0xE: branch,
        0xF: function(settings) {
          lmas.animation.stateChange('#PC', config);
          lmas.animation.stateChange(lmas.ui.regId(settings.d), config);
        },
      };
      var id = lmas.ui.memId(eventData.pc);
      lmas.animation.stateChange(id,{bgcolor:'#08b9ee'});
      if(eventData.instruction) {
        var inst = eventData.instruction;
        lmas.lastOperation = inst.opcode;
        if(animations[inst.opcode]) animations[inst.opcode](inst);
      }
    },
    reset: function(eventData) {
      lmas.lastOperation = undefined;
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
  lmas.machineView('toy', $('.view-container').empty());
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
    lmas.toy.load(lasm.assemble(editor.getValue()));
  });
};

lmas.createEditor = function(elem) {
  return CodeMirror(elem[0], {
    theme:'cobalt',
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true,
    lineWrapping: true,
    extraKeys: {
      "Shift-Ctrl-F": function(cm) {
        cm.setOption("fullScreen", !cm.getOption("fullScreen"));
      },
    }
  });
};

lmas.initTerminal = function(machineType, elem) {
  return elem.terminal({
    run: function() {
      lmas.toy.run();
      lmas.toy.load(lmas.toy.dump());
    },
    halt: function() { window.clearInterval(lmas.activeInterval); },
    step: function() { lmas.toy.step(); },
    set: function(duration) {
      lmas.animation.duration = duration; },
    jog: function() {
      var term = this;
      lmas.activeInterval = setInterval(function() {
        if(lmas.lastOperation === 0) {
          term.exec("halt",true);
        } else {
          term.exec("step",true)
        }
      },lmas.animation.duration);

    },
    reset: lmas.toy.reset,
    load: function() { lmas.toy.load(lasm.assemble(lmas.editor.getValue())); }
  }, {
    greetings: machineType.toUpperCase() + ' Interface console\n',
    name: 'console',
    height: 200,
    prompt: machineType +'$ ',
    keydown: function(keyEvent, term) {
      if(keyEvent.ctrlKey) {
        switch(keyEvent.keyCode) {
          case 67: //CTRL+C
            term.exec("reset");
            return false;
          case 76: //CTRL+L
            term.exec("load");
            return false;
          case 82: //CTRL+R
            term.exec("run");
            return false;
          case 83: //CTRL+S
            term.exec("step");
            return false;
          default:
            return true;
        }
      }
    }
  });
};

lmas.onReady = function() {
  lmas.initHandlers();
};

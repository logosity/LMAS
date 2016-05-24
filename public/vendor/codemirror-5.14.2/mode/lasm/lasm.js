// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
  mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
  define(["../../lib/codemirror"], mod);
  else // Plain browser env
  mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineSimpleMode("lasm", {
  // The start state contains the rules that are intially used
  start: [
    {regex: /;.*/i, token: "comment"},
    {regex: /equ|org|#/i, token: "keyword-3"},
    {regex: /(?:halt|addr,r[0-9A-F]|subr,r[0-9A-F]|andr,r[0-9A-F]|xorr,r[0-9A-F]|shrl,r[0-9A-F]|shrr,r[0-9A-F]|load,r[0-9A-F]|stor,r[0-9A-F]|brnz,r[0-9A-F]|brnp,r[0-9A-F]|jmpr,r[0-9A-F]|jmpl,r[0-9A-F]|nop|jmp|hex|ascii)\b/i, token: "keyword"},
    {regex: /R[a-f\d]/i, token: "keyword-2"},
    {regex: /"[^"]*"?/i, token: "string"},
    {regex: /[$%]?[0-9A-F]+[\s]?/i, token: "number"},
    {regex: /[-+\/*,@]+/, token: "operator"},
    {regex: /^[a-z]+/, token: "variable"},
  ],
  // The meta property contains global information about the mode. It
  // can contain properties like lineComment, which are supported by
  // all modes, and also directives like dontIndentStates, which are
  // specific to simple modes.
  meta: {
    dontIndentStates: ["comment"],
    lineComment: ";"
  }
});

CodeMirror.defineMIME("text/x-lasm", "lasm");

});

;;;;; LASM - assembler specification/examples
; supported architectures: TOY
; 16 opcodes, 3 pseudo-ops, 6 directives, 3 macros.
; all instructions are a 16-bit word.
; no reloc (obviously). 
; only labels, ';' & '@' can be in position 1. labels defs must be.

;;;; Opcodes. All teh codes. An '_' means nibble is not used in instruction
           HALT               ; 0___
LOOP       ADDR,R2 R3 R4      ; 1234 (incl label 'loop')
           SUBR,R2 R3 R4      ; 2234 
           ANDR,R2 R3 R4      ; 3234
           XORR,R2 R3 R4      ; 4234
           SHLR,R2 R3 R4      ; 5234
           SHRR,R2 R3 R4      ; 6234
           LOAD,R2 #$0A+42    ; 720A
           LOAD,R2 MSG+1      ; 820A
           STOR,R2 $0A        ; 920A
           LOAD,R2 RA         ; A2_A
           STOR,R2 RA         ; B2_A
           BRNZ,R2 LOOP       ; C201 (assuming LOOP is on 0x01)
           BRNP,R2 LOOP       ; D201 (assuming LOOP is on 0x01)
           JMPR,R2            ; E2__
           JMPL,R2            ; F2__

;;;; Pseudo-ops
           NOP                ; D0__ (pseudo-op, as R0 is always zero)
           MOV,R2 R3          ; 1203 (pseudo-op, "load register")
           JMP #$0A           ; C00A (pseudo-op, "goto")

;;;; Directives
IO EQU $FF                    ; define an absolute label

; structural directives (both ORG & DS zero fill)
MSG        ORG $F0            ; move the LC (and starting PC, if top of file). 
myarray    DS 5               ; always words (16 bit)     
           SPACE 42           ; inserts new lines in listings

; data entry directive
MSG        HEX 68 65 6C 6F 2C 20 77 6F 72 6C 64 21 00  

;;;; Macros
; @ for concise code/data entry
MSG @$10       720A 7301 2223 d212 79ff  ; i.e. ORG $10 \n  HEX ...
MSG @         720A 7301 2223 d212 79ff  ; i.e. ORG <LC> \n HEX ... 
; strings
          ASCII  "Hello World!"    ; produces HEX line as above minus the 00 
          ASCIIZ "Hello World!"    ; produces HEX line as above including the 00


                75FF  
                7408
                7601
                5354
                4335
                1336

                7301
                1223
                d210
                79ff
                
                7341
                7401
                1234
                
                720A
                7301
                2223
                d212
                79ff

; assembler version of previous hex code
                LOD 2 #$0A              ; 720A
                LOD 3 #$01              ; 7301
loop            SUB 2 2 3               ; 2223
                BRP 2 loop              ; D212
                LOD 9 #$FF              ; 79FF

; all the codes/syntax. An '_' means nibble is not used in instruction
ORG  $10          ; set the location counter (i.e. where the program is to be loaded and execution started)
SET  IO $FF        ; define an absolute label (in this case, to the IO port at $FF) 
     BRK           ; 0___
LOOP ADDR,R2 R3 R4 ; 1234 (with 'loop' as a relative label)
     SUBR,R2 R3 R4 ; 2234 
     ANDR,R2 R3 R4 ; 3234
     XORR,R2 R3 R4 ; 4234
     SHLR,R2 R3 R4 ; 5234
     SHRR,R2 R3 R4 ; 6234
     LOAD,R2 #$0A  ; 720A
     LOAD,R2 $0A   ; 820A
     STOR,R2 $0A   ; 920A
     LOAD,R2 RA    ; A2_A
     STOR,R2 RA    ; B2_A
     BRNZ,R2 LOOP  ; C211 (assuming loop is on 0x11)
     BRNP,R2 LOOP  ; D211 (assuming loop is on 0x11)
     JMPR,R2       ; E2__
     JMPL,R2       ; F2__
     NOP           ; D0__ (pseudo-op, as R0 is always zero)
     LOAD,R2 R3    ; 1203 (pseudo-op, "load register")
     JMP #$0A      ; C00A (pseudo-op, "goto")





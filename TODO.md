# 2/9/2024
## bugs
* ensure that FF stdin/stdout behavior works as specified, and can be overridden via header values (cf. STDIN/STDOUT directives)
* DONE per TOY spec, PC should be set to 10 (decimal) by default
* change/fix jog terminal command to step at a given pace (make it work like "run slow")

## TOY machine
* toy.js: rename "s", "d" and "t" variables to better reflect their purpose in the spec as follows:
- d == destination (register) 
- s == source (register 1)
- t == source (register 1)
* add the INWAIT behavior from the toy spec: machine will pause when attempting to read from STDIN until the value at STDIN mem location changes.

## assembly language/Opcodes
* `SETPC XX` directive to set the PC value in the binary header (replacing relevant ORG function)
* `FILL XX` directive to zero pad from current LC to target LC (replacing relevant ORG function cf. DASM .FILL )
* `FILL XX YYYY` directive to pad with the value of YYYY (cf .FIL)
* `STDOUT $XX` directive that designates a given memory location (default FF) as the the target of the machine's look function, including an optional label
* `STDIN $XX` directive that designates a mem location (default FF) that will trigger the INWAIT state of the machine (see next) until the value of the mem location is changed.
### additional pseudo-ops cf: https://introcs.cs.princeton.edu/java/63programming
* `GOTO $XX` (unconditional jump)  implement as BRNZ checking R0 (which is always zero per spec) asembles to: C0XX (where XX is the operand of GOTO)
* `COPY,Rd Rs` (register to register copy) as: ADDR,Rd R0 Rs
* `SWAP,Rx Rs Rt` macro (swap registers) as: COPY,Rx R
* `NOP` implement as `ADDR,R0 R0 R0`

## console and editor
* add `watch ascii` command to console so that as values are written to STDOUT mem location the resulting ascii value is printed in the console
* add `watch raw` command to console so that as values are written to STDOUT mem location the raw value is printed in the console
* add support to console to input hex as 0xnn and 0xnnnn values
* add ability to store current editor to local storage so page can be refreshed without losing it
* add ability to save and load programs from local storage
* add help command to show info on console commands

## UI
* add highlight to visualize which mem location is STDIN
* add highlight to visualize which mem location is STDOUT
* add animation to highlight when STDIN changes
* add animation to highlight when STDOUT changes
* add documenation of machine behavior (including links to TOY spec)
* add docs for assembly language
* consider side-by-side view for source/console on one side and machine on the other



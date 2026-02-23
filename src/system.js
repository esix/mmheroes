import { term, _readln, current_color} from "./crt.js";


function _crlf() {
  term.write('\r\n');
}


// CGA color index → ANSI 16-color codes
// Bright variants (8-15) use the high-intensity codes (90-97 fg, 100-107 bg)
const FG_CODE = [30, 34, 32, 36, 31, 35, 33, 37, 90, 94, 92, 96, 91, 95, 93, 97];
const BG_CODE = [40, 44, 42, 46, 41, 45, 43, 47, 100, 104, 102, 106, 101, 105, 103, 107];


export function Write(str) {
  str = '' + str;
  const fg = current_color & 0x0F;
  const bg = (current_color >> 4) & 0x0F;
  term.write(`\x1b[${FG_CODE[fg]};${BG_CODE[bg]}m`);
  term.write(str);

  term.refresh(0, term.rows);
}


export function Writeln(str) {
  if (str !== undefined) Write(str);
  _crlf();
}

export function Readln() {
  return _readln();
}

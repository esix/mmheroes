import ansi from 'ansi-escape-sequences'
import { term, _readln, current_color} from "./crt";


function _crlf() {
  term.write('\r\n');
}


const COLORS = '#000000 #0000aa #00aa00 #00aaaa #aa0000 #aa00aa #aa5500 #aaaaaa #555555 #5555ff #55ff55 #55ffff #ff5555 #ff55ff #ffff55 #ffffff'
    .split(' ')
    .map(s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(1, 5), 16), parseInt(s.slice(5, 7), 16)]);


export function Write(str) {
  str = '' + str;
  const fg = current_color & 0x0F;
  const bg = (current_color >> 4) & 0x0F;
  term.write(ansi.rgb(...COLORS[fg]));
  term.write(ansi.bgRgb(...COLORS[bg]));
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

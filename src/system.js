import ansi from 'ansi-escape-sequences'
import { term, PositionR, PositionC, Screen, ScreenColor, _readln, _update_screen, current_color, _setPositionC, _setPositionR } from "./crt";


function _crlf() {
  _setPositionR(PositionR + 1);
  _setPositionC(0);
  //
  term.write('\r\n');
}


const COLORS = '#000000 #0000aa #00aa00 #00aaaa #aa0000 #aa00aa #aa5500 #aaaaaa #555555 #5555ff #55ff55 #55ffff #ff5555 #ff55ff #ffff55 #ffffff'
    .split(' ')
    .map(s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(1, 5), 16), parseInt(s.slice(5, 7), 16)]);


export function Write(str) {
  str = '' + str;
  for (let i = 0; i < str.length; ++i) {
    Screen[PositionR][PositionC] = str.charAt(i);
    ScreenColor[PositionR][PositionC] = current_color;
    _setPositionC(PositionC + 1);
  }
  _update_screen();

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

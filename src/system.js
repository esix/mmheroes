import ansi from 'ansi-escape-sequences'
import { term, PositionR, PositionC, Screen, ScreenColor, _update_screen, current_color, _setPositionC, _setPositionR } from "./crt";

function _crlf() {
  _setPositionR(PositionR + 1);
  _setPositionC(0);
  //
  term.write('\r\n');
}

export function Write(str) {
  str = '' + str;
  for (let i = 0; i < str.length; ++i) {
    Screen[PositionR][PositionC] = str.charAt(i);
    ScreenColor[PositionR][PositionC] = current_color;
    _setPositionC(PositionC + 1);
  }
  _update_screen();

  const COLORS = [
    [0x00, 0x00, 0x00],
    [0x00, 0x00, 0x80],
    [0x00, 0x80, 0x00],
    [0x00, 0x80, 0x80],
    [0x80, 0x00, 0x00],
    [0x80, 0x00, 0x80],
    [0x80, 0x80, 0x00],
    [0xC0, 0xC0, 0xC0],
    [0x40, 0x40, 0x40],
    [0x00, 0x00, 0xff],
    [0x00, 0xff, 0x00],
    [0x00, 0xff, 0xff],
    [0xff, 0x00, 0x00],
    [0xff, 0x00, 0xff],
    [0xff, 0xff, 0x00],
    [0xff, 0xff, 0xff],
  ];

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
  debugger;
  _update_screen();
  let res = prompt('Enter string:', window.localStorage.getItem('nick') || '');
  if (res === null) {
    res = '';
  }
  return res;
}

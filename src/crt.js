import { Terminal } from "@xterm/xterm";
import { Readline } from "xterm-readline";
import "@xterm/xterm/css/xterm.css";
import ansi from 'ansi-escape-sequences'


export const term = new Terminal({
  cols: 80,
  rows: 25,
  scrollback: 0,
  cursorInactiveStyle: 'none',
  cursorStyle: 'underline',
  // disableStdin: true,
});
const rl = new Readline();
term.loadAddon(rl);

term.open(document.getElementById('terminal'));
term.onKey((e) => {
  onKeyDown(e.domEvent);
});


function __CrtInit() {
  term.clear();
}

__CrtInit();

export let current_color;



const keyBuffer = [];
const readKeyWaiters = [];

let isReadline = false;

function onKeyDown(event) {
  if (isReadline) {
    return;
  }
  if (event.keyCode === 116 || event.keyCode === 16 || event.keyCode === 17 || event.keyCode === 18 || event.keyCode === 91) {
    return;
  }
  if (readKeyWaiters.length) {
    readKeyWaiters.shift()(event.keyCode);
  } else {
    keyBuffer.push(event.keyCode);
  }
}

document.body.addEventListener('keydown', onKeyDown, false);


export function ReadKey() {
  return new Promise((resolve, reject) => {
    if (keyBuffer.length) {
      resolve(keyBuffer.shift());
    } else {
      readKeyWaiters.push(resolve);
    }
  });
}

export function ClrScr() {
  // term.clear();
  term.write(ansi.erase.display(2));
  term.write(ansi.cursor.position(0, 0));
}



export function GotoXY(x, y) {
  term.write(ansi.cursor.position(y, x));
}

export function TextColor(color) {
  current_color = current_color & 0xF0 | (color & 0x0f);
}

export function TextBackground(color) {
  current_color = current_color & 0x0F | ((color & 0x0f) << 4);
}

export async function WhereY() {
  term.refresh(0, term.rows);
  await Delay(0);
  return term.buffer.active.cursorY;
}



export function _update_screen() {
  // let html = '';
  // html += '<table id="screen">';
  // for (let i = 0; i < 25; ++i) {
  //   html += '<tr>';
  //   for (let j = 0; j < 80; ++j) {
  //     html += '<td class="fg' + (ScreenColor[i][j] & 0xF) + ' bg' + (ScreenColor[i][j] >> 4) + '">' +
  //         Screen[i][j] + '</td>';
  //   }
  //   html += '</tr>';
  // }
  // html += '</table>';
  //
  // document.getElementById('content').innerHTML = html;
}


export function _set_current_color(cc) {
  current_color = cc;
}


export function Delay(pause) {
  return new Promise(resolve => {
    window.setTimeout(resolve, pause);
  });
}


export async  function _readln() {
  _update_screen();
  // let res = prompt('Enter string:', window.localStorage.getItem('nick') || '');
  // if (res === null) {
  //   res = '';
  // }
  term.focus();
  isReadline = true;
  let str = await rl.read('Как тебя зовут, герой? ');
  isReadline = false;
  return str;
}

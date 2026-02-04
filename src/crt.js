import ansi from 'ansi-escape-sequences';

export let term;


export async function __CrtInit() {
  if (typeof window !== 'undefined') {
    const { Terminal } = await import("@xterm/xterm");
    const { Readline } = await import("xterm-readline");
    await import("@xterm/xterm/css/xterm.css");
    term = new Terminal({
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
      onKeyDown(e.domEvent.keyCode);
    });
    document.body.addEventListener('keydown', e =>  onKeyDown(e.keyCode), false);

  } else {
    // Node.js версия с использованием readline
    const readline = await import('readline');

    // Настройка raw режима для stdin
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    term = {
      cols: process.stdout.columns || 80,
      rows: process.stdout.rows || 25,
      clear: () => {
        process.stdout.write('\x1Bc'); // Очистка терминала
      },
      write: (data) => {
        process.stdout.write(data);
      },
      refresh: () => {
        // no need
      },
    };
    process.stdin.on('data', (key) => {
      if (key === '\u0003') { // Ctrl+C
        process.exit();
      }
      for (let i = 0; i < key.length; i++) {
        const keyCode = key.charCodeAt(i);
        onKeyDown(keyCode);
      }
    });
  }

  term.clear();
}



export let current_color;



const keyBuffer = [];
const readKeyWaiters = [];

let isReadline = false;

function onKeyDown(keyCode) {
  if (isReadline) {
    return;
  }
  if (keyCode === 116 || keyCode === 16 || keyCode === 17 || keyCode === 18 || keyCode === 91) {
    return;
  }
  if (readKeyWaiters.length) {
    readKeyWaiters.shift()(keyCode);
  } else {
    keyBuffer.push(keyCode);
  }
}



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
    setTimeout(resolve, pause);
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

import { ReadKey } from './crt';

let local_user_name = '';
let help_page;

function get_user_name() {
  if (local_user_name === '' &&
      window.localStorage &&
      window.localStorage.getItem('nick')) {
    local_user_name = window.localStorage.getItem('nick');
  }
  return local_user_name;
}

function set_user_name(name) {
  local_user_name = name;
  if (window.localStorage) {
    window.localStorage.nick = name;
  }
}




/* 0xC8, size 0x44; offsets: [6]
0		0x0C8	subject_professor_names
0x11	0x0D9	subject_titles
0x32    0x0FA
0x34    0x0FC
0x36    0x0FE	subject_tasks
0x38    0x100
0x3A	0x102	subject_exam_days
0x3C    0x104	subject_exam_min_time
0x3E    0x106	subject_exam_max_time
0x40	0x108	subject_exam_places
0x43	0x10B	subject_professor_sex 1=male
*/
let subjects = [];

/* 0x478, sizes 0x1E, 5; offsets: [6][6]
0	0x478	from
2	0x47A	to
4	0x47C	where
*/
let timesheet = [];
/*
{sasha_has: 1, hero_has: 0} [3]
[i + 0x52E] // is_sasha_has_synopsis
[i + 0x55C] // synopsis_presences
*/
let synopsis = [];
/*
[i * 2 + 0x532] // subject_tasks_done
[i * 2 + 0x544] // subject_pass_day
[i * 2 + 0x550] // subject_knowledges
[i + 0x53E] // byte exam_passed [6]
*/
let hero = {
  subject: [],
  garlic: 0, // 25498
  has_mmheroes_disk: 0, // 2549B
  has_inet: 0, // 2549E
  is_invited: 0, // 25496
  inception: 0, // 254A0
  is_working_in_terkom: 0,
  got_stipend: 0,
  has_ticket: 0,
  knows_djug: 0,

  brain: 0,
  stamina: 0,
  charizma: 0,
  health: 0,
  exams_left: 6
};
/*
0x6A4, size 0x54, offsets: {str:, num:, color:} [16]
0		string
0x51	number
0x53	color
*/
let dialog = [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined];
/*
0x3B2, size 0x23, offsets: [5]
0		0x3B2	name
0x21	0x3D3	score
*/
let top_gamers = [];
/*
0x676, size 3, offsets: [12]
0	0x676	current_subject
2	0x678	place

0x32C, size 2
0x344, size 2
*/
let classmates = [];

let terkom_has_places; // 2549D
let klimov_timesheet_was_modified; // 25494


/*
not known vars, seems not affects gameplay

word_2559A
word_256CE
word_256D0
asc_256D2

byte_2549F
byte_254A4
*/
let word_2559A, word_256CE, word_256D0, asc_256D2, byte_2549F, byte_254A4;


async function _init_vars() {
  let init_subjects = function (a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
    subjects.push({
      professor: {name: a1, sex: a11},
      title: a2,
      exam_days: a7,
      exam_min_time: a8,
      exam_max_time: a9,
      exam_places: a10,
      tasks: a5,
      member0xFA: a3,
      member0xFC: a4,
      member0x100: a6
    });
  };

  subjects = [];
  init_subjects('Всемирнов М.А.', 'Алгебра и Т.Ч.', 0xA, 0x11, 0xC, 3, 4, 2, 4, [1, 1, 2], 1);
  init_subjects('Дубцов Е.С.', 'Мат. Анализ', 8, 0xE, 0xA, 2, 4, 2, 3, [1, 1, 1], 1);
  init_subjects('Подкорытов С.С.', 'Геометрия и Топология', 4, 8, 3, 3, 2, 1, 3, [1, 2, 2], 1);
  init_subjects('Климов А.А.', 'Информатика', 5, 6, 2, 3, 2, 1, 2, [3, 3, 3], 1);
  init_subjects('Влащенко Н.П.', 'English', 7, 0xA, 3, 1, 2, 2, 2, [1, 1, 1], 0);
  init_subjects('Альбинский Е.Г.', 'Физ-ра', 7, 0x14, 1, 1, 2, 1, 1, [1, 1, 1], 1);

  timesheet = [];
  for (let i = 0; i < 6; ++i) {
    timesheet.push([]);
    for (let j = 0; j < 6; ++j) {
      timesheet[i].push({from: 0, to: 0, where: 0});
    }
  }

  synopsis = [];
  for (let i = 0; i < 3; ++i) {
    synopsis.push({sasha_has: 1, hero_has: 0});
  }

  hero.subject = [];
  for (let i = 0; i < 6; ++i) {
    hero.subject.push({knowledge: 0, passed: 0, pass_day: -1, tasks_done: 0});
  }

  /*top_gamers = [];
	for (let i = 0; i < 5; ++i) {
		top_gamers.push({name: '', score: 0});
	}*/

  classmates = [];
  for (let i = 0; i < 12; ++i) {
    classmates.push({
      current_subject: -1, place: 0,
      member0x32C: [0, 0, 0, 4, 2, 0, 0, 6, 0, 0, 0, 0][i],
      member0x344: [0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0, 0][i]
    });
  }
}

// [i * 0x11 + 2] // four_letters_places
let places = [{title: '----'}, {title: 'ПУНК '}, {title: 'ПОМИ '}, {title: 'Компы'}, {title: 'Общага'}, {title: 'Мавзолей'}];


// 0x74, size 7
let days = ['22.5', '23.5', '24.5', '25.5', '26.5', '27.5'];
// 0x260, size 0x11
let classmate_names = ['Коля', 'Паша', 'Diamond', 'RAI', 'Миша', 'Серж', 'Саша', 'NiL', 'Кузьменко В.Г.', 'DJuG', 'Эндрю', 'Гриша'];

let Kolya = 0, Pasha = 1, Diamond = 2, Rai = 3, Misha = 4, Serzg = 5, Sasha = 6, Nil = 7, Kuzmenko = 8, Djug = 9,
    Endryu = 10, Grisha = 11;


// 0x9E, size 7
let subject_short_titles = ['АиТЧ', 'МатАн', 'ГиТ', 'Инф', 'ИнЯз', 'Физ-ра'];

let dialog_case_count;
let current_color;
let is_end;
let is_god_mode, is_god_mode_available;

let time_of_day, day_of_week, current_place, death_cause;

let current_subject;
let last_subject;


let Algebra = 0, Matan = 1, GiT = 2, Infa = 3, English = 4, Fizra = 5;


// My little and buggy implementation of utilities like STL
function _upper_bound(cont, val) {
  for (let i = 0; i < cont.length; ++i) {
    if (cont[i] > val) {
      return i;
    }
  }
  return cont.length;
}


// My little and buggy implementation of pascal
let Screen = [];
let ScreenColor = [];
let PositionR = 0, PositionC = 0;

//let Key = -1;

function idiv(x, y) {
  return Math.floor(x / y);
}

function WhereY() {
  return PositionR;
}

function Randomize() {
}

function ParamCount() {
  return 0;
}

function ParamStr(num) {
  return '';
}

function __CrtInit() {
  for (let i = 0; i < 25; ++i) {
    Screen.push([]);
    ScreenColor.push([]);
    for (let j = 0; j < 80; ++j) {
      Screen[i].push(' ');
      ScreenColor[i].push(0x07);
    }
  }
}

function TextColor(col) {
  current_color = current_color & 0xF0 | col;
}

function Delay(pause) { /*let start = new Date().getTime(); while (new Date().getTime - start < pause);*/
  return new Promise(resolve => {
    window.setTimeout(resolve, pause);
  });
}


function alyarme(str) {
  let d = Replay.data;
  //d.rnds_stack = [];
  alert(str + '\r\n\r\n' + get_stack() + '\r\n\r\n' + JSON.stringify(d));
}

function get_stack() {
  try {
    throw Error();
  } catch (e) {
    return e.stack;
  }
}

function get_stack_before(func) {
  let s = get_stack().split('\n');
  //console.dir(s);
  for (let i = s.length - 1; i >= 0; --i) {
    if (s[i].indexOf(func) !== -1) {
      return s[i + 1];
    }
  }
}


let first_run = true;

let Replay = {
  data: {
    on: 0,
    rnds: [], rnds_up: [], rnds_stack: [], rnds_i: 0,
    keys: [], keys_count: 0, keys_i: 0,
    dialogs: [], dialogs_i: 0,
    strs: [], strs_i: 0,
    clrscr_count: 0, clrscr_i: 0,
    start: false, end: false,
    wait_for_dialog: false
  },
  is_on: function () {
    return this.data.on;
  },
  start: function () {
    this.data.start = true;
    this.data.end = false;
  },
  stop: function () {
    this.data.start = false;
    this.data.end = true;
  },
  can_skip_output: function () {
    return this.data.on && this.data.clrscr_i < this.data.clrscr_count;
  },
  next_string: function () {
    return this.data.strs[this.data.strs_i++];
  },
  record_string: function (res) {
    this.data.strs.push(res);
  },
  keys_remains: function () {
    return this.data.keys_i < this.data.keys_count;
  },
  dialogs_remains: function () {
    return this.data.dialogs_i < this.data.dialogs.length;
  },
  strs_remains: function () {
    return this.data.strs_i < this.data.strs.length;
  },
  last: function () {
    return !this.keys_remains() && !this.dialogs_remains() && !this.strs_remains();
  },
  turn_off: function () {
    this.data.on = 0;
    this.data.rnds_i = 0;
    this.data.keys_i = 0;
    this.data.dialogs_i = 0;
    this.data.strs_i = 0;
    this.data.clrscr_i = 0;
    //console.log('replay now off');
  },
  restart: function () {
    //console.log('Replay.restart');
    this.data.on = 0;
    this.data.rnds = [];
    this.data.rnds_up = [];
    this.data.rnds_stack = [];
    this.data.rnds_i = 0;
    this.data.keys = [];
    this.data.keys_count = 0;
    this.data.keys_i = 0;
    this.data.dialogs = [];
    this.data.dialogs_i = 0;
    this.data.strs = [];
    this.data.strs_i = 0;
    this.data.clrscr_count = this.data.clrscr_i = 0;
    this.data.wait_for_dialog = false;
  }
};



function ClrScr() {
  PositionC = 0;
  PositionR = 0;

  for (let i = 0; i < 25; ++i) {
    for (let j = 0; j < 80; ++j) {
      Screen[i][j] = ' ';
      ScreenColor[i][j] = 0x07;
    }
  }
}

function _update_screen() {
  let html = '';
  html += '<table id="screen">';
  for (let i = 0; i < 25; ++i) {
    html += '<tr>';
    for (let j = 0; j < 80; ++j) {
      html += '<td class="fg' + (ScreenColor[i][j] & 0xF) + ' bg' + (ScreenColor[i][j] >> 4) + '">' +
          Screen[i][j] + '</td>';
    }
    html += '</tr>';
  }
  html += '</table>';

  document.getElementById('content').innerHTML = html;
}

function write(str) {
  if (Replay.can_skip_output() || str === undefined) {
    return;
  }
  if (PositionR >= 25) {
    alyarme('write at pos ' + PositionR + ',' + PositionC);
  }
  str = '' + str;
  for (let i = 0; i < str.length; ++i) {
    Screen[PositionR][PositionC] = str.charAt(i);
    ScreenColor[PositionR][PositionC] = current_color;
    ++PositionC;
  }

  _update_screen();
}

function Random(up) {
  let res = Math.floor(Math.random() * up);
  if (up && res >= up || !up && res > 0) {
    alyarme('Random(' + up + ') = ' + res);
  }
  return res;
}


function readln() {
  debugger;
  if (Replay.is_on()) {
    let res = false;
    if (Replay.strs_remains()) {
      let res = Replay.next_string();
    }
    if (Replay.last()) {
      Replay.turn_off();
    }
    if (res !== false) {
      return res;
    }
  }
  _update_screen();
  let res = prompt('Enter string:', get_user_name());
  if (res === null) {
    res = '';
  }
  Replay.record_string(res);
  return res;
}

async function dialog_run(x, y) {
  let current_selection = 0;
  dialog_show(x, y);

  while (1) {
    current_color = 0x70;
    GotoXY(x, y + current_selection);
    write(dialog[current_selection].str);
    let key = await ReadKey();

    current_color = dialog[current_selection].color;
    GotoXY(x, y + current_selection);
    write(dialog[current_selection].str);

    if (key === 0x0D) {
      current_color = 7;
      return dialog[current_selection].num;
    } else if (key === 38) { // up
      if (current_selection === 0) {
        current_selection = dialog_case_count - 1;
      } else {
        --current_selection;
      }
    } else if (key === 40) { // down
      if (current_selection === dialog_case_count - 1) {
        current_selection = 0;
      } else {
        ++current_selection;
      }
    }
  }
} // end function 20B87


async function Main() {
  Replay.start();
  try {
    await PROGRAM();
  } catch (e) {
    if (e !== 42) {
      console.dir(e);
      alert(e + '\r\n' + e.stack);
    }
    return;
  }
  Replay.stop();
}


let _color = [
  '#000', '#000080', '#008000', '#008080', '#800000', '#800080', '#808000', '#C0C0C0',
  '#404040', '#00f', '#0f0', '#0ff', '#f00', '#f0f', '#ff0', '#fff'
];

function _color_to_html_fg(col) {
  return _color[col & 0xF];
}

function _color_to_html_bg(col) {
  return _color[col >> 4];
}

function _crlf() {
  ++PositionR;
  PositionC = 0;
}

function writeln(str) {
  if (str !== undefined) write(str);
  _crlf();
}

function GotoXY(x, y) {
  PositionR = y - 1;
  PositionC = x - 1;
}

function Assign(f, file) {
}

function Reset(f, mode) {
}

function Rewrite(f, mode) {
}

function IOResult() {
  return 1;
}

function Read(f) {
}

function Close(f) {
}


function Sqrt(x) {
  return Math.sqrt(x);
}

function Trunc(x) {
  return Math.floor(x);
}

function Round(x) {
  return Math.round(x);
}


function jz(a, b) {
  return a === b;
}

function jnz(a, b) {
  return a !== b;
}

function jl(a, b) {
  return a < b;
}

function jle(a, b) {
  return a <= b;
}

function jg(a, b) {
  return a > b;
}

function jge(a, b) {
  return a >= b;
}

function jb(a, b) {
  return a < b;
}

function jnb(a, b) {
  return a >= b;
}

function jbe(a, b) {
  return a <= b;
}

function ja(a, b) {
  return a > b;
}

// from dseg
let aGamma3_14 = 'gamma3.14';


let aXocesPoprobova = 'Хочешь попробовать еще?';
let aDaDaDa = 'ДА!!! ДА!!! ДА!!!';
let aNet___Net___Ne = 'Нет... Нет... Не-э-эт...';


async function prompt_for_new_game() {
  ClrScr();
  writeln(aXocesPoprobova);
  dialog_start();
  dialog_case(aDaDaDa, -1);
  dialog_case(aNet___Net___Ne, -2);
  let result = await dialog_run(1, 4) === -2;
  ClrScr();
  return result;
}


let a3decHappyBirth = '-3dec-happy-birthday-Diamond';


async function PROGRAM() {
  await _init_vars();

  __CrtInit();

  dialog_case_count = 0;
  Randomize();

  if (ParamCount() > 0 && ParamStr(1) === a3decHappyBirth) {
    is_god_mode_available = 1;
  }

  do {
    read_top_gamers();

    //_init_vars();
    if (first_run) {
      await show_intro_screen();
      first_run = false;
    }

    await init_game();
    await show_dzin_and_timesheet();

    do {
      await scene_router();
      await check_exams_left_count();
    } while (is_end === 0);

    await game_end();
  } while (await prompt_for_new_game() === false);
  await show_disclaimer();
  write_top_gamers();
}


let aDzin = 'ДЗИНЬ!';
let aDddzzzzziiiiii = 'ДДДЗЗЗЗЗИИИИИИННННННЬ !!!!';
let aDdddddzzzzzzzz = 'ДДДДДДЗЗЗЗЗЗЗЗЗЗЗЗЗИИИИИИИИИИННННННННННННЬ !!!!!!!!!!';
let aTiProsipaesSqO = 'Ты просыпаешься от звонка будильника ';
let aGoMaqV800_ = '-го мая в 8:00. ';
let aNeojidannoTiOs = 'Неожиданно ты осознаешь, что началась зачетная неделя,';
let aATvoqGotovnost = 'а твоя готовность к этому моменту практически равна нулю.';
let aNatqgivaqNaSeb = 'Натягивая на себя скромное одеяние студента,';
let aTiVsmatrivaesS = 'ты всматриваешься в заботливо оставленное соседом на стене';
let aRaspisanieKogd = 'расписание: когда и где можно найти искомого препода ?';


async function show_dzin_and_timesheet() {
  ClrScr();
  TextColor(0x0A);
  writeln(aDzin);
  await Delay(0x1F4);
  TextColor(0x0E);
  writeln(aDddzzzzziiiiii);
  await Delay(0x2BC);
  TextColor(0x0C);
  writeln(aDdddddzzzzzzzz);
  await Delay(0x3E8);
  TextColor(7);
  write(aTiProsipaesSqO);
  write(0x16);
  writeln(aGoMaqV800_);
  writeln(aNeojidannoTiOs);
  writeln(aATvoqGotovnost);
  writeln(aNatqgivaqNaSeb);
  writeln(aTiVsmatrivaesS);
  writeln(aRaspisanieKogd);
  await wait_for_key();
  ClrScr();
  show_timesheet();
  await wait_for_key();
  ClrScr();
} // end function 102EF


let aNowhere_at_tur = 'nowhere_at_turn';


async function scene_router() {
  if (current_place === 2) {
    if (current_subject !== -1) {
      await scene_exam();
    } else {
      await scene_pomi();
    }
  } else if (current_place === 1) {
    if (current_subject !== -1) {
      await scene_exam();
    } else {
      await scene_punk();
    }
  } else if (current_place === 5) {
    await scene_mausoleum();
  } else if (current_place === 4) {
    await scene_obschaga();
  } else if (current_place === 3) {
    if (current_subject !== -1) {
      await scene_exam();
    } else {
      await scene_kompy();
    }
  } else if (current_place === 0) {
    await bug_report(aNowhere_at_tur);
  }
} // end function 10433


let aLegceLbomKolot = 'Легче лбом колоть орехи,';
let aCemUcitSqNaMat = 'чем учиться на МАТ-МЕХе.';


async function game_end_death() {
  current_color = 0x0C;
  writeln(aLegceLbomKolot);
  writeln(aCemUcitSqNaMat);
  current_color = 0x0D;
  writeln(death_cause);
  await wait_for_key();
} // end function 104DC


let aUfffffVoVsqkom = 'Уффффф! Во всяком случае, ты еще живой.';
let aYesTiSdelalAto = '********* Yes! Ты сделал это! *********';
let aUTebqNetCelix = 'У тебя нет целых ';
let aZacetov = ' зачетов!';
let aTiOtcislen = 'ТЫ ОТЧИСЛЕН!';
let aNetDvuxZacetov = 'Нет двух зачетов - плохо.';
let aGovorqtUMexani = 'Говорят, у механиков жизнь проще...';
let aZrqGovorqtXalq = '- Зря говорят, ХАЛЯВЫ НЕ БУДЕТ!';
let aNetOdnogoZacet = 'Нет одного зачета.';
let aNicegoOtAtogoE = 'Ничего, от этого еще никто не помирал.';
let aPozdravlquTiMo = 'Поздравляю: ты можешь считать себя настоящим героем Мат-Меха!';
let aUspesnoiTebeSe = 'Успешной тебе сессии !';
let aUTebqNetZaceta = 'У тебя нет зачета по алгебре!';
let aVsemirnovDokan = 'Всемирнов доканал тебя на сессии.';
let aEstestvennoAto = 'Естественно, это повлияло на твои оценки.';
let aUTebqNetDopusk = 'У тебя нет допуска по матану!';
let aUTebqNetZace_0 = 'У тебя нет зачета по геометрии!';
let aKakTebqUgorazd = 'Как тебя угораздило?';
let aKSessiiTiGotov = 'К сессии ты "готовился", "работая" в ТЕРКОМе.';
let aTiResilBolSeNi = 'Ты решил больше никогда так не делать.';
let aTvoqStipuxa = 'Твоя стипуха - ';
let aRub_ = ' руб.';
let aVZanacke = 'В заначке ';
let aDaTiEseIGodNet = 'Да ты еще и GOD! Нет, тебе в таблицу рекордов нельзя.';
let aTebqOstaviliBe = 'Тебя оставили без стипухи.';


async function game_end_alive() {
  if (hero.exams_left > 0) {
    colored_output(0x0D, aUfffffVoVsqkom);
  } else {
    colored_output(0x0F, aYesTiSdelalAto);
  }

  writeln();
  writeln();

  if (hero.exams_left >= 3) {
    colored_output(0x0C, aUTebqNetCelix);
    colored_output_white(hero.exams_left);
    colored_output(0x0C, aZacetov);
    writeln();
    colored_output(0x0D, aTiOtcislen);
    await wait_for_key();
    return;
  } else if (hero.exams_left === 2) {
    colored_output_ln(0x0E, aNetDvuxZacetov);
    colored_output_ln(0x0E, aGovorqtUMexani);
    colored_output_ln(0x0E, aZrqGovorqtXalq);
  } else if (hero.exams_left === 1) {
    colored_output_ln(0x0A, aNetOdnogoZacet);
    colored_output_ln(0x0A, aNicegoOtAtogoE);
  } else if (hero.exams_left === 0) {
    colored_output_ln(0x0F, aPozdravlquTiMo);
    colored_output_ln(0x0F, aUspesnoiTebeSe);
  }

  let score = 0;
  for (let subj = 0; subj <= 5; ++subj) {
    if (hero.subject[subj].pass_day !== -1) {
      score +=
          idiv((6 - hero.subject[subj].pass_day) *
              (subjects[subj].tasks + subjects[subj].member0xFA) * 2, 3);
    }
  }


  if (!hero.subject[Algebra].passed) {
    current_color = 0x0C;
    writeln();
    writeln(aUTebqNetZaceta);
    writeln(aVsemirnovDokan);
    writeln(aEstestvennoAto);
    current_color = 7;

    score -= (subjects[Algebra].tasks - hero.subject[Algebra].tasks_done) * 4;
    if (score < 0) {
      score = 0;
    }
  }

  if (!hero.subject[Matan].passed) {
    current_color = 0x0C;
    writeln();
    writeln(aUTebqNetDopusk);
    score = idiv(score * 2, 3);
    current_color = 7;
  }

  if (!hero.subject[GiT].passed) {
    current_color = 0x0C;
    writeln();
    writeln(aUTebqNetZace_0);
    writeln(aKakTebqUgorazd);
    score = idiv(score * 2, 3);
    current_color = 7;
  }

  if (hero.is_working_in_terkom) {
    current_color = 0x0C;
    writeln();
    writeln(aKSessiiTiGotov);
    writeln(aTiResilBolSeNi);
    score = idiv(score * 2, 3);
    current_color = 7;
  }

  writeln();

  if (score <= 0) {
    writeln(aTebqOstaviliBe);
  } else {
    write(aTvoqStipuxa);
    colored_output_white(score);
    writeln(aRub_);
    write(aVZanacke);
    TextColor(0x0F);
    write(hero.money);
    TextColor(7);
    writeln(aRub_);
    writeln();

    if (is_god_mode) {
      score = 0;
      hero.money = 0;
      writeln(aDaTiEseIGodNet);
    } else {
      update_top_gamers(score + hero.money);
    }
  }
  await wait_for_key();
} // end function 1081D


let aNamPonqtenAtot = '                                                Нам понятен этот смех';
let aNePopavsixNaM = '                                                Не попавших на Мат-Мех';
let aNadpisNaPa = '                                                  (надпись на парте)';
let aHHEeeRrOEeeSsM = ' H H  EEE  RR    O   EEE  SS       M   M  A   A TTTTT       M   M  EEE  X   X';
let aHHERROOESMmMmA = ' H H  E    R R  O O  E   S         MM MM  AAAAA   T         MM MM    E   X X';
let aHhhEeRrOOEeSOf = ' HHH  EE   RR   O O  EE   S    OF  M M M  A   A   T    &&&  M M M   EE    X';
let aHHERROOESMMAAT = ' H H  E    R R  O O  E     S       M   M   A A    T         M   M    E   X X';
let aHHEeeRROEeeSsM = ' H H  EEE  R R   O   EEE SS        M   M    A     T         M   E  EEE  X   X';
let aGeroiMataIMexa = '                             ГЕРОИ МАТА И МЕХА ;)';
let aPCrwmmDevelopm = '(P) CrWMM Development Team, 2001.';
let aVersiq = 'Версия ';
let aZaglqniteNaNas = 'Загляните на нашу страничку: mmheroes.chat.ru !';


async function show_intro_screen() {
  ClrScr();
  TextColor(8);
  writeln(aNamPonqtenAtot);
  writeln(aNePopavsixNaM);
  writeln(aNadpisNaPa);
  writeln();
  writeln();
  writeln();
  TextColor(0x0F);
  writeln(aHHEeeRrOEeeSsM);
  writeln(aHHERROOESMmMmA);
  writeln(aHhhEeRrOOEeSOf);
  writeln(aHHERROOESMMAAT);
  writeln(aHHEeeRROEeeSsM);
  writeln();
  writeln();
  TextColor(0x0C);
  writeln(aGeroiMataIMexa);
  writeln();
  writeln();
  TextColor(0x0B);
  writeln(aPCrwmmDevelopm);
  write(aVersiq);
  write(aGamma3_14);
  writeln('.');
  writeln(aZaglqniteNaNas);
  await wait_for_key();
  ClrScr();
} // end function 10E96


async function game_end() {
  ClrScr();
  if (hero.health <= 0) {
    await game_end_death();
  } else {
    await game_end_alive();
  }
} // end function 11029


let aDisclaimer = 'DISCLAIMER';
let a1_VsePersonaji = '1.) Все персонажи реальны. Эта программа является лишь неким отражением';
let aMneniqEeAvtora = '    мнения ее автора об окружающей действительности.';
let aAvtorNeStavilC = '    Автор не ставил цели оценить чью-либо линию поведения.';
let a2_PoctiVseSobi = '2.) Почти все события реальны. Естественно, многие из них';
let aPredstavleniVN = '    представлены в несколько аллегорическом виде.';
let a3_VseSovpadeni = '3.) Все совпадения с другими реальными зачетными неделями,';
let aProvedennimiKe = '    проведенными кем-либо в каком-либо ВУЗе, лишь подчеркивают';
let aRealisticnostV = '    реалистичность взглядов автора на реальность.';


async function show_disclaimer() {
  ClrScr();
  TextColor(0x0A);
  writeln(aDisclaimer);
  writeln();
  TextColor(9);
  writeln(a1_VsePersonaji);
  writeln(aMneniqEeAvtora);
  writeln(aAvtorNeStavilC);
  writeln();
  writeln(a2_PoctiVseSobi);
  writeln(aPredstavleniVN);
  writeln();
  writeln(a3_VseSovpadeni);
  writeln(aProvedennimiKe);
  writeln(aRealisticnostV);
  writeln();
  writeln();
  TextColor(0x0C);
  writeln('*.) Если вы нашли в данной программе ошибку (любую, включая опечатки),');
  writeln('    Ваши комментарии будут очень полезны.');
  writeln();
  TextColor(8);
  writeln('Автор не несет ответственность за психическое состояние игрока.');
  await wait_for_key();
  ClrScr();
} // end function 112D0


function goto_kompy_to_obschaga() {
  current_subject = -1;
  current_place = 4;
} // end function 11450


let aNeSmogRasstatS = 'Не смог расстаться с компьютером.';


function goto_kompy_to_punk() {
  current_place = 1;
  current_subject = -1;
  decrease_health(2, aNeSmogRasstatS);
} // end function 11482


let aZdraviiSmislPo = 'Здравый смысл подсказывает тебе, что в такое время';
let aTiTamNikogoUje = 'ты там никого уже не найдешь.';
let aNeBudemZrqTrat = 'Не будем зря тратить здоровье на поездку в ПОМИ.';
let aVAlektrickeNas = 'В электричке нашли бездыханное тело.';
let aDenegUTebqNetP = 'Денег у тебя нет, пришлось ехать зайцем...';
let aTebqZaloviliKo = 'Тебя заловили контролеры!';
let aVisadiliVKrasn = 'Высадили в Красных зорях, гады!';
let aKontroleriJizn = 'Контролеры жизни лишили.';
let aUfDoexal = 'Уф, доехал!';
let aExatZaicem = 'Ехать зайцем';
let aCestnoZaplatit = 'Честно заплатить 10 руб. за билет в оба конца';


async function goto_kompy_to_pomi() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  if (time_of_day > 20) {
    writeln(aZdraviiSmislPo);
    writeln(aTiTamNikogoUje);
    writeln(aNeBudemZrqTrat);
    await wait_for_key();
    return;
  }

  decrease_health(Random(0x0A), aVAlektrickeNas);
  current_place = 2;

  if (hero.money < 10) {
    writeln(aDenegUTebqNetP);

    if (hero.charizma < Random(0x0A)) {
      writeln(aTebqZaloviliKo);
      writeln(aVisadiliVKrasn);
      hero.health -= 0xA;
      if (hero.health <= 0) {
        is_end = 1;
        death_cause = aKontroleriJizn;
      }
      await hour_pass();
    } else {
      writeln(aUfDoexal);
    }

  } else {

    dialog_start();
    dialog_case(aExatZaicem, -1);
    dialog_case(aCestnoZaplatit, -2);
    let result = await dialog_run(1, 0x0C);
    if (result === -1) {
      if (hero.charizma < Random(0x0A)) {
        GotoXY(1, 0x0F);
        writeln(aTebqZaloviliKo);
        writeln(aVisadiliVKrasn);
        await hour_pass();
      } else {
        GotoXY(1, 0x0F);
        writeln(aUfDoexal);
      }
    } else if (result === -2) {
      hero.money -= 10;
      hero.has_ticket = 1;
    }
  }

  await wait_for_key();
  await hour_pass();
} // end function 1160A


let aKlimovA_a_Sidi = 'Климов А.А. сидит и тоскует по халявному Inet\'у.';
let a___ = '...';


async function goto_klimov() {
  if (Random(2) === 0) {
    ClrScr();
    TextColor(7);
    writeln(aKlimovA_a_Sidi);
    writeln(a___);
    await ReadKey();
    ClrScr();
  }
  current_subject = 3;
} // end function 1182D


let aUmerPoPutiVMav = 'Умер по пути в мавзолей.';


function goto_kompy_to_mausoleum() {
  current_subject = -1;
  current_place = 5;
  decrease_health(2, aUmerPoPutiVMav);
} // end function 1189E


let aDzin_0 = 'ДЗИНЬ!';
let aDddzzzzziiii_0 = 'ДДДЗЗЗЗЗИИИИИИННННННЬ !!!!';
let aDdddddzzzzzz_0 = 'ДДДДДДЗЗЗЗЗЗЗЗЗЗЗЗЗИИИИИИИИИИННННННННННННЬ !!!!!!!!!!';
let aNeojidannoTi_0 = 'Неожиданно ты осознаешь, что началась зачетная неделя,';
let aATvoqGotovno_0 = 'а твоя готовность к этому моменту практически равна нулю.';
let aNatqgivaqNaS_0 = 'Натягивая на себя скромное одеяние студента,';
let aTiVsmatrivae_0 = 'ты всматриваешься в заботливо оставленное соседом на стене';
let aRaspisanieKo_0 = 'расписание: когда и где можно найти искомого препода ?';
let aStop = '!!!!!! СТОП! !!!!!!';
let aCtoToTakoeTiUj = 'ЧТО-ТО ТАКОЕ ТЫ УЖЕ ВИДЕЛ!!!';
let aOglqdevsisVokr = 'Оглядевшись вокруг, ты осознаешь, что, вроде бы,';
let aAkstraordinarn = 'экстраординарного не произошло. Ты просто играешь в компьютерную';
let aIgruNeSamogoLu = 'игру не самого лучшего качества, в которой тебе вдруг предложили...';
let aSigratVAtuSamu = 'СЫГРАТЬ В ЭТУ САМУЮ ИГРУ! [...]';
let aRazdvoenieLojn = 'Раздвоение ложной личности.';
let aNeKajdiiSposob = 'Не каждый способен пережить такое потрясение.';
let aPostepennoKTeb = 'Постепенно к тебе приходит осознание того, что';
let aNaSamomDeleVse = 'на самом деле, все это - компьютерная игра, и, следовательно,';
let aAtiSobitiqProi = 'эти события происходят только в твоем воображении.';
let aVovremqViidqIz = 'Вовремя выйдя из странного трансцендентального состояния,';
let aTiObnarujivaes = 'ты обнаруживаешь себя в компьютерном классе Мат-Меха.';
let aPravdaMirVokru = 'Правда, мир вокруг тебя, похоже, несколько иной,';
let aNejeliOnBilCas = 'нежели он был час минут назад...';


async function play_mmheroes() {
  ++hero.inception;
  ClrScr();
  TextColor(0x0A);
  writeln(aDzin_0);
  await Delay(0x1F4);
  TextColor(0x0E);
  writeln(aDddzzzzziiii_0);
  await Delay(0x2BC);
  TextColor(0x0C);
  writeln(aDdddddzzzzzz_0);
  await Delay(0x3E8);
  TextColor(7);
  writeln(aNeojidannoTi_0);
  writeln(aATvoqGotovno_0);
  writeln(aNatqgivaqNaS_0);
  writeln(aTiVsmatrivae_0);
  writeln(aRaspisanieKo_0);
  await wait_for_key();
  ClrScr();
  TextColor(0x0F);
  writeln(aStop);
  writeln();
  writeln(aCtoToTakoeTiUj);
  writeln(aOglqdevsisVokr);
  writeln(aAkstraordinarn);
  writeln(aIgruNeSamogoLu);
  writeln(aSigratVAtuSamu);
  await ReadKey();

  if (hero.stamina + hero.brain - hero.inception * 5 < 8) {
    decrease_health(0x64, aRazdvoenieLojn);
  }

  await hour_pass();

  if (hero.health <= 0) {
    return;
  }

  writeln();
  TextColor(0x0E);
  writeln(aNeKajdiiSposob);
  writeln(aPostepennoKTeb);
  writeln(aNaSamomDeleVse);
  writeln(aAtiSobitiqProi);
  writeln(aVovremqViidqIz);
  writeln(aTiObnarujivaes);
  writeln(aPravdaMirVokru);
  writeln(aNejeliOnBilCas);
  inception_reinit_timesheet();
  await wait_for_key();
} // end function 11CD5


let aUxTiTiNaselPro = 'Ух ты! Ты нашел програмку, которая нужна для Климова!';


async function surf_inet() {
  if (is_god_mode || Random(hero.brain) > 6 && hero.subject[Infa].tasks_done < hero.subject[Infa].tasks) {
    GotoXY(1, 0x14);
    TextColor(0x0B);
    writeln(aUxTiTiNaselPro);
    ++hero.subject[Infa].tasks_done;
  } else if (Random(3) === 0 && hero.brain < 5) {
    ++hero.brain;
  }
  await wait_for_key();
  await hour_pass();
} // end function 11FA2


let aKlassZakrivaet = 'Класс закрывается. Пошли домой!';
let aUmerPoPutiDomo = 'Умер по пути домой. Бывает.';
let aTiVKompUternom = 'Ты в компьютерном классе. Что делать?';
let aKlimovA_a_ = 'Климов А.А.';
let aPoitiVObsagu = 'Пойти в общагу';
let aPokinutKlass = 'Покинуть класс';
let aPoexatVPomi = 'Поехать в ПОМИ';
let aPoitiVMavzolei = 'Пойти в мавзолей';
let aProvesti1CasVI = 'Провести 1 час в Inet\'е';
let aPoigratVMmhero = 'Поиграть в MMHEROES';
let aSMenqXvatit = 'С меня хватит!';


async function scene_kompy() {
  show_header_stats();
  TextColor(7);
  GotoXY(1, 8);

  if (time_of_day > 20) {
    writeln(aKlassZakrivaet);
    await wait_for_key();
    current_subject = -1;
    current_place = 4;
    decrease_health(Random(5), aUmerPoPutiDomo);
    return;
  }

  writeln(aTiVKompUternom);

  dialog_start();
  if (is_professor_here(Infa)) {
    dialog_case_colored(aKlimovA_a_, -1, 0x0E);
  }
  dialog_case(aPoitiVObsagu, -2);
  dialog_case(aPokinutKlass, -3);
  dialog_case(aPoexatVPomi, -4);
  dialog_case(aPoitiVMavzolei, -5);
  if (hero.has_inet) {
    dialog_case(aProvesti1CasVI, -11);
  }
  for (let i = 0; i <= 0xB; ++i) {
    if (classmates[i].place === 3) {
      dialog_case_colored(classmate_names[i], i, 0xE);
    }
  }
  if (hero.has_mmheroes_disk) {
    dialog_case(aPoigratVMmhero, -10);
  }
  dialog_case_colored(aSMenqXvatit, -6, 9);

  show_short_today_timesheet(0x0A);

  let res = await dialog_run(1, 0x0A);
  let arr = {
    1: goto_klimov,
    2: goto_kompy_to_obschaga,
    3: goto_kompy_to_punk,
    4: goto_kompy_to_pomi,
    5: goto_kompy_to_mausoleum,
    6: request_exit,
    10: play_mmheroes,
    11: surf_inet
  };
  if (arr[-res] !== undefined) {
    await arr[-res]();
  } else if (res >= 0 && res <= 0xB) {
    await talk_with_classmate(res);
  }
} // end function 120F8


let aUmerPoPutiNaFa = 'Умер по пути на факультет.';


async function goto_mausoleum_to_punk() {
  decrease_health(3, aUmerPoPutiNaFa);
  current_subject = -1;
  current_place = 1;
}


function goto_mausoleum_to_obschaga() {
  current_subject = -1;
  current_place = 4;
} // end function 12307


let aViberiSebeSpos = 'Выбери себе способ "культурного отдыха".';
let aStakanKoliZa4R = 'Стакан колы за 4 р.';
let aSup6R_VseUdovo = 'Суп, 6 р. все удовольствие';
let a05PivaZa8R_ = '0,5 пива за 8 р.';
let aRasslablqtSqBu = 'Расслабляться будем своими силами.';
let aNetOtdixatAtoQ = 'Нет, отдыхать - это я зря сказал.';
let aPivnoiAlkogoli = 'Пивной алкоголизм, батенька...';


async function rest_in_mausoleum() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  writeln(aViberiSebeSpos);
  show_short_today_timesheet(0x0B);

  dialog_start();
  if (hero.money >= 4) {
    dialog_case(aStakanKoliZa4R, -2);
  }
  if (hero.money >= 6) {
    dialog_case(aSup6R_VseUdovo, -3);
  }
  if (hero.money >= 8) {
    dialog_case(a05PivaZa8R_, -1);
  }
  dialog_case(aRasslablqtSqBu, -4);
  dialog_case(aNetOtdixatAtoQ, 0);
  let res = await dialog_run(1, 0x0B);

  if (res === -1) {
    hero.money -= 8;
    if (Random(3) === 0) {
      --hero.brain;
    }
    if (Random(3) === 0) {
      ++hero.charizma;
    }
    if (Random(2) === 0) {
      ++hero.stamina;
    }
    hero.health += Random(hero.charizma);
    if (hero.brain <= 0) {
      hero.health = 0;
      is_end = 1;
      death_cause = aPivnoiAlkogoli;
    }
  } else if (res === -2) {
    hero.money -= 4;
    hero.health += Random(hero.charizma) + 3;
  } else if (res === -3) {
    hero.money -= 6;
    hero.health += Random(hero.charizma) + 5;
  } else if (res === -4) {
    hero.health += Random(hero.charizma);
  } else if (res === 0) {
    return;
  }

  await hour_pass();
} // end function 123E4


let aTiVMavzolee_Ct = 'Ты в мавзолее. Что делать?';
let aIdtiVPunk = 'Идти в ПУНК';
let aPoexatVPomi_0 = 'Поехать в ПОМИ';
let aIdtiVObsagu = 'Идти в общагу';
let aOtdixat = 'Отдыхать';
let aSMenqXvatit_0 = 'С меня хватит!';


async function scene_mausoleum() {
  show_header_stats();
  TextColor(7);
  GotoXY(1, 8);
  writeln(aTiVMavzolee_Ct);

  dialog_start();
  dialog_case(aIdtiVPunk, -1);
  dialog_case(aPoexatVPomi_0, -5);
  dialog_case(aIdtiVObsagu, -2);
  dialog_case(aOtdixat, -3);
  for (let i = 0; i <= 0xB; ++i) {
    if (classmates[i].place === 5) {
      dialog_case_colored(classmate_names[i], i, 0xE);
    }
  }
  dialog_case_colored(aSMenqXvatit_0, -4, 9);

  show_short_today_timesheet(0x0A);

  const res = await dialog_run(1, 0x0A);
  if (res === -1) {
    await goto_mausoleum_to_punk();
  } else if (res === -2) {
    goto_mausoleum_to_obschaga();
  } else if (res === -3) {
    await rest_in_mausoleum();
  } else if (res === -4) {
    await request_exit();
  } else if (res === -5) {
    await goto_punk_or_mausoleum_to_pomi();
  } else if (res >= 0 && res <= 0xB) {
    await talk_with_classmate(res);
  }

} // end function 12595


let aKCemuGotovitSq = 'К чему готовиться?';
let aK = ' (к)';
let aNiKCemu = 'Ни к чему';
let aVospolZuusKons = 'Воспользуюсь конспектом';
let aBuduUcitSqKakU = 'Буду учиться, как умею';
let aZaucilsq_ = 'Заучился.';
let aZubrejkaDoDobr = 'Зубрежка до добра не доводит!';


async function botva() {
  ClrScr();
  show_header_stats();
  TextColor(7);
  GotoXY(1, 8);
  writeln(aKCemuGotovitSq);

  dialog_start();
  for (let i = 0; i <= 5; ++i) {
    dialog_case(subjects[i].title + (i <= 2 && synopsis[i].hero_has ? aK : ''), i);
  }
  dialog_case(aNiKCemu, -1);

  show_short_today_timesheet(0x0A);

  let subj = await dialog_run(1, 0x0A);
  if (subj === -1) {
    return;
  }

  let use_synopsis = 0;
  if (subj <= 2 && synopsis[subj].hero_has) {
    dialog_start();
    dialog_case(aVospolZuusKons, -1);
    dialog_case(aBuduUcitSqKakU, -2);
    use_synopsis = (await dialog_run(1, 0x12)) === -1;
  }

  let var_6 = subj === 5 ? hero.stamina : hero.brain;
  if (var_6 <= 0) {
    return;
  }

  hero.subject[subj].knowledge +=
      (time_of_day < 19 ? var_6 : idiv(var_6 * 2, 3)) -
      Random(idiv(var_6, 2)) +
      Random(idiv(hero.health, 0x12)) +
      (use_synopsis ? 0xA : 0);

  // #warning
  if (hero.subject[subj].knowledge < 0) {
    alert(hero.subject[subj].knowledge);
  }

  let health_penalty;
  if (hero.stamina > 0) {
    health_penalty = 0xA - Random(hero.stamina);
  } else {
    health_penalty = Random(hero.stamina) + 0xA;
  }
  if (health_penalty < 0 || use_synopsis) {
    health_penalty = 0;
  }
  if (time_of_day > 21 || time_of_day < 4) {
    health_penalty += 0x0C;
  }
  decrease_health(health_penalty, aZaucilsq_);

  if (hero.subject[subj].knowledge > 0x2D) {
    decrease_health(0x0A, aZubrejkaDoDobr);
  }

  if (!is_end) {
    await hour_pass();
  }
} // end function 12719


let aUmerPoPutiNa_0 = 'Умер по пути на факультет.';


function goto_obschaga_to_punk() {
  current_place = 1;
  current_subject = -1;
  decrease_health(3, aUmerPoPutiNa_0);
} // end function 12995


let aZdraviiSmisl_0 = 'Здравый смысл подсказывает тебе, что в такое время';
let aTiTamNikogoU_0 = 'ты там никого уже не найдешь.';
let aNeBudemZrqTr_0 = 'Не будем зря тратить здоровье на поездку в ПОМИ.';
let aVAlektrickeN_0 = 'В электричке нашли бездыханное тело.';
let aDenegUTebqNe_0 = 'Денег у тебя нет, пришлось ехать зайцем...';
let aTebqZalovili_0 = 'Тебя заловили контролеры!';
let aVisadiliVKra_0 = 'Высадили в Красных зорях, гады!';
let aKontroleriJi_0 = 'Контролеры жизни лишили.';
let aUfDoexal_0 = 'Уф, доехал!';
let aExatZaicem_0 = 'Ехать зайцем';
let aCestnoZaplat_0 = 'Честно заплатить 10 руб. за билет в оба конца';


async function goto_obschaga_to_pomi() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);

  if (time_of_day > 20) {
    ClrScr();
    writeln(aZdraviiSmisl_0);
    writeln(aTiTamNikogoU_0);
    writeln(aNeBudemZrqTr_0);
    await wait_for_key();
    return;
  }

  decrease_health(Random(0x0A), aVAlektrickeN_0);
  current_place = 2;

  if (hero.money < 10) {

    writeln(aDenegUTebqNe_0);
    if (hero.charizma < Random(0x0A)) {
      writeln(aTebqZalovili_0);
      writeln(aVisadiliVKra_0);
      hero.health -= 0xA;
      if (hero.health <= 0) {
        death_cause = aKontroleriJi_0;
      }
      await hour_pass();
    } else {
      writeln(aUfDoexal_0);
    }

  } else {
    dialog_start();
    dialog_case(aExatZaicem_0, -1);
    dialog_case(aCestnoZaplat_0, -2);
    let res = await dialog_run(1, 0x0C);

    if (!(res !== -1)) {
      if (hero.charizma < Random(0x0A)) {
        GotoXY(1, 0x0F);
        writeln(aTebqZalovili_0);
        writeln(aVisadiliVKra_0);
        await hour_pass();
      } else {
        GotoXY(1, 0x0F);
        writeln(aUfDoexal_0);
      }
    } else if (!(res !== -2)) {
      hero.money -= 10;
      hero.has_ticket = 1;
    }

  }

  await wait_for_key();
  await hour_pass();
} // end function 12B1E


let aUmerPoPutiVM_0 = 'Умер по пути в мавзолей.';


function goto_obschaga_to_mausoleum() {
  current_subject = -1;
  current_place = 5;
  decrease_health(3, aUmerPoPutiVM_0);
} // end function 12D2A


async function see_timesheet() {
  ClrScr();
  show_timesheet();
  await wait_for_key();
  ClrScr();
} // end function 12D46


let aTebqCegoToNeTq = 'Тебя чего-то не тянет по-спать...';


async function try_sleep() {
  if (time_of_day > 3 && time_of_day < 20) {
    GotoXY(1, 0x16);
    writeln(aTebqCegoToNeTq);
    await wait_for_key();
  } else {
    await goto_sleep();
  }
} // end function 12D81


function clamp0(arg_2) {
  return arg_2 < 0 ? 0 : arg_2;
} // end function 12DC1


let aKTebeLomitsqSo = 'К тебе ломится сосед и приглашает тебя ';
let aNaSvoiDenRojde = 'на свой День Рожденья.';
let aNaDiskotekuVSa = 'на дискотеку в "Шайбе".';
let aPoigratVMafiu_ = 'поиграть в мафию.';
let aPoQuakat_ = 'по-Quakать.';
let aUguQSeicas = '"Угу, я сейчас!!!"';
let aNeIzviniMneGot = '"Не, извини, мне готовиться надо..."';
let aPosliOttqgivat = '"Пошли оттягиваться!"';
let aNuIZrq = '"Ну и зря!"';


async function invite_from_neighbor() {
  write(aKTebeLomitsqSo);
  writeln([aNaSvoiDenRojde, aNaDiskotekuVSa, aPoigratVMafiu_, aPoQuakat_][Random(4)]);

  dialog_start();
  dialog_case(aUguQSeicas, -1);
  dialog_case(aNeIzviniMneGot, -2);
  let res = await dialog_run(1, 0x0A);

  if (res === -1) {
    GotoXY(1, 0x0E);
    writeln(aPosliOttqgivat);

    for (let var_2 = 2, var_6 = Random(3) + 4; var_2 <= var_6; ++var_2) {
      await hour_pass();
      let subj = random_from_to(0, 5);
      hero.subject[subj].knowledge -=
          Random(Math.round(Math.sqrt(hero.subject[subj].knowledge * 2.0)));

      // #warning
      if (hero.subject[subj].knowledge < 0) {
        alert(hero.subject[subj].knowledge);
      }

      if (hero.charizma > Random(0x19)) {
        hero.health += Random(5) + 1;
      }
    }

    ++hero.charizma;

    if (hero.brain < 2) {
      hero.brain = Random(3) + 2;
    }

  } else if (res === -2) {
    GotoXY(1, 0x0E);
    writeln(aNuIZrq);
    hero.charizma -= Random(2) + 1;
  }

  await wait_for_key();
  ClrScr();
} // end function 12EB2


let aTebqNeumolimoK = 'Тебя неумолимо клонит ко сну ...';
let aTiVObsage_CtoD = 'Ты в общаге. Что делать?';
let aGotovitSq = 'Готовиться';
let aPosmotretRaspi = 'Посмотреть расписание';
let aOtdixat_0 = 'Отдыхать';
let aLecSpat = 'Лечь спать';
let aPoitiNaFakulTe = 'Пойти на факультет';
let aPoexatVPomi_1 = 'Поехать в ПОМИ';
let aPoitiVMavzol_0 = 'Пойти в мавзолей';
let aSMenqXvatit_1 = 'С меня хватит!';
let aCtoDelat = 'ЧТО ДЕЛАТЬ ???';


async function scene_obschaga() {
  show_header_stats();
  TextColor(7);
  GotoXY(1, 8);

  if (23 - idiv(clamp0(0x32 - hero.health), 0xC) < time_of_day || time_of_day < 4) {
    writeln(aTebqNeumolimoK);
    await wait_for_key();
    await goto_sleep();
    return;
  } else if (time_of_day > 0x11 && Random(0x0A) < 3 && !hero.is_invited) {
    hero.is_invited = 1;
    await invite_from_neighbor();
    return;
  }

  writeln(aTiVObsage_CtoD);
  dialog_start();
  dialog_case(aGotovitSq, -1);
  dialog_case(aPosmotretRaspi, -2);
  dialog_case(aOtdixat_0, -3);
  dialog_case(aLecSpat, -4);
  dialog_case(aPoitiNaFakulTe, -5);
  dialog_case(aPoexatVPomi_1, -6);
  dialog_case(aPoitiVMavzol_0, -7);
  dialog_case_colored(aSMenqXvatit_1, -8, 9);
  dialog_case_colored(aCtoDelat, -9, 9);
  show_short_today_timesheet(0x0A);

  const res = await dialog_run(1, 0x0A);
  if (res === -1) {
    await botva();
  } else if (res === -2) {
    await see_timesheet();
  } else if (res === -3) {
    await rest_in_obschaga();
  } else if (res === -4) {
    await try_sleep();
  } else if (res === -5) {
    goto_obschaga_to_punk();
  } else if (res === -6) {
    await goto_obschaga_to_pomi();
  } else if (res === -7) {
    goto_obschaga_to_mausoleum();
  } else if (res === -8) {
    await request_exit();
  } else if (res === -9) {
    await request_help(1);
  }
} // end function 1312F


function show_char_description(character, description) {
  TextColor(0x0E);
  write(character);
  TextColor(7);
  writeln(description);
} // end function 132D0


function output_colored_string(s) {
  for (let i = 1; i <= s.length; ++i) {
    let c = s.charCodeAt(i - 1);
    if (c >= 0 && c <= 0x0F) {
      TextColor(c);
    } else {
      write(s.substr(i - 1, 1));
    }
  }
  writeln();
} // end function 13339


async function select_help_page() {
  dialog_start();
  dialog_case(' А что вообще делать? ', -1);
  dialog_case(' Об экране            ', -10);
  dialog_case(' Куда и зачем ходить? ', -2);
  dialog_case(' О преподавателях     ', -3);
  dialog_case(' О персонажах         ', -4);
  dialog_case(' Об этой программе    ', -5);
  dialog_case(' Спасибо, ничего      ', -100);

  GotoXY(1, 0x0E);
  TextColor(7);
  writeln('Что тебя интересует?');

  let res = await dialog_run(1, 0x0F);
  if (res === -1) {
    help_page = 1;
  } else if (res === -2) {
    help_page = 3;
  } else if (res === -3) {
    help_page = 4;
  } else if (res === -4) {
    help_page = 5;
  } else if (res === -5) {
    help_page = 6;
  } else if (res === -10) {
    help_page = 2;
  } else if (res === -100) {
    help_page = 0;
  }
} // end function 1346B


function help_overview() {
  output_colored_string('\x07Есть всего \x0E6 дней\x07. За это время надо успеть получить \x0E6 зачетов\x07.');
  output_colored_string('Чтобы получить \x0Eзачет\x07, можно успешно сдать сколько-то \x0Eзаданий\x07.');
  output_colored_string('Чтобы сдать несколько заданий, можно чего-то знать и \x0Eприйти к преподу\x07.');
  output_colored_string('Чтобы чего-то знать, можно \x0Eготовиться\x07.');
  output_colored_string('Преподавателей надо искать по \x0Eрасписанию\x07.');
  output_colored_string('Пока готовишься или сдаешь, \x0Eсамочуствие\x07 ухудшается.');
  output_colored_string('Чтобы улучшить самочуствие, можно \x0Eотдыхать\x07.');
  output_colored_string('Всякие \x0Eдополнительные персонажи\x07 могут помогать, а могут мешать.');
  output_colored_string('\x0CАльтернативные варианты есть почти везде, но они тоже чего-то стоят\x07.');
} // end function 1375C


let aVLevomVerxnemU = '\x07В левом верхнем углу - игровые \x0Eдата\x07 и \x0Eвремя\x07,';
let aTvoeSostoqnieZ = '\x07твое состояние (\x0Eздоровье\x07, \x0Eкачества\x07), \x0Eденьги\x07.';
let aVPravomVerxnem = '\x07В правом верхнем углу - твои \x0Eнавыки\x07 по предметам.';
let aNavikiOcenivau = '\x07Навыки оцениваются двояко: по \x0E"общей шкале"\x07 (число)';
let aIPoSkaleTrebov = '\x07и по \x0Eшкале требований конкретного преподавателя\x07 ("оценка").';
let aNijeNavikovMin = '\x07Ниже навыков - мини-расписание на этот день + сданные задачи.';
let aPolnoeRaspisan = '\x07Полное расписание можно посмотреть в общаге (выбрать в меню).';
let aNakonecSlevaVN = '\x07Наконец, слева в нижней половине экрана - текущее меню.';
let aSostoqnieNavik = ' \x0AСОСТОЯНИЕ     \x0FНАВЫКИ';
let aSituaciq = ' \x0EСИТУАЦИЯ';
let aMenuRaspisanie = ' \x0BМЕНЮ          \x0CРАСПИСАНИЕ';


function help_screen() {
  output_colored_string(aVLevomVerxnemU);
  output_colored_string(aTvoeSostoqnieZ);
  output_colored_string(aVPravomVerxnem);
  output_colored_string(aNavikiOcenivau);
  output_colored_string(aIPoSkaleTrebov);
  output_colored_string(aNijeNavikovMin);
  output_colored_string(aPolnoeRaspisan);
  output_colored_string(aNakonecSlevaVN)
  writeln();
  output_colored_string(aSostoqnieNavik);
  output_colored_string(aSituaciq);
  output_colored_string(aMenuRaspisanie);
  writeln();
} // end function 139B9


let aVObsageTiGotov = '\x07В \x0Eобщаге\x07 ты готовишься и отдыхаешь.';
let aNaFakulTetePun = 'На \x0Eфакультете(~=ПУНК)\x07 ты бегаешь по преподам и ищешь приятелей.';
let aCtobiPopastVKo = 'Чтобы попасть в \x0Eкомпьюетрный класс\x07, надо прийти на факультет.';
let aVKompUternomKl = 'В компьютерном классе ты сдаешь зачет по информатике и ищешь друзей.';
let aMavzoleiAtoTak = '\x0EМавзолей\x07 - это такая столовая. Там ты отдыхаешь и ищешь приятелей.';
let aPomiPeterburgs = '\x0EПОМИ\x07 - Петербургское Отделение Математического Института РАН.';
let aVPomiTiBudesIs = 'В ПОМИ ты будешь искать преподов и приятелей.';
let aVPomiNadoExatN = 'В ПОМИ надо ехать на электричке, это занимает \x0E1 час\x07.';
let aEsliExatZaicem = 'Если ехать зайцем - то может оказаться, что и \x0E2 часа\x07.';
let aKromeTogoPoezd = 'Кроме того, \x0Cпоездка отнимает и здоровье тоже\x07.';


function help_places() {
  output_colored_string(aVObsageTiGotov);
  output_colored_string(aNaFakulTetePun);
  output_colored_string(aCtobiPopastVKo);
  output_colored_string(aVKompUternomKl);
  output_colored_string(aMavzoleiAtoTak);
  output_colored_string(aPomiPeterburgs);
  output_colored_string(aVPomiTiBudesIs);
  output_colored_string(aVPomiNadoExatN);
  output_colored_string(aEsliExatZaicem);
  output_colored_string(aKromeTogoPoezd);
} // end function 13C75


let aVsemirnovM_a_A = 'Всемирнов М.А., алгебра';
let aOcenSerEzniiIV = ' - очень серьезный и весьма строгий.';
let aDubcovE_s_Mata = 'Дубцов Е.С., матан';
let aNeOcenStrogiiI = ' - не очень строгий и с некоторой халявой.';
let aPodkoritovS_s_ = 'Подкорытов С.С., геометрия';
let aZamesaetDutkev = ' - замещает Дуткевича Ю.Г.. Почти без проблем.';
let aKlimovA_a_Info = 'Климов А.А., информатика';
let aBezProblemNoTr = ' - без проблем, но трудно найти.';
let aVlasenkoN_p_En = 'Влащенко Н.П., English';
let aBezProblemNoSN = ' - без проблем, но с некоторым своеобразием.';
let aAlBinskiiE_g_F = 'Альбинский Е.Г., Физ-ра';
let aBezProblemNoOt = ' - без проблем, но от физ-ры сильно устаешь.';


function help_professors() {
  show_char_description(aVsemirnovM_a_A, aOcenSerEzniiIV);
  show_char_description(aDubcovE_s_Mata, aNeOcenStrogiiI);
  show_char_description(aPodkoritovS_s_, aZamesaetDutkev);
  show_char_description(aKlimovA_a_Info, aBezProblemNoTr);
  show_char_description(aVlasenkoN_p_En, aBezProblemNoSN);
  show_char_description(aAlBinskiiE_g_F, aBezProblemNoOt);
} // end function 13E5C


let aDiamond = 'Diamond';
let aAvtorIgriGeroi = ' - автор игры "Герои Мата и Меха" (MMHEROES), знает всё о ее "фичах".';
let aMisa = 'Миша';
let aKogdaToAlFaTes = ' - когда-то альфа-тестер; понимает в стратегии получения зачетов.';
let aSerj = 'Серж';
let aEseOdinAksAlFa = ' - еще один экс-альфа-тестер и просто хороший товарищ.';
let aPasa = 'Паша';
let aStarosta_Samii = ' - староста. Самый нужный в конце семестра человек.';
let aRai = 'RAI';
let aProstoiStudent = ' - простой студент. Не любит, когда кто-то НЕ ХОЧЕТ ему помогать.';
let aAndru = 'Эндрю';
let aToJeStudent_Mo = ' - то же студент. Можно попробовать обратиться к нему за помощью.';
let aSasa = 'Саша';
let aEseOdinStudent = ' - еще один студент; подробно и разборчиво конспектирует лекции.';
let aNil = 'NiL';
let aDevuskaIzVolNo = ' - девушка из вольнослушателей. Часто эксплуатирует чужие мозги.';
let aKolq = 'Коля';
let aStudentBolSoiL = ' - студент, большой любитель алгебры и выпивки.';
let aGrisa = 'Гриша';
let aStudentPofigis = ' - студент-пофигист. Любит пиво и халяву.';
let aKuzMenkoV_g_ = 'Кузьменко В.Г.';
let aPrepodaetInfor = ' - преподает информатику у другой половины 19-й группы.';
let aDjug = 'DJuG';
let aUgadaiteKto = ' - угадайте, кто ;)';


function help_characters() {
  show_char_description(aDiamond, aAvtorIgriGeroi);
  show_char_description(aMisa, aKogdaToAlFaTes);
  show_char_description(aSerj, aEseOdinAksAlFa);
  show_char_description(aPasa, aStarosta_Samii);
  show_char_description(aRai, aProstoiStudent);
  show_char_description(aAndru, aToJeStudent_Mo);
  show_char_description(aSasa, aEseOdinStudent);
  show_char_description(aNil, aDevuskaIzVolNo);
  show_char_description(aKolq, aStudentBolSoiL);
  show_char_description(aGrisa, aStudentPofigis);
  show_char_description(aKuzMenkoV_g_, aPrepodaetInfor);
  show_char_description(aDjug, aUgadaiteKto);
} // end function 1419D


let aCrwmmDevelopme = '\x0FCrWMM Development Team:\x07';
let aDmitriiPetrovA = '\x0EДмитрий Петров (aka Diamond)\x07 - автор идеи, главный программист';
let aKonstantinBule = '\x0EКонстантин Буленков \x07- портирование';
let aVanqPavlikTest = '\x0EВаня Павлик \x07- тестирование, веб-страничка';
let aAlekseiRumqnce = '\x0EАлексей Румянцев (aka RAI) \x07- retired веб-мастер';
let aMnenieAvtorovN = '\x07Мнение авторов не всегда совпадает с высказываниями персонажей.';
let aEsliZapustitMm = '\x0BЕсли запустить \x0Fmmheroes\x0B с хоть каким параметром, у тебя будет возможность';
let aVibratLicniiPr = 'выбрать личный профиль своего "героя"; например,';
let aMmheroesZ11 = '           \x0Ammheroes z#11';
let aPoqvitsqMenusk = '\x0BПоявится менюшка, в которой все и так ясно.';


function help_about() {
  output_colored_string(aCrwmmDevelopme);
  writeln();
  output_colored_string(aDmitriiPetrovA);
  output_colored_string(aKonstantinBule);
  output_colored_string(aVanqPavlikTest);
  output_colored_string(aAlekseiRumqnce);
  output_colored_string(aMnenieAvtorovN);
  writeln();
  output_colored_string(aEsliZapustitMm);
  output_colored_string(aVibratLicniiPr);
  output_colored_string(aMmheroesZ11);
  output_colored_string(aPoqvitsqMenusk);
} // end function 1442E


async function request_help(page) {
  help_page = page;
  while (help_page) {
    ClrScr();
    [help_overview, help_screen, help_places, help_professors, help_characters, help_about][help_page - 1]();
    await select_help_page();
  }
} // end function 144A1


function goto_punk_to_obschaga() {
  current_subject = -1;
  current_place = 4;
} // end function 14500


let aZdraviiSmisl_1 = 'Здравый смысл подсказывает тебе, что в такое время';
let aTiTamNikogoU_1 = 'ты там никого уже не найдешь.';
let aNeBudemZrqTr_1 = 'Не будем зря тратить здоровье на поездку в ПОМИ.';
let aVAlektrickeN_1 = 'В электричке нашли бездыханное тело.';
let aDenegUTebqNe_1 = 'Денег у тебя нет, пришлось ехать зайцем...';
let aTebqZalovili_1 = 'Тебя заловили контролеры!';
let aVisadiliVKra_1 = 'Высадили в Красных зорях, гады!';
let aKontroleriJi_1 = 'Контролеры жизни лишили.';
let aUfDoexal_1 = 'Уф, доехал!';
let aExatZaicem_1 = 'Ехать зайцем';
let aCestnoZaplat_1 = 'Честно заплатить 10 руб. за билет в оба конца';


async function goto_punk_or_mausoleum_to_pomi() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);

  if (time_of_day > 20) {
    writeln(aZdraviiSmisl_1);
    writeln(aTiTamNikogoU_1);
    writeln(aNeBudemZrqTr_1);
    await wait_for_key();
    return;
  }

  hero.health -= Random(0x0A);
  if (hero.health <= 0) {
    is_end = 1;
    death_cause = aVAlektrickeN_1;
  }

  current_place = 2;

  if (hero.money < 0x0A) {

    writeln(aDenegUTebqNe_1);
    if (hero.charizma < Random(0x0A)) {
      writeln(aTebqZalovili_1);
      writeln(aVisadiliVKra_1);
      hero.health -= 0xA;
      if (hero.health <= 0) {
        is_end = 1;
        death_cause = aKontroleriJi_1;
      }
      await hour_pass();
    } else {
      writeln(aUfDoexal_1);
    }

  } else {

    dialog_start();
    dialog_case(aExatZaicem_1, -1);
    dialog_case(aCestnoZaplat_1, -2);
    let res = await dialog_run(1, 0x0C);

    if (res === -1) {
      if (hero.charizma < Random(0x0A)) {
        GotoXY(1, 0x0F);
        writeln(aTebqZalovili_1);
        writeln(aVisadiliVKra_1);
        await hour_pass();
      } else {
        GotoXY(1, 0x0F);
        writeln(aUfDoexal_1);
      }
    } else if (res === -2) {
      hero.money -= 10;
      hero.has_ticket = 1;
    }

  }

  await wait_for_key();
  await hour_pass();
} // end function 1467C


let aBolsaqRasscita = 'Болшая, рассчитанная на поток аудитория кажется забитой народом.';
let aZdesPrisutstvu = 'Здесь присутствуют не только твои одногруппники,';
let aNoIKakieToNeOc = 'но и какие-то не очень знакомые тебе люди';
let aKajetsqPriklad = '(кажется, прикладники со второго курса).';
let aZaStolomOkoloD = 'За столом около доски сидит М. А. Всемирнов';
let aIPrinimaetZace = 'и принимает зачет у студентов.';
let aTiResaesNeTerq = 'Ты решаешь не терять времени даром и присоединиться к остальным.';
let aTiZaxodisVNebo = 'Ты заходишь в небольшую аудиторию, забитую народом.';
let aOkoloDoskiSidi = 'Около доски сидит весьма своеобразный преподаватель.';
let aSieSvoebrazieP = 'Сие своебразие проявляется, в первую очередь, значком';
let aSNadpisUNeStre = 'с надписью: "НЕ СТРЕЛЯЕЙТЕ В ПРЕПОДА - ОБУЧАЕТ КАК УМЕЕТ".';
let aAViKKomu = '"А вы к кому? Максим Александрович в аудитории напротив!"';
let aPoxojeTiNeTuda = 'Похоже, ты не туда попал. Ты извиняешься и идешь к Всемирнову.';
let a____0 = '...';


async function show_intro_algebra() {
  ClrScr();
  TextColor(0x0A);

  if (ja(Random(3), 0)) {
    writeln(aBolsaqRasscita);
    writeln(aZdesPrisutstvu);
    writeln(aNoIKakieToNeOc);
    writeln(aKajetsqPriklad);
    writeln(aZaStolomOkoloD);
    writeln(aIPrinimaetZace);
    writeln(aTiResaesNeTerq);
  } else {
    writeln(aTiZaxodisVNebo);
    writeln(aOkoloDoskiSidi);
    writeln(aSieSvoebrazieP);
    writeln(aSNadpisUNeStre);
    writeln(aAViKKomu);
    writeln(aPoxojeTiNeTuda);
  }

  writeln(a____0);
  await ReadKey();
  ClrScr();
} // end function 14B36


let aVObicnoiGruppo = 'В обычной "групповой" аудитории сидят около 15 человек.';
let aVCentreIxVnima = 'В центре их внимания находится Е.С. Дубцов,';
let aPrinimausiiZac = 'принимающий зачет по матанализу.';
let aTiPolucaesZada = 'Ты получаешь задание и садишься за свободную парту.';
let a____1 = '...';


async function show_intro_matan() {
  ClrScr();
  TextColor(0x0B);
  writeln(aVObicnoiGruppo);
  writeln(aVCentreIxVnima);
  writeln(aPrinimausiiZac);
  writeln(aTiPolucaesZada);
  writeln(a____1);
  await ReadKey();
  ClrScr();
} // end function 14D55


let aNebolSaqPolupu = 'Небольшая, полупустая аудитория.';
let aIDoskaISteniIP = 'И доска, и стены, и, похоже, даже пол';
let aIspisaniRazlic = 'исписаны различными геометрическими утверждениями.';
let aVCentreVsegoAt = 'В центре всего этого хаоса находится';
let aIliSkoreePosto = '(или, скорее, постоянно перемещается)';
let aPodkoritovMlad = 'Подкорытов-младший.';
let aTiRaduesSqCtoS = 'Ты радуешься, что смог застать его на факультете!';
let a____2 = '...';


async function show_intro_git() {
  ClrScr();
  TextColor(9);
  writeln(aNebolSaqPolupu);
  writeln(aIDoskaISteniIP);
  writeln(aIspisaniRazlic);
  writeln(aVCentreVsegoAt);
  writeln(aIliSkoreePosto);
  writeln(aPodkoritovMlad);
  writeln(aTiRaduesSqCtoS);
  writeln(a____2);
  hero.health += 5
  await ReadKey();
  ClrScr();
} // end function 14EEF


let aNaTretEmAtajeU = 'На третьем этаже учебного корпуса Мат-Меха';
let aVOdnoiIzAudito = 'в одной из аудиторий, закрепленных за кафедрой иностранных языков,';
let aRaspolojilasN_ = 'расположилась Н.П. Влащенко.';
let aSteniKabinetaV = 'Стены кабинета выглядят как-то странно.';
let aRqdomSNebolSoi = 'Рядом с небольшой доской висит изображение Эйфелевой башни,';
let aCutDalSeStrann = 'чуть дальше - странное изображение,';
let aObladauseeNepo = 'обладающее непостижимым метафизическим смыслом.';
let aPoxojeSeicasTi = 'Похоже, сейчас ты будешь сдавать зачет по английскому.';
let a____3 = '...';


async function show_intro_english() {
  ClrScr();
  TextColor(0x0E);
  writeln(aNaTretEmAtajeU);
  writeln(aVOdnoiIzAudito);
  writeln(aRaspolojilasN_);
  writeln(aSteniKabinetaV);
  writeln(aRqdomSNebolSoi);
  writeln(aCutDalSeStrann);
  writeln(aObladauseeNepo);
  writeln(aPoxojeSeicasTi);
  writeln(a____3);
  await ReadKey();
  ClrScr();
} // end function 1513F


let aAlBinskiiProvo = 'Альбинский проводит лекцию о пользе бега';
let aDlqNarodnogoXo = 'для народного хозяйства.';
let aDlqLicnoiJizni = 'для личной жизни.';
let aDlqNaucnoiRabo = 'для научной работы.';
let aDlqKommunistic = 'для коммунистического строительства.';
let aDlqUcebiIDosug = 'для учебы и досуга.';
let aDlqSpaseniqOtK = 'для спасения от контроллеров.';
let aPoxojeOnKakVse = 'Похоже, он, как всегда, немного увлекся.';
let aNemnogoVNasemS = 'Немного в нашем случае - 1 час.';


async function show_intro_fizra_lecture() {
  writeln(aAlBinskiiProvo);
  writeln([aDlqNarodnogoXo, aDlqLicnoiJizni, aDlqNaucnoiRabo, aDlqKommunistic, aDlqUcebiIDosug, aDlqSpaseniqOtK][Random(6)]);
  ++timesheet[day_of_week][Fizra].to;
  writeln();
  writeln(aPoxojeOnKakVse);
  writeln(aNemnogoVNasemS);
  writeln();
  await hour_pass();
} // end function 1532A


let aAlBinskiiProsi = 'Альбинский просит тебя замерить пульс.';
let aNazvavPervoePr = 'Назвав первое пришедшее в замученную математикой голову число,';
let aTiOtpravlqesSq = 'ты отправляешься мотать круги в парке,';
let aVKotoromVoobse = 'в котором, вообще-то, "запрещены спортивные мероприятия".';
let a____4 = '...';


async function show_intro_fizra() {
  ClrScr();
  TextColor(0x0F);
  if (Random(3) === 0) {
    await show_intro_fizra_lecture();
  }
  writeln(aAlBinskiiProsi);
  writeln(aNazvavPervoePr);
  writeln(aTiOtpravlqesSq);
  writeln(aVKotoromVoobse);
  writeln(a____4);
  await ReadKey();
  ClrScr();
} // end function 15514


async function goto_exam_with_intro(exam) {
  if (exam === 0) {
    await show_intro_algebra();
  } else if (exam === 1) {
    await show_intro_matan();
  } else if (exam === 2) {
    await show_intro_git();
  } else if (exam === 4) {
    await show_intro_english();
  } else if (exam === 5) {
    await show_intro_fizra();
  }
} // end function 155AF


async function select_professor_punk() {
  show_header_stats();
  TextColor(7);
  GotoXY(1, 8);
  writeln('Ты сейчас на факультете. К кому идти?');

  dialog_start();
  for (let i = 0; i <= 5; ++i) {
    if (is_professor_here(i)) {
      dialog_case(subjects[i].professor.name, i);
    }
  }
  dialog_case('Ни к кому', -1);
  current_subject = await dialog_run(1, 0x0A);

  if (Random(2) === 0) {
    await goto_exam_with_intro(current_subject);
  }
} // end function 15623


async function look_baobab_punk() {
  await show_top_gamers();
} // end function 156B8


let aUmerPoPutiVM_1 = 'Умер по пути в мавзолей.';


function goto_punk_to_mausoleum() {
  current_subject = -1;
  current_place = 5;
  decrease_health(3, aUmerPoPutiVM_1);
} // end function 156DB


function goto_punk_to_kompy() {
  current_place = 3;
  current_subject = -1;
  decrease_health(2, 'Упал с лестницы у главного входа.');
} // end function 15719


let aIk = ' <йк> ';


function output_ik_string(s) {
  let terkom_line = [0xA, 0xE, 0x10, 0x12];
  let iks = 5 - _upper_bound(terkom_line, time_of_day);

  for (let i = 1; i <= s.length; ++i) {
    if (s[i - 1] === ' ' && Random(iks) === 0) {
      write(aIk);
      --iks;
      if (iks < 1) {
        iks = 2;
      }
    } else {
      write(s[i - 1]);
    }
  }

} // end function 1573C


let aSkazanoJeNetSv = '"Сказано же, нет свободных компов!"';
let aIzviniParenSvo = '"Извини, парень, свободных кумпутеров нет.';
let aPoidiPoucisPok = 'Пойди поучись пока."';
let aTiSidisZaSvobo = 'Ты сидишь за свободным компом';
let aVTerexovskoiKo = 'в тереховской "конторе".';
let aCtoDelatBudem = 'Что делать будем?';
let aSidetIZarabati = 'Сидеть и зарабатывать деньги';
let aPoigratVMmhe_0 = 'Поиграть в MMHEROES';
let aPosidetCasokVI = 'Посидеть часок в Inet\'e';
let aViitiOtsudaNaS = 'Выйти отсюда на "свежий воздух"';
let aTebeNakapalo = 'Тебе накапало ';
let aRub__0 = ' руб.';
let aSgorelNaRabote = 'Сгорел на работе.';
let aUxodim___ = 'Уходим ...';
let aPoNeizvestnoiP = 'По неизвестной причине, в помещении ТЕРКОМА';
let aMmheroesNeOkaz = 'MMHEROES не оказывают никакого метафизического воздействия';
let aNaOkrujausiiMi = 'на окружающий мир...';
let aOglqdevsisVo_0 = 'Оглядевшись вокруг, ты обнаруживаешь,';
let aCtoVseTovarisi = 'что все товарищи, здесь собравшиеся,';
let aRubqtsqVMmhero = 'РУБЯТСЯ В MMHEROES!';
let aVozmojnoOniVse = 'Возможно, они все пытаются халявить,';
let aPitautsqIgratP = 'пытаются играть по "тривиальному" алгоритму,';
let aKotoriiSrabati = 'который срабатывает, увы, далеко, не всегда...';
let aVotZdorovoMiSi = 'Вот здорово - мы сидим, а денежки-то идут!';
let aRabociiDenZako = 'Рабочий день закончился, все по домам.';


// =============================================================================


async function sub_15B3A() {
  let var_2;

  if (!jnz(terkom_has_places, 0)) {
    ClrScr();
    show_header_stats();
    GotoXY(1, 8);
    TextColor(0x0B);
    output_ik_string(aSkazanoJeNetSv);
    writeln();
    await wait_for_key();
    ClrScr();
    return;
  }

  if (!jbe(Random(3), 0)) {
    ClrScr();
    show_header_stats();
    GotoXY(1, 8);
    TextColor(0x0A);
    output_ik_string(aIzviniParenSvo);
    writeln();
    output_ik_string(aPoidiPoucisPok);
    writeln();
    terkom_has_places = 0;
    await wait_for_key();
    ClrScr();
    return;
  }

  do {
    ClrScr();
    show_header_stats();
    GotoXY(1, 8);
    writeln(aTiSidisZaSvobo);
    writeln(aVTerexovskoiKo);
    writeln(aCtoDelatBudem);
    dialog_start();
    dialog_case(aSidetIZarabati, -1);

    if (!jz(hero.has_mmheroes_disk, 0)) {
      dialog_case(aPoigratVMmhe_0, -10);
    }

    if (!jz(hero.has_inet, 0)) {
      dialog_case(aPosidetCasokVI, -11);
    }

    dialog_case(aViitiOtsudaNaS, -2);
    show_short_today_timesheet(8);

    let ax = await dialog_run(1, 0x0C);
    if (jz(ax, -1)) {

      var_2 = Random(Random(hero.charizma + hero.brain)) + 1;

      while (!jle(var_2, 4)) {
        var_2 = Random(var_2 - 3) + 2;
      }

      TextColor(7);
      GotoXY(1, 0x13);
      output_ik_string(aTebeNakapalo);
      TextColor(0x0F);

      write(var_2);

      TextColor(7);
      writeln(aRub__0);

      hero.money += var_2;
      decrease_health(Random(var_2 * 2), aSgorelNaRabote);
      await wait_for_key();
      await hour_pass();

    } else if (!jnz(ax, -2)) {
      GotoXY(1, 0x11);
      output_ik_string(aUxodim___);
      writeln();
      await wait_for_key();
      ClrScr();
      return;
    } else if (jz(ax, -10)) {
      ClrScr();
      TextColor(0x0B);
      output_ik_string(aPoNeizvestnoiP);
      writeln();
      output_ik_string(aMmheroesNeOkaz);
      writeln();
      output_ik_string(aNaOkrujausiiMi);
      writeln();
      await ReadKey();
      output_ik_string(aOglqdevsisVo_0);
      writeln();
      output_ik_string(aCtoVseTovarisi);
      writeln();
      writeln(aRubqtsqVMmhero);
      output_ik_string(aVozmojnoOniVse);
      writeln();
      output_ik_string(aPitautsqIgratP);
      writeln();
      output_ik_string(aKotoriiSrabati);
      writeln();
      writeln();
      await wait_for_key();
      ClrScr();
    } else if (jz(ax, -11)) {

      GotoXY(1, 0x13);
      writeln(aVotZdorovoMiSi);

      var_2 = Random(Random(hero.charizma + hero.brain)) + 1;

      while (!jle(var_2, 4)) {
        var_2 = Random(var_2 - 3) + 2;
      }

      TextColor(7);
      GotoXY(1, 0x14);
      output_ik_string(aTebeNakapalo);
      TextColor(0x0F);
      write(var_2);
      TextColor(7);
      writeln(aRub__0);
      hero.money += var_2;
      await wait_for_key();
      await hour_pass();
    }
  } while (!jg(time_of_day, 0x12));

  GotoXY(1, 0x14);
  output_ik_string(aRabociiDenZako);
  await wait_for_key();

} // end function 15B3A


let aCtoBratBudem = 'Что брать будем?';
let aCaiZa2R_ = 'Чай за 2 р.';
let aKeksZa4R_ = 'Кекс за 4 р.';
let aCaiIVipecku6R_ = 'Чай и выпечку, 6 р.';
let aProstoPosijuSP = 'Просто посижу с приятелями.';
let aQVoobseZrqSuda = 'Я вообще зря сюда зашел.';


async function sub_15F9B() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  writeln(aCtoBratBudem);
  show_short_today_timesheet(0x0B);
  dialog_start();

  if (!jl(hero.money, 2)) {
    dialog_case(aCaiZa2R_, -1);
  }

  if (!jl(hero.money, 4)) {
    dialog_case(aKeksZa4R_, -2);
  }

  if (!jl(hero.money, 6)) {
    dialog_case(aCaiIVipecku6R_, -3);
  }

  dialog_case(aProstoPosijuSP, -4);
  dialog_case(aQVoobseZrqSuda, 0);
  let ax = await dialog_run(1, 0x0B);

  if (!jnz(ax, -1)) {
    hero.money -= 2;
    hero.health += Random(hero.charizma) + 2;
  } else if (!jnz(ax, -2)) {
    hero.money -= 4;
    hero.health += Random(hero.charizma) + 4;
  } else if (!jnz(ax, -3)) {
    hero.money -= 6;
    hero.health += Random(hero.charizma) + 7;
  } else if (!jnz(ax, -4)) {
    hero.health += Random(hero.charizma);
  } else if (!jnz(ax, 0)) {
    return;
  }

  await hour_pass();
} // end function 15F9B


async function scene_punk() {
  show_header_stats();
  TextColor(7);
  show_short_today_timesheet(0x0A);
  GotoXY(1, 8);
  writeln('Ты на факультете. Что делать?');
  dialog_start();
  dialog_case('Идти к преподу', -1);
  dialog_case('Посмотреть на баобаб', -2);
  dialog_case('Пойти в общагу', -3);
  dialog_case('Поехать в ПОМИ', -4);
  dialog_case('Пойти в мавзолей', -5);

  if (!jge(time_of_day, 0x14)) {
    dialog_case('Пойти в компьютерный класс', -7);
  }

  if (!jl(time_of_day, 0x0A) && !jg(time_of_day, 0x12)) {
    dialog_case('Сходить в кафе', -12);
  }

  for (let var_2 = 0; var_2 <= 0xB; ++var_2) {
    if (!(classmates[var_2].place !== 1)) {
      if (!(classmates[var_2].current_subject !== -1)) {
        dialog_case_colored(classmate_names[var_2], var_2, 0xE);
      }
    }
  }

  if (!jz(hero.is_working_in_terkom, 0) && !jg(time_of_day, 0x12)) {
    dialog_case('Пойти в ТЕРКОМ, поработать', -10);
  }

  dialog_case_colored('С меня хватит!', -6, 9);

  const res = await dialog_run(1, 0x0A);

  if (res === -1) {
    await select_professor_punk();
  } else if (res === -2) {
    await look_baobab_punk();
  } else if (res === -3) {
    goto_punk_to_obschaga();
  } else if (res === -4) {
    await goto_punk_or_mausoleum_to_pomi();
  } else if (res === -5) {
    goto_punk_to_mausoleum();
  } else if (res === -6) {
    await request_exit();
  } else if (res === -7) {
    goto_punk_to_kompy();
  } else if (res === -10) {
    await sub_15B3A();
  } else if (res === -12) {
    await sub_15F9B();
  } else if (!jl(res, 0) && !jg(res, 0x0B)) {
    await talk_with_classmate(res);
  }

} // end function 16167


let aMalenKiiKabine = 'Маленький кабинет в ПОМИ заполнен людьми.';
let aIKakNiStrannoP = 'И, как ни странно, почти все они хотят одного и того же.';
let aPoxojeTiTojeXo = 'Похоже, ты тоже хочешь именно этого -';
let aRazdelatSqNako = 'РАЗДЕЛАТЬСЯ НАКОНЕЦ С ЗАЧЕТОМ ПО АЛГЕБРЕ!';
let a____5 = '...';


async function sub_163B7() {
  ClrScr();
  TextColor(0x0C);
  writeln(aMalenKiiKabine);
  writeln(aIKakNiStrannoP);
  writeln(aPoxojeTiTojeXo);
  writeln(aRazdelatSqNako);
  writeln(a____5);
  await ReadKey();
  ClrScr();
} // end function 163B7


let aVNebolSomPomis = 'В небольшом ПОМИшном кабинете собралось человек 10 студентов.';
let aKromeNixVKomna = 'Кроме них, в комнате ты видишь Подкорытова-младшего,';
let aATakjePolnogoS = 'а также - полного седоволосого лысеющего господина,';
let aIzdausegoXarak = 'издающего характерные пыхтящие звуки.';
let aTiNadeesSqCtoV = 'Ты надеешься, что все это скоро кончится...';
let a____6 = '...';


async function sub_1653F() {
  ClrScr();
  writeln(aVNebolSomPomis);
  writeln(aKromeNixVKomna);
  writeln(aATakjePolnogoS);
  writeln(aIzdausegoXarak);
  writeln(aTiNadeesSqCtoV);
  writeln(a____6);
  await ReadKey();
  ClrScr();
} // end function 1653F


async function sub_165D9(arg_0) {
  if (arg_0 === 0) {
    await sub_163B7();
  } else if (arg_0 === 2) {
    await sub_1653F();
  }
} // end function 165D9


let aTiSeicasVPomi_ = 'Ты сейчас в ПОМИ. К кому идти?';
let aNiKKomu_0 = 'Ни к кому';


async function sub_16622() {
  show_header_stats();
  TextColor(7);
  GotoXY(1, 8);
  writeln(aTiSeicasVPomi_);
  dialog_start();

  for (let var_2 = 0; var_2 <= 5; ++var_2) {

    if (!jz(is_professor_here(var_2), 0)) {
      dialog_case(subjects[var_2].professor.name, var_2);
    }
  }

  dialog_case(aNiKKomu_0, -1);
  current_subject = await dialog_run(1, 0x0A);

  if (!jnz(Random(2), 0)) {
    await sub_165D9(current_subject);
  }
} // end function 16622


async function look_board_pomi() {
  await show_top_gamers();
} // end function 166B7


let aCtoBratBudem_0 = 'Что брать будем?';
let aKofeZa2R_ = 'Кофе за 2 р.';
let aKorjZa4R_ = 'Корж за 4 р.';
let aKofeIVipecku6R = 'Кофе и выпечку, 6 р.';
let aNicegoProstoPr = 'Ничего, просто просидеть здесь часок.';
let aSovsemNicego_B = 'Совсем ничего. Бывает.';


async function sub_1673E() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  writeln(aCtoBratBudem_0);
  show_short_today_timesheet(0x0A);
  dialog_start();

  if (!jl(hero.money, 2)) {
    dialog_case(aKofeZa2R_, -1);
  }

  if (!jl(hero.money, 4)) {
    dialog_case(aKorjZa4R_, -2);
  }

  if (!jl(hero.money, 6)) {
    dialog_case(aKofeIVipecku6R, -3);
  }

  dialog_case(aNicegoProstoPr, -4);
  dialog_case(aSovsemNicego_B, 0);

  let ax = await dialog_run(1, 0x0A);
  if (ax === -1) {
    hero.money -= 2;
    hero.health += Random(hero.charizma) + 3;
  } else if (ax === -2) {
    hero.money -= 4;
    hero.health += Random(hero.charizma) + 6;
  } else if (ax === -3) {
    hero.money -= 6;
    hero.health += Random(hero.charizma) + 0x0A;
  } else if (ax === -4) {
    hero.health += Random(hero.charizma);
  } else if (ax === 0) {
    return;
  }

  await hour_pass();
} // end function 1673E


let aEdemVPunkBilet = 'Едем в ПУНК, билета нет. Будем покупать билет (5 рублей)?';
let aDaBudem = 'Да, будем';
let aNetNeBudem = 'Нет, не будем';
let aVAlektrickeN_2 = 'В электричке нашли бездыханное тело.';
let aEdemZaicem___ = 'Едем зайцем... ';
let aKontroleriPoim = 'Контролеры поймали! Высадили в Красных Зорях!';
let aKontroleriJi_2 = 'Контролеры жизни лишили.';


async function sub_16914() {

  if (!hero.has_ticket && hero.money >= 5) {
    ClrScr();
    show_header_stats();
    show_short_today_timesheet(0x0A);
    GotoXY(1, 8);
    TextColor(0x0E);
    writeln(aEdemVPunkBilet);
    dialog_start();
    dialog_case(aDaBudem, -1);
    dialog_case(aNetNeBudem, -2);
    let ax = await dialog_run(1, 0x0A);

    if (!jnz(ax, -1)) {
      hero.money -= 5
      hero.has_ticket = 1;
    }
  }

  decrease_health(Random(0x0A), aVAlektrickeN_2);
  current_place = 1;

  if (!hero.has_ticket) {
    GotoXY(1, 0x16);
    write(aEdemZaicem___);

    if (hero.charizma < Random(0x0A)) {
      writeln(aKontroleriPoim);
      decrease_health(0x0A, aKontroleriJi_2);
    }

    await wait_for_key();
    await hour_pass();
    // #warning return here?
  }

  await hour_pass();
  hero.has_ticket = 0;
} // end function 16914


let aTiVPomi_CtoDel = 'Ты в ПОМИ. Что делать?';
let aIdtiKPrepodu_0 = 'Идти к преподу';
let aPosmotretNaDos = 'Посмотреть на доску объявлений';
let aPoitiVKafe = 'Пойти в кафе';
let aPoexatVPunk = 'Поехать в ПУНК';
let aSMenqXvatit_3 = 'С меня хватит!';


async function scene_pomi() {
  show_header_stats();
  TextColor(7);
  GotoXY(1, 8);
  writeln(aTiVPomi_CtoDel);
  dialog_start();
  dialog_case(aIdtiKPrepodu_0, -1);
  dialog_case(aPosmotretNaDos, -2);
  dialog_case(aPoitiVKafe, -3);
  dialog_case(aPoexatVPunk, -4);

  for (let var_2 = 0; var_2 <= 0xB; ++var_2) {
    if (classmates[var_2].place === 2 && classmates[var_2].current_subject === -1) {
      dialog_case_colored(classmate_names[var_2], var_2, 0xE);
    }
  }

  dialog_case_colored(aSMenqXvatit_3, -5, 9);
  show_short_today_timesheet(0x0A);

  const res = await dialog_run(1, 0x0A);

  if (res === -1) {
    await sub_16622();
  } else if (res === -2) {
    await look_board_pomi();
  } else if (res === -3) {
    await sub_1673E();
  } else if (res === -4) {
    await sub_16914();
  } else if (res === -5) {
    await request_exit();
  } else if (!jl(res, 0) && !jg(res, 0x0B)) {
    await talk_with_classmate(res);
  }

} // end function 16A91


let aMmheroes_hi = 'mmheroes.hi';
let aKolq_0 = 'Коля';
let aSasa_0 = 'Саша';
let aAndru_0 = 'Эндрю';
let aPasa_0 = 'Паша';
let aGrisa_0 = 'Гриша';


function read_top_gamers() {
  /*
	let var_82;
	let var_80;

	Assign(var_80, aMmheroes_hi);
	Reset(var_80, 0x23);

	if (!jz(IOResult(), 0)) {

		top_gamers[0].name = aKolq_0; // по 0x20 байт на каждую строку
		top_gamers[0].score = 0x190;
		top_gamers[1].name = aSasa_0;
		top_gamers[1].score = 0x118;
		top_gamers[2].name = aAndru_0;
		top_gamers[2].score = 0x0B4;
		top_gamers[3].name = aPasa_0;
		top_gamers[3].score = 0x64;
		top_gamers[4].name = aGrisa_0;
		top_gamers[4].score = 0x14;
		return;
	}

	for (var_82 = 0; var_82 <= 4; ++var_82) {
		top_gamers[var_82] = Read(var_80);
	}

	Close(var_80);
*/
} // end function 16BD7


let aTiPopalVSkrija = 'Ты попал в скрижали Мат-Меха! Сейчас тебя будут увековечивать!';
let aNeBoisqAtoNeBo = 'Не бойся, это не больно.';
let aKakTebqZovutGe = 'Как тебя зовут, герой? ';
let aNeXocesUvekove = 'Не хочешь увековечиваться - не надо!';
let aNuVotIVse_ = 'Ну, вот и все.';


function update_top_gamers(score) {
  let var_108;
  let var_106;
  let my_place = -1;

  /*
	for (let i = 4; i >= 0; --i) {
		if (top_gamers[i].score >= score) {
			my_place = i;
			break;
		}
	}

	if (my_place === 4) {
		return;
	}
	*/

  TextColor(0x0F);
  writeln('********************** ПОЗДРАВЛЯЮ! ***************************');
  writeln(aTiPopalVSkrija);
  writeln(aNeBoisqAtoNeBo);
  writeln();
  write(aKakTebqZovutGe);
  TextColor(0x0A);
  let my_name = readln();

  if (my_name.length === 0) {
    TextColor(0x0F);
    writeln();
    writeln(aNeXocesUvekove);
    return;
  }

  set_user_name(my_name);

  /*
	++my_place;
	if (my_place <= 3) {
		for (let i = 3; i >= my_place; --i) {
			top_gamers[i + 1] = top_gamers[i];
		}
	}

	top_gamers[my_place] = {name: my_name, score: score};
	*/

  writeln();
  TextColor(0x0F);
  writeln(aNuVotIVse_);
  writeln();
} // end function 16D8E


let aMmheroes_hi_0 = 'mmheroes.hi';


function write_top_gamers() {
  /*
	let var_82;
	let var_80;

	Assign(var_80, aMmheroes_hi_0);
	Rewrite(var_80, 0x23);

	for (var_82 = 0; var_82 <= 4; ++var_82) {
		Write(var_80, top_gamers[var_82]);
	}

	Close(var_80);
*/
} // end function 16F39


let asc_16F8F = '******                                           ******';
let asc_16FC7 = '      *********                         *********';
let asc_16FF9 = '               *************************';
let aVotImenaTexKto = 'Вот имена тех, кто прошел это наводящее ужас испытание:';
let aGeroiZarabotal = '    ГЕРОЙ            ЗАРАБОТАЛ';
let aRub__1 = ' руб.';


async function show_top_gamers() {
  ClrScr();
  TextColor(0x0F);
  writeln(asc_16F8F);
  writeln(asc_16FC7);
  writeln(asc_16FF9);
  TextColor(0x0E);
  writeln(aVotImenaTexKto);
  writeln();
  writeln(aGeroiZarabotal);

  for (let i = 0; i < top_gamers.length; ++i) {
    TextColor(0x0F);
    GotoXY(4, i + 7)
    write(top_gamers[i].name);
    GotoXY(0x19, i + 7);
    write(top_gamers[i].score);
    write(aRub__1);
  }

  GotoXY(1, 0x14);
  TextColor(7);
  await wait_for_key();
} // end function 1707F


let aZaderjivaetsqE = ' задерживается еще на час.';
let aUxodit_ = ' уходит.';


async function sub_171C4() {
  if (hero.health <= 0) {
    return;
  }

  ClrScr();
  show_header_stats();
  GotoXY(1, 0x17);
  TextColor(0x0C);

  if (subjects[current_subject].member0xFA * 5 + time_of_day * 6 < hero.charizma * 3 + Random(0x3C) + 0x14) {

    write(subjects[current_subject].professor.name);
    write(aZaderjivaetsqE);
    timesheet[day_of_week][current_subject].to = time_of_day + 1;

  } else {

    write(subjects[current_subject].professor.name);
    write(aUxodit_);
    current_subject = -1;

  }

  await wait_for_key();
} // end function 171C4


let aUviPomiUjeZakr = 'Увы, ПОМИ уже закрыто, поэтому придется ехать домой...';
let aTiVPitereNaBal = 'Ты в Питере, на Балтийском вокзале.';
let aKudaNapravlqem = 'Куда направляемся?';
let aDomoiVPunk = 'Домой, в ПУНК!';
let aXocuVPomi = 'Хочу в ПОМИ!';
let aXorosoBiletEst = 'Хорошо, билет есть...';
let aTebqZalovili_2 = 'Тебя заловили контролеры!';
let aVisadiliVKra_2 = 'Высадили в Красных зорях, гады!';
let aKontroleriJi_3 = 'Контролеры жизни лишили.';
let aUfDoexal___ = 'Уф, доехал...';


async function sub_173B6() {
  let var_1;

  ClrScr();
  if (time_of_day > 20) {
    TextColor(0x0E);
    writeln(aUviPomiUjeZakr);
    var_1 = 4;
  } else {
    show_header_stats();
    current_subject = -1;
    GotoXY(1, 0x0C);
    TextColor(0x0B);
    writeln(aTiVPitereNaBal);
    writeln(aKudaNapravlqem);
    show_short_today_timesheet(0x0C);
    dialog_start();
    dialog_case(aDomoiVPunk, -1);
    dialog_case(aXocuVPomi, -2);
    var_1 = await dialog_run(1, 0x0F) === -1 ? 1 : 2;
  }

  if (jz(var_1, 1)) {
    GotoXY(1, 0x14);
    if (hero.has_ticket) {
      writeln(aXorosoBiletEst);
    } else if (hero.charizma < Random(0x0A)) {
      writeln(aTebqZalovili_2);
      writeln(aVisadiliVKra_2);
      decrease_health(0x0A, aKontroleriJi_3);
      await hour_pass();
      current_place = 1;
      await wait_for_key();
      ClrScr();
    } else {
      writeln(aUfDoexal___);
    }
    await hour_pass();
  }

  current_place = var_1;
} // end function 173B6


let aVsemirnovPrini = 'Всемирнов принимает зачет даже в электричке!';
let aMucaesSq___ = 'Мучаешься ...';
let aZamucil = ' замучил';
let aA = 'а';
let a_ = '.';
let aTvoiMuceniqBil = 'Твои мучения были напрасны.';
let aTebeZacliEse = 'Тебе зачли еще ';


async function sub_175A6() {
  let var_106;
  let var_6;
  let var_4;
  let var_2;

  ClrScr();
  show_header_stats();
  GotoXY(1, 0x0E);
  writeln(aVsemirnovPrini);
  TextColor(0x0D);
  writeln(aMucaesSq___);
  TextColor(7);
  writeln();

  var_6 = idiv((hero.subject[current_subject].knowledge - subjects[current_subject].member0xFA + Random(hero.brain)) * 3, 4);

  if (!jg(hero.health, 5)) {
    var_6 -= Random(5 - hero.health);
  }

  if (!jle(var_6, 0)) {
    var_6 = Round(Sqrt(var_6) / subjects[current_subject].member0x100);
  } else {
    var_6 = 0;
  }

  if (!jle(hero.subject[current_subject].tasks_done + var_6, subjects[current_subject].tasks)) {
    var_6 = subjects[current_subject].tasks - hero.subject[current_subject].tasks_done;
  }

  var_2 = Random(hero.stamina) - Random(subjects[current_subject].member0xFA);
  if (!jle(var_2, 0)) {
    var_2 = 0;
  }

  hero.subject[current_subject].knowledge += var_2;
  if (hero.subject[current_subject].knowledge < 0) {
    hero.subject[current_subject].knowledge = 0;
  }

  var_4 = Random(idiv(hero.stamina * 2, 3)) - subjects[current_subject].member0xFC;
  if (!jle(var_4, 0)) {
    var_4 = 0;
  }

  hero.health += var_4;
  if (hero.health <= 0) {
    is_end = 1;
    death_cause = subjects[current_subject].professor.name + aZamucil;
    if (!jnz(subjects[current_subject].professor.sex, 0)) {
      death_cause += aA;
    }
    death_cause += a_;
  } else {

    GotoXY(1, 0x15);

    if (var_6 === 0) {
      colored_output(0x0C, aTvoiMuceniqBil);
    } else {
      colored_output(0x0A, aTebeZacliEse);
      colored_output_white(var_6);
      TextColor(0x0A);
      zadanie_in_case(var_6);
      write('!');
      TextColor(7);
    }

    hero.subject[current_subject].tasks_done += var_6;
    await wait_for_key();
    await hour_pass();
  }

  await sub_173B6();
} // end function 175A6


let aM_a_Vsemirnov = 'М.А. Всемирнов :';
let aNetSegodnqQBol = '"Нет, сегодня я больше никому ничего не засчитаю..."';
let aUslisavAtuFraz = 'Услышав эту фразу, ты осознаешь беспочвенность своих мечтаний';
let aOSdaceZacetaPo = 'о сдаче зачета по алгебре в электричке.';
let aEstNadejdaCtoV = 'Есть надежда, что в электричке удастся что-то еще решить.';
let aPravdaZacetnoi = 'Правда, зачетной ведомости с собой туда не взять...';
let aDenegUTebqNe_2 = 'Денег у тебя нет, пришлось ехать зайцем...';
let aTebqZalovili_3 = 'Тебя заловили контролеры!';
let aVisadiliVKra_3 = 'Высадили в Красных зорях, гады!';
let aKontroleriJi_4 = 'Контролеры жизни лишили.';
let aExatZaicem_2 = 'Ехать зайцем';
let aCestnoZaplat_2 = 'Честно заплатить 10 руб. за билет в оба конца';
let aKontrolleriKon = 'Контроллеры, контроллеры, контроллеры...';
let aISoVsemirnovim = 'И со Всемирновым ты ничего не успел...';


async function sub_17AA2() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 0x0C);

  if (!jle(time_of_day, 0x14)) {
    TextColor(7);
    write(aM_a_Vsemirnov);
    TextColor(0x0F);
    writeln(aNetSegodnqQBol);
    TextColor(0x0E);
    writeln(aUslisavAtuFraz);
    writeln(aOSdaceZacetaPo);
    await wait_for_key();
    current_subject = -1;
    return;
  }

  TextColor(7);
  writeln(aEstNadejdaCtoV);
  writeln(aPravdaZacetnoi);

  if (jl(hero.money, 0x0A)) {

    TextColor(0x0C);
    writeln(aDenegUTebqNe_2);

    if (hero.charizma < Random(0x0A)) {

      TextColor(0x0D);
      writeln(aTebqZalovili_3);
      writeln(aVisadiliVKra_3);
      decrease_health(0x0A, aKontroleriJi_4);
      current_place = 1;
      await wait_for_key();
      ClrScr();
    }

  } else {

    dialog_start();
    dialog_case(aExatZaicem_2, -1);
    dialog_case(aCestnoZaplat_2, -2);
    const ax = await dialog_run(1, 0x11);

    if (ax === -1) {
      hero.has_ticket = 0;

      if (hero.charizma < Random(0x0A)) {
        GotoXY(1, 0x15);
        TextColor(0x0D);
        writeln(aTebqZalovili_3);
        decrease_health(0x0A, aKontrolleriKon);
        writeln(aISoVsemirnovim);
        await wait_for_key();
        ClrScr();
      }
    } else if (ax === -2) {
      hero.money -= -0xA;
      hero.has_ticket = 1;
    }
  }

  await wait_for_key();
  await sub_175A6();
} // end function 17AA2


let aVseminovM_a_Ux = 'Всеминов М.А. уходит.';
let aPoitiZaNimNaAl = 'Пойти за ним на электричку?';
let aDaQXocuEsePomu = 'Да, я хочу еще помучаться';
let aNuUjNetSpasibo = 'Ну уж нет, спасибо!';


async function sub_17D20() {
  ClrScr();
  show_header_stats();
  TextColor(0x0C);
  GotoXY(1, 0x0C);
  writeln(aVseminovM_a_Ux);

  if (current_place !== 1 || hero.subject[Algebra].tasks_done >= subjects[Algebra].tasks) {
    current_subject = -1;
    await wait_for_key();
  } else {
    writeln(aPoitiZaNimNaAl);
    dialog_start();
    dialog_case(aDaQXocuEsePomu, -1);
    dialog_case(aNuUjNetSpasibo, -2);
    show_short_today_timesheet(0x0C);
    let result = await dialog_run(1, 0x0F);

    if (result === -2) {
      current_place = 1;
      current_subject = -1;
    } else if (result === -1) {
      await sub_17AA2();
    }
  }
} // end function 17D20


async function sub_17DD3(arg_0) {
  if (arg_0 === 0) {
    await sub_17D20();
  } else {
    await sub_171C4();
  }
} // end function 17DD3


let aTvoqZacetkaPop = 'Твоя зачетка пополнилась еще одной записью.';


async function sub_17E1A() {
  writeln();
  TextColor(0x0A);
  writeln(aTvoqZacetkaPop);
  TextColor(7);
  await wait_for_key();
  ClrScr();
  show_header_stats();
} // end function 17E1A


let aVsemirnovMedle = 'Всемирнов медленно рисует минус ...';
let aITakJeMedlenno = 'И так же медленно пририсовывает к нему вертикальную палочку!';
let aUfNuISutockiUN = 'Уф! Ну и шуточки у него!';
let aXorosoXotZacet = 'Хорошо хоть, зачет поставил...';
let aVsemirnovM_a_I = 'Всемирнов М.А. изничтожил.';


async function sub_17F12() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  writeln(aVsemirnovMedle);
  await Delay(0x3E8);
  writeln(aITakJeMedlenno);
  writeln(aUfNuISutockiUN);
  writeln(aXorosoXotZacet);
  decrease_health(Random(6), aVsemirnovM_a_I);
  await wait_for_key();
  ClrScr();
  show_header_stats();
} // end function 17F12


function sub_17FAD(arg_2) {
  TextColor(Random(6) + 9);
  writeln(arg_2);
  TextColor(7);
} // end function 17FAD


let aVlasenkoN_p_ = 'Влащенко Н.П.:';
let aZakroiteGlaza_ = '"Закройте глаза ..."';
let aTiPoslusnoZakr = 'Ты послушно закрываешь глаза.';
let aOktroiteGlaza_ = '"Октройте глаза ..."';
let aTiVidisVlasenk = 'Ты видишь Влащенко Н.П. в костюме сказочной феи.';
let aVlasenkoN_p_Ka = 'Влащенко Н.П. касается тебя указкой (она же - волшебная палочка ...)';
let aTiCuvstvuesCto = 'Ты чувствуешь, что с тобой происходит что-то сверхъестественное.';
let aTebeSilNoPoplo = 'Тебе сильно поплохело.';
let aFeqBilaQvnoNeV = 'Фея была явно не в настроении.';
let aTiCuvstvuesC_0 = 'Ты чувствуешь, что подзабыл алгебру...';
let aTiCuvstvuesC_1 = 'Ты чувствуешь, что анализ придется учить заново.';
let aVGolovuPostoqn = 'В голову постоянно лезут мысли о всяких феях...';
let aTiCuvstvuesC_2 = 'Ты чувствуешь, что все вокруг жаждут твоей смерти.';
let aKudaToPodevala = 'Куда-то подевалась твоя уверенность в себе.';
let aGolovaStalaRab = 'Голова стала работать заметно лучше.';
let aTiProniksqLubo = 'Ты проникся любовью к окружающему миру.';
let aTiGotovKLubimI = 'Ты готов к любым испытаниям.';
let aPokaTvoiGlazaB = 'Пока твои глаза были закрыты, кто-то утащил твои деньги!!!';
let aTiNaselVSvoemK = 'Ты нашел в своем кармане какие-то деньги!';
let aTiCuvstvuesC_3 = 'Ты чувствуешь, что от тебя сильно несет чесноком.';
let aNeZnauVivetrit = 'Не знаю, выветрится ли такой сильный запах...';
let aStrannoeCuvstv = 'Странное чувство быстро прошло.';


async function sub_183A0() {
  colored_output(7, aVlasenkoN_p_);
  colored_output_ln(0x0F, aZakroiteGlaza_);
  writeln(aTiPoslusnoZakr);
  await Delay(0x3E8);
  colored_output_ln(0x0F, aOktroiteGlaza_);
  sub_17FAD(aTiVidisVlasenk);
  sub_17FAD(aVlasenkoN_p_Ka);
  sub_17FAD(aTiCuvstvuesCto);

  const ax = Random(0x0F);

  if (ax === 0) {
    sub_17FAD(aTebeSilNoPoplo);
    decrease_health(0x1E, aFeqBilaQvnoNeV);
  } else if (ax === 1) {
    sub_17FAD('Ты почувствовал себя где-то в другом месте.');
    current_place = 2;
    current_subject = -1;
  } else if (ax === 2) {
    hero.subject[Algebra].knowledge = idiv(hero.subject[Algebra].knowledge, 2);
    sub_17FAD(aTiCuvstvuesC_0);
  } else if (ax === 3) {
    hero.subject[Matan].knowledge = idiv(hero.subject[Matan].knowledge, 2);
    sub_17FAD(aTiCuvstvuesC_1);
  } else if (ax === 4) {
    hero.brain -= Random(2) + 1;
    sub_17FAD(aVGolovuPostoqn);
  } else if (ax === 5) {
    hero.charizma -= Random(2) + 1;
    sub_17FAD(aTiCuvstvuesC_2);
  } else if (ax === 6) {
    hero.stamina -= Random(2) + 1;
    sub_17FAD(aKudaToPodevala);
  } else if (ax === 7) {
    hero.brain += Random(3) + 1;
    sub_17FAD(aGolovaStalaRab);
  } else if (ax === 8) {
    hero.charizma += Random(3) + 1;
    sub_17FAD(aTiProniksqLubo);
  } else if (ax === 9) {
    hero.stamina += Random(3) + 1;
    sub_17FAD(aTiGotovKLubimI);
  } else if (ax === 0xA) {
    if (!jle(hero.money, 0)) {
      hero.money = 0;
      sub_17FAD(aPokaTvoiGlazaB);
    } else {
      hero.money = 0x14;
      sub_17FAD(aTiNaselVSvoemK);
    }
  } else if (ax === 0xB || ax === 0xC || ax === 0xD) {
    sub_17FAD(aTiCuvstvuesC_3);
    sub_17FAD(aNeZnauVivetrit);
    hero.garlic = Random(4) + 1;
    hero.charizma -= idiv(hero.garlic, 2);
  } else if (ax === 0xE) {
    sub_17FAD(aStrannoeCuvstv);
  }

  await wait_for_key();
  ClrScr();
  show_header_stats();
} // end function 183A0


async function sub_185C9(arg_0) {
  if (arg_0 === 4) {
    await sub_183A0();
  } else if (arg_0 === 0) {
    await sub_17F12();
  } else {
    await sub_17E1A();
  }
} // end function 185C9


let aMucaesSq____0 = 'Мучаешься ...';
let aPodkoritov = 'Подкорытов:';
let aCegoToQNePonim = '"Чего-то я не понимаю... Похоже, Вы меня лечите..."';
let aTvoiMuceniqB_0 = 'Твои мучения были напрасны.';
let aTebeZacliEse_0 = 'Тебе зачли еще ';
let aZamucil_0 = ' замучил';
let aA_0 = 'а';
let a__0 = '.';


async function sub_18677() {
  GotoXY(1, 0x14);
  TextColor(0x0D);
  writeln(aMucaesSq____0);
  TextColor(7);
  writeln();

  let bp_var_4 = hero.subject[current_subject].knowledge - subjects[current_subject].member0xFA + Random(hero.brain);
  if (!jg(hero.health, 5)) {
    bp_var_4 -= Random(5 - hero.health);
  }

  if (!jle(bp_var_4, 0)) {
    bp_var_4 = Round(Sqrt(bp_var_4) / subjects[current_subject].member0x100);
  } else {
    bp_var_4 = 0;
  }

  if (!jle(hero.subject[current_subject].tasks_done + bp_var_4, subjects[current_subject].tasks)) {
    bp_var_4 = subjects[current_subject].tasks - hero.subject[current_subject].tasks_done;
  }

  let var_4 = Random(hero.stamina) - Random(subjects[current_subject].member0xFA);
  if (!jle(var_4, 0)) {
    var_4 = 0;
  }

  hero.subject[current_subject].knowledge += var_4;
  if (hero.subject[current_subject].knowledge < 0) {
    hero.subject[current_subject].knowledge = 0;
  }

  if (!jnz(current_subject, 2) && !jge(hero.charizma * 2 + 0x1A, hero.subject[current_subject].knowledge)) {
    GotoXY(1, 0x14);
    TextColor(7);
    write(aPodkoritov);
    TextColor(0x0F);
    writeln(aCegoToQNePonim);
    bp_var_4 = 0;
  }

  GotoXY(1, 0x15);
  if (!jnz(bp_var_4, 0)) {
    colored_output(0x0C, aTvoiMuceniqB_0);
  } else {
    colored_output(0x0A, aTebeZacliEse_0);
    colored_output_white(bp_var_4);
    TextColor(0x0A);
    zadanie_in_case(bp_var_4);
    write('!');
    TextColor(7);
  }


  hero.subject[current_subject].tasks_done += bp_var_4;
  let var_2 = Random(hero.stamina) - subjects[current_subject].member0xFC;

  if (var_2 > 0) {
    var_2 = 0;
  }

  hero.health += var_2;
  if (jle(hero.health, 0)) {
    is_end = 1;
    death_cause = subjects[current_subject].professor.name + aZamucil_0;
    if (!jnz(subjects[current_subject].professor.sex, 0)) {
      death_cause += aA_0;
    }
    death_cause += a__0;
  }

  await hour_pass();
  await wait_for_key();

} // end function 18677


let aUVasVseZacteno = 'У вас все зачтено, можете быть свободны.';
let aSeicasTebqIstq = 'Сейчас тебя истязает ';
let aKromeTebqZdesE = 'Кроме тебя, здесь еще сид';
let aIt = 'ит ';
let aQt = 'ят ';
let aI = ' и ';
let asc_18A07 = ', ';
let aUTebqEseNicego = 'У тебя еще ничего не зачтено.';
let aZacteno = 'Зачтено ';
let aZadacIz = ' задач из ';
let aUTebqUjeVseZac = 'У тебя уже все зачтено.';
let aMucatSqDalSe = 'Мучаться дальше';
let aBrositAtoDelo = 'Бросить это дело';


async function scene_exam() {
  let var_15;
  let var_14;
  let var_12 = [];
  let var_6 = 0;
  let var_2;

  last_subject = current_subject;

  var_15 = 0;
  for (var_2 = 0; var_2 <= 0xB; ++var_2) {
    // #warning
    //[bp+var_2+var_12] = 0;
    var_12.push(0);
  }
  var_14 = 0;


  if (!(current_subject !== -1)) {
    return;
  }

  if (jle(hero.health, 0) || !jz(is_end, 0)) {
    return;
  }

  ClrScr();
  show_header_stats();

  if (!jl(hero.subject[current_subject].tasks_done, subjects[current_subject].tasks)) {
    writeln();
    TextColor(0x0A);
    writeln(aUVasVseZacteno);
    TextColor(7);

    if (hero.subject[current_subject].passed === 0) {
      hero.subject[current_subject].pass_day = day_of_week;
      hero.subject[current_subject].passed = 1;
      --hero.exams_left;

      writeln();
      await sub_185C9(current_subject);

      if (!(current_subject !== -1)) {
        return;
      }

      if (!jz(is_end, 0)) {
        return;
      }
    }
  }


  if (!jg(timesheet[day_of_week][current_subject].to, time_of_day)) {
    await sub_17DD3(current_subject);
    return;
  }

  GotoXY(1, 8);
  TextColor(0x0E);
  write(aSeicasTebqIstq);
  write(subjects[current_subject].professor.name);
  writeln('.');

  let var_4 = 0;
  for (var_2 = 0; var_2 <= 0xB; ++var_2) {
    if (jz(classmates[var_2].current_subject, current_subject) || !(current_place !== 3)) {
      if (!(classmates[var_2].place !== current_place)) {
        if (!jnb(var_2, 0x10)) {
          var_6 |= 1 << var_2;
        }
        ++var_4;
      }
    }
  }

  if (jg(var_4, 0)) {
    TextColor(7);
    write(aKromeTebqZdesE);

    if (!(var_4 !== 1)) {
      write(aIt);
    } else if (!jle(var_4, 1)) {
      write(aQt);
    }

    for (var_2 = 0; var_2 <= 0xB; ++var_2) {

      if (jb(var_2, 0x10)) {
        if (var_6 & (1 << var_2)) {

          write(classmate_names[var_2]);

          --var_4;

          if (!jbe(WhereY(), 0x46)) {
            writeln();
          }

          if (!(var_4 !== 0)) {
            writeln('.');
          } else if (!(var_4 !== 1)) {
            write(aI);
          } else {
            write(asc_18A07);
          }
        }
      }
    }
  }

  do {
    if (!jg(idiv(hero.charizma, 2), var_14)) {
      break;
    }

    if (!jle(var_14, 3)) {
      break;
    }

    for (var_2 = 0; var_2 <= 0xB; ++var_2) {
      if (jz(var_12[var_2], 0)) {
        if (classmates[var_2].member0x32C - idiv(var_14, 2) - hero.garlic > Random(0x0A)) {
          if (!jnb(var_2, 0x10)) {
            if (var_6 & (1 << var_2)) {
              if (!jle(idiv(hero.charizma, 2), var_14)) {
                var_12[var_2] = 1;

                ++var_14;
                await sub_18FB2(var_2);

                if (!jg(timesheet[day_of_week][current_subject].to, time_of_day)) {
                  await sub_17DD3(current_subject);
                  return;
                } else {
                  await check_exams_left_count();
                  if (!jz(is_end, 0)) {
                    return;
                  } else {
                    ClrScr();
                    show_header_stats();
                  }
                }
              }
            }
          }
        }
      }
    }
  } while ((Random(2) !== 0));


  GotoXY(1, 7);

  if (!(hero.subject[current_subject].tasks_done !== 0)) {
    colored_output_ln(7, aUTebqEseNicego);
  } else {
    if (!jge(hero.subject[current_subject].tasks_done, subjects[current_subject].tasks)) {
      colored_output(7, aZacteno);
      colored_output_white(hero.subject[current_subject].tasks_done);
      colored_output(7, aZadacIz);
      colored_output_white(subjects[current_subject].tasks);
      writeln();
    } else {
      colored_output_ln(0x0A, aUTebqUjeVseZac);
    }
  }

  dialog_start();
  if (!(hero.subject[current_subject].passed !== 0)) {
    dialog_case(aMucatSqDalSe, -1);
  }

  for (var_2 = 0; var_2 <= 0xB; ++var_2) {
    if (!jnb(var_2, 0x10)) {
      if (var_6 & (1 << var_2)) {
        dialog_case_colored(classmate_names[var_2], var_2, 0xE);
      }
    }
  }

  dialog_case(aBrositAtoDelo, -2);
  show_short_today_timesheet(0x0C);
  var_2 = await dialog_run(1, 0x0C);
  if (var_2 === -1) {
    await sub_18677();
  } else if (var_2 === -2) {
    current_subject = -1;
  } else if (!jl(var_2, 0) && !jg(var_2, 0xB)) {
    await talk_with_classmate(var_2);
  }

} // end function 18A75


let aKTebePristaet = 'К тебе пристает ';
let a_CtoBudesDelat = '. Что будешь делать?';
let aPitatSqIgnorir = 'Пытаться игнорировать';
let aTebeKakToNexor = 'Тебе как-то нехорошо ...';
let aLucseIgnorirov = ' лучше игнорировать не надо.';


async function sub_18FB2(arg_0) {
  let var_104;
  let var_4;
  let var_1;

  if (!(!jnz(arg_0, 3) && !jnz(current_place, 3))) {

    writeln();
    write(aKTebePristaet);
    write(classmate_names[arg_0]);

    writeln(a_CtoBudesDelat);

    dialog_start();
    dialog_case(aPitatSqIgnorir, -1);
    dialog_case(classmate_names[arg_0], -2);

    var_4 = WhereY() + 2;
    show_short_today_timesheet(var_4);
    const res = await dialog_run(1, var_4);

    if (res === -1) {
      if (classmates[arg_0].member0x344 > 0) {
        GotoXY(1, 0x16);
        writeln(aTebeKakToNexor);
        decrease_health(classmates[arg_0].member0x344, classmate_names[arg_0] + aLucseIgnorirov);
      }

      var_1 = 0;
      await wait_for_key();
      ClrScr();
    } else if (res === -2) {
      var_1 = 1;
      await talk_with_classmate(arg_0);
    }

  }

  return var_1;
} // end function 18FB2


let aKolqSmotritNaT = 'Коля смотрит на тебя немного окосевшими глазами.';
let aUTebqOstalisNe = '"У тебя остались нерешенные задачи по Всемирнову? Давай сюда!"';
let aKolqResilTebeE = 'Коля решил тебе еще ';
let aZadaciPoAlgebr = ' задачи по алгебре!';
let aZnaesPivoKonec = '"Знаешь, пиво, конечно, хорошо, но настойка овса - лучше!"';
let aZakazatKoleNas = 'Заказать Коле настойку овса?';
let aDa = 'Да';
let aNet = 'Нет';
let aTvoiAlTruizmNa = 'Твой альтруизм навсегда останется в памяти потомков.';
let aZrqOiZrq___ = '"Зря, ой, зря ..."';
let aKolqDostaetTor = 'Коля достает тормозную жидкость, и вы распиваете еще по стакану.';
let aSpilsq_ = 'Спился.';


async function sub_19259() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  writeln(aKolqSmotritNaT);

  if (hero.charizma > Random(0x0A) && subjects[Algebra].tasks - 2 >= hero.subject[Algebra].tasks_done) {
    current_color = 0x0F;
    writeln(aUTebqOstalisNe);
    hero.subject[Algebra].tasks_done += 2;
    output_with_highlighted_num(7, aKolqResilTebeE, 0x0F, 2, aZadaciPoAlgebr);
    await wait_for_key();
    ClrScr();
    await hour_pass();
    return;
  }

  current_color = 0x0F;
  writeln(aZnaesPivoKonec);

  if (hero.money <= 0x0F) {

    GotoXY(1, 0x0F);
    current_color = 0x0D;
    writeln(aKolqDostaetTor);
    --hero.brain;

    if (hero.brain <= 0) {
      hero.health = 0;
      is_end = 1;
      death_cause = aSpilsq_;
    }

  } else {

    current_color = 7;
    writeln(aZakazatKoleNas);
    dialog_start();
    dialog_case(aDa, -1);
    dialog_case(aNet, -2);
    show_short_today_timesheet(0x0C);
    let res = await dialog_run(1, 0x0F);

    if (res === -1) {

      hero.money -= 0xF;
      GotoXY(1, 0x13);

      if (hero.charizma > Random(0x0A) && hero.subject[Algebra].tasks_done + 1 < subjects[Algebra].tasks) {
        current_color = 0x0F;
        writeln(aUTebqOstalisNe);
        hero.subject[Algebra].tasks_done += 2;
        output_with_highlighted_num(7, aKolqResilTebeE, 0x0F, 2, aZadaciPoAlgebr);
        await wait_for_key();
        ClrScr();
        await hour_pass();
        return;
      } else {
        current_color = 7;
        writeln(aTvoiAlTruizmNa);
      }

    } else if (res === -2) {
      GotoXY(1, 0x13);
      current_color = 0x0F;
      writeln(aZrqOiZrq___);
      current_color = 0x0D;
      writeln(aKolqDostaetTor);
      --hero.brain;
      await wait_for_key();
      ClrScr();
      return;
    }
  }

  await wait_for_key();
  ClrScr();
} // end function 19259


let aWowTiTolKoCtoV = 'Wow! Ты только что встретил автора !';
let aDiamond_0 = 'Diamond:';
let aKolqPomojetSAl = '"Коля поможет с алгеброй."';
let aMisaRasskajetV = '"Миша расскажет всем, какой ты хороший."';
let aPasaTvoiStaros = '"Паша - твой староста."';
let aSDjugomLucseNe = '"С DJuGом лучше не сталкиваться."';
let aRaiNeOtstanetL = '"RAI не отстанет, лучше решить ему чего-нибудь."';
let aKolqVseVremqSi = '"Коля все время сидит в мавзолее и оттягивается."';
let aSlediZaSvoimZd = '"Следи за своим здоровьем!!!"';
let aEsliVstretisSa = '"Если встретишь Сашу - ОБЯЗАТЕЛЬНО заговори с ним."';
let aEsliPloxoDumae = '"Если плохо думается, попробуй поговорить с RAI."';
let aIdqKKoleBudUve = '"Идя к Коле, будь уверен, что можешь пить с ним."';
let aPolucaqZacetPo = '"Получая зачет по английскому, будь готов к неожиданностям."';
let aInogdaRazgovor = '"Иногда разговоры с Сержем приносят ощутимую пользу."';
let aAndruMojetPomo = '"Эндрю может помочь, но не всегда..."';
let aKuzMenkoInogda = '"Кузьменко иногда знает о Климове больше, чем сам Климов."';
let aNeSpesiSlatGne = '"Не спеши слать гневные письма о багах:';
let aZaglqniNaMmher = 'загляни на mmheroes.chat.ru,';
let aMojetBitVseUje = 'может быть, все уже в порядке!"';
let aSerjTojeInogda = '"Серж тоже иногда забегает в мавзолей."';
let aNePereuciTopol = '"Не переучи топологию, а то Подкорытов-младший не поймет."';
let aMojesUstroitSq = '"Можешь устроиться в ТЕРКОМ по знакомству."';
let aGrisaRabotaetV = '"Гриша работает ( ;*) ) в ТЕРКОМе."';
let aVTerkomeMojnoZ = '"В ТЕРКОМЕ можно заработать какие-то деньги."';
let aGrisaInogdaBiv = '"Гриша иногда бывает в Мавзолее."';
let aNeNravitsqRasp = '"Не нравится расписание? Подумай о чем-нибудь парадоксальном."';
let aNilDaetDenGiZa = '"NiL дает деньги за помощь, но..."';
let aCestnoNeZnauKo = '"Честно, не знаю, когда будет готов порт под Linux..."';
let aSrocnoNujniNov = '"Срочно! Нужны новые фишки для "Зачетной недели" !"';
let aPojelaniqIdeiB = '"Пожелания, идеи, bug report\'ы шлите на mmheroes@chat.ru !"';
let aVstretisKostuB = '"Встретишь Костю Буленкова - передай ему большой привет!"';
let aBolSoeSpasiboV = '"Большое спасибо Ване Павлику за mmheroes.chat.ru !"';
let aDiamondUbegaet = 'Diamond убегает по своим делам ...';
let aXocesPoTestitN = '"Хочешь по-тестить новую версию Heroes of MAT-MEX?"';
let aDaKonecnoOcenX = 'ДА, КОНЕЧНО, ОЧЕНЬ ХОЧУ!';
let aNetUMenqNetNaA = 'Нет, у меня нет на это времени...';
let aNuILaduskiVotT = '"Ну и ладушки! Вот тебе дискетка..."';
let aIzviniCtoPobes = '"Извини, что побеспокоил."';


async function sub_19B20() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  current_color = 0x0E;
  writeln(aWowTiTolKoCtoV);
  writeln();
  write(aDiamond_0);

  if (hero.has_mmheroes_disk === 0 && current_place === 3 && !ja(Random(8), 0)) {
    writeln(aXocesPoTestitN);
    dialog_start();
    dialog_case(aDaKonecnoOcenX, -1);
    dialog_case(aNetUMenqNetNaA, -2);
    show_short_today_timesheet(0x0C);
    let res = await dialog_run(1, 0x0C);
    if (res === -1) {
      GotoXY(1, 0x10);
      writeln(aNuILaduskiVotT);
      hero.has_mmheroes_disk = 1;
      await wait_for_key();
    } else if (res === -2) {
      GotoXY(1, 0x10);
      writeln(aIzviniCtoPobes);
      await wait_for_key();
    }
    return;
  }

  current_color = 0x0F;
  writeln([aKolqPomojetSAl, aMisaRasskajetV, aPasaTvoiStaros, aSDjugomLucseNe, aRaiNeOtstanetL, aKolqVseVremqSi, aSlediZaSvoimZd, aEsliVstretisSa, aEsliPloxoDumae, aIdqKKoleBudUve, aPolucaqZacetPo, aInogdaRazgovor, aAndruMojetPomo, aKuzMenkoInogda, aNeSpesiSlatGne + '\n' + aZaglqniNaMmher + '\n' + aMojetBitVseUje, aSerjTojeInogda, aNePereuciTopol, aMojesUstroitSq, aGrisaRabotaetV, aVTerkomeMojnoZ, aGrisaInogdaBiv, aNeNravitsqRasp, aNilDaetDenGiZa, aCestnoNeZnauKo, aSrocnoNujniNov, aPojelaniqIdeiB, aVstretisKostuB, aBolSoeSpasiboV][Random(0x1C)]);
  current_color = 7;

  if (current_subject === -1) {
    if (Random(2) === 0) {
      writeln(aDiamondUbegaet);
      classmates[Diamond].place = 0;
      classmates[Diamond].current_subject = -1;
    }
  }

  await wait_for_key();
} // end function 19B20


let aRai_0 = 'RAI:';
let aTiMnePomojes = '"Ты мне поможешь?"';
let aDaKonecno = '"Да, конечно"';
let aNetIzvini___ = '"Нет, извини..."';
let aTiPomogRai_ = 'Ты помог RAI.';
let aNicegoNeVislo_ = 'Ничего не вышло.';
let aAxTakPolucaiPo = '"Ах, так! Получай! Получай!"';
let aRaiDelaetTebeB = 'RAI делает тебе больно ...';
let aRaiZamocil_ = 'RAI замочил.';
let aRaiNeReagiruet = 'RAI не реагирует на твои позывы.';


async function sub_1A0A2() {
  if (current_subject >= 3 || current_subject === -1) {
    ClrScr();
    show_header_stats();
    GotoXY(1, 8);
    writeln(aRaiNeReagiruet);
  } else {
    dialog_start();
    ClrScr();
    show_header_stats();
    TextColor(7);
    GotoXY(1, 0x0A);
    write(aRai_0);
    TextColor(0x0F);
    write(aTiMnePomojes);
    dialog_case(aDaKonecno, 1);
    dialog_case(aNetIzvini___, 2);
    show_short_today_timesheet(0x0C);
    let ax = await dialog_run(1, 0x0C);

    if (ax === 1) {
      GotoXY(1, 0x0F);

      if (!jbe(Random(hero.subject[current_subject].knowledge), Random(subjects[current_subject].member0xFA))) {
        TextColor(0x0A);
        writeln(aTiPomogRai_);
        ++hero.brain;
        TextColor(7);
      } else {
        writeln(aNicegoNeVislo_);
      }
      await hour_pass();
    } else if (ax === 2) {
      GotoXY(1, 0x0F);
      TextColor(0x0D);
      writeln(aAxTakPolucaiPo);
      TextColor(7);
      writeln(aRaiDelaetTebeB);
      decrease_health(0x0A, aRaiZamocil_);
    }
  }

  await wait_for_key();
  ClrScr();
} // end function 1A0A2


let aMisa_0 = 'Миша : ';
let aSlusaiXvatitMu = '"Слушай, хватит мучаться! Прервись!';
let aDavaiVKlopodav = 'Давай в клоподавку сыграем!"';
let aDavai = '"Давай!"';
let aNetNeBuduQVKlo = '"Нет, не буду я в клоподавку ..."';
let aTiSigralSMisei = 'Ты сыграл с Мишей партию в клоподавку.';
let aZrqOcenZrq = '"Зря, очень зря!"';
let aSlusaiAVedVTer = '"Слушай, а ведь в ТЕРКОМе есть столик для тенниса. Сыграем?"';
let aObqzatelNo = '"Обязательно!"';
let aIzviniPotom_ = '"Извини, потом."';
let aTiSigralSMis_0 = 'Ты сыграл с Мишей в теннис.';
let aZagonqlTebqMis = 'Загонял тебя Миша.';
let aNicegoQNaTebqN = '"Ничего, я на тебя не в обиде."';
let aMisa_1 = 'Миша:';
let aAxJalNegdeSigr = '"Эх, жаль, негде сыграть в клоподавку!"';
let aVsegdaSlediZaZ = '"Всегда следи за здоровьем!"';
let aMozgiVliqutNaP = '"Мозги влияют на подготовку и сдачу зачетов."';
let aCemBolSeVinosl = '"Чем больше выносливость, тем меньше здоровья ты тратишь."';
let aCemBolSeTvoqXa = '"Чем больше твоя харизма, тем лучше у тебя отношения с людьми."';
let aVajnostKonkret = '"Важность конкретного качества сильно зависит от стиля игры."';
let aXarizmaPomogae = '"Харизма помогает получить что угодно от кого угодно."';
let aCemBolSeXarizm = '"Чем больше харизма, тем чаще к тебе пристают."';
let aCemMenSeVinosl = '"Чем меньше выносливость, тем больнее учиться."';
let aCemBolSeMozgiT = '"Чем больше мозги, тем легче готовиться."';
let aSidenieVInetEI = '"Сидение в Inet\'e иногда развивает мозги."';
let aEsliTebeNadoel = '"Если тебе надоело умирать - попробуй другую стратегию."';
let aXocesXalqviNab = '"Хочешь халявы - набирай харизму."';
let aXocesDobitSqVs = '"Хочешь добиться всего сам - развивай мозги."';
let aVMavzoleeVajno = '"В "Мавзолее" важно знать меру..."';
let aOtRazdvoeniqLi = '"От раздвоения личности спасают харизма и выносливость."';
let aOtLubogoObseni = '"От любого общения с NiL ты тупеешь!"';
let aGrisaMojetPomo = '"Гриша может помочь с трудоустройством."';
let aPeremeseniqStu = '"Перемещения студентов предсказуемы."';


async function sub_1A70A() {
  ClrScr();
  show_header_stats();

  if (!(current_place === 3 || current_subject === -1)) {
    GotoXY(1, 8);
    TextColor(7);
    write(aMisa_0);
    TextColor(0x0F);
    writeln(aSlusaiXvatitMu);
    writeln(aDavaiVKlopodav);
    dialog_start();
    dialog_case(aDavai, 1);
    dialog_case(aNetNeBuduQVKlo, 2);
    const res = await dialog_run(1, 0x0C);

    if (res === 1) {
      GotoXY(1, 0x0F);
      TextColor(0x0A);
      writeln(aTiSigralSMisei);
      TextColor(7);
      ++hero.charizma;
      await wait_for_key();
      ClrScr();
      await hour_pass();
    } else if (res === 2) {
      GotoXY(1, 0x0F);
      TextColor(0x0F);
      writeln(aZrqOcenZrq);
      hero.charizma -= Random(2);
      await wait_for_key();
      TextColor(7);
      ClrScr();
    }
    return;
  }

  if (current_place === 1 && current_subject === -1 && hero.is_working_in_terkom) {
    if (hero.charizma > Random(8)) {
      GotoXY(1, 8);
      TextColor(7);
      write(aMisa_0);
      TextColor(0x0F);
      writeln(aSlusaiAVedVTer);
      dialog_start();
      dialog_case(aObqzatelNo, 1);
      dialog_case(aIzviniPotom_, 2);
      const res = await dialog_run(1, 0x0C);

      if (res === 1) {
        GotoXY(1, 0x0F);
        TextColor(0x0A);
        writeln(aTiSigralSMis_0);
        TextColor(7);
        ++hero.charizma;

        if (hero.charizma < Random(0x0A)) {
          decrease_health(Random(3) + 3, aZagonqlTebqMis);
        } else {
          await wait_for_key();
          ClrScr();
          await hour_pass();
        }

      } else if (res === 2) {
        GotoXY(1, 0x0F);
        TextColor(0x0F);
        writeln(aNicegoQNaTebqN);
        await wait_for_key();
        TextColor(7);
        ClrScr();
      }
      return;
    }
  }

  GotoXY(1, 8);
  TextColor(7);
  write(aMisa_1);
  TextColor(0x0F);

  write([aAxJalNegdeSigr, aVsegdaSlediZaZ, aMozgiVliqutNaP, aCemBolSeVinosl, aCemBolSeTvoqXa, aVajnostKonkret, aXarizmaPomogae, aCemBolSeXarizm, aCemMenSeVinosl, aCemBolSeMozgiT, aSidenieVInetEI, aEsliTebeNadoel, aXocesXalqviNab, aXocesDobitSqVs, aVMavzoleeVajno, aOtRazdvoeniqLi, aOtLubogoObseni, aGrisaMojetPomo, aPeremeseniqStu][Random(0x13)]);

  await wait_for_key();
  ClrScr();
} // end function 1A70A


let aSerj_0 = 'Серж: ';
let aNaGlotniKefirc = '"На, глотни кефирчику."';
let aQZnauGdeSrezat = '"Я знаю, где срезать в парке на физ-ре!"';
let aPomnitsqKogdaT = '"Помнится, когда-то была еще графическая версия mmHeroes..."';
let aQBilBetaTester = '"Я был бета-тестером первой версии mmHeroes (тогда еще CRWMM19)!"';
let aKakZdorovoCtoD = '"Как здорово, что Diamond написал новую версию!"';
let aTiUjePolucilDe = '"Ты уже получил деньги у Паши?"';
let aPoprobuiDlqNac = '"Попробуй для начала легкие зачеты."';
let aTiEseNePolucil = '"Ты еще не получил зачет по английскому?"';
let aXocesOtdixatGd = '"Хочешь отдыхать, где угодно? Заимей деньги!"';
let aNeVDenGaxScast = '"Не в деньгах счастье. Но они действуют успокаивающе."';
let aNaVsemirnoveVs = '"На Всемирнове всегда толпа народу."';
let aVlasenkoDamaVe = '"Влащенко - дама весьма оригинальная."';
let aInteresnoKogda = '"Интересно, когда будет готова следующая версия?"';
let aZdorovEVKafePo = '"Здоровье в кафе повышается в зависимости от наличия денег."';
let aEsliBiQZnalAdr = '"Если бы я знал адрес хорошего proxy..."';
let aStarVremennoNa = '"STAR временно накрылся. Хорошо бы узнать адрес другого proxy..."';
let aQPodozrevauCto = '"Я подозреваю, что Гриша знает адресок теркомовского proxy."';
let aADiamondVseSvo = '"А Diamond все свободное время дописывает свою игрушку!"';
let aVSleduusemSeme = '"В следующем семестре информатику будет вести Терехов-младший."';
let aDiamondXocetPe = '"Diamond хочет переписать это все на Java."';
let aMisaProkonsulT = '"Миша проконсультирует тебя о стратегии."';
let aPogovoriSDiamo = '"Поговори с Diamond\'ом, он много ценного скажет."';
let aBorisDoKonca = '"Борись до конца!"';
let aUDubcovaInogda = '"У Дубцова иногда бывает халява."';
let aSerjUxoditKuda = 'Серж уходит куда-то по своим делам ...';


async function sub_1B09A() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  TextColor(7);
  write(aSerj_0);
  TextColor(0x0F);

  if (!(!ja(Random(hero.charizma), Random(3) + 2)) && !jle(hero.charizma * 2 + 0x14, hero.health)) {

    writeln(aNaGlotniKefirc);
    hero.health += hero.charizma + Random(hero.charizma);

    if (!jz(current_subject, -1)) {
      if (hero.subject[current_subject].knowledge > 3) {
        hero.subject[current_subject].knowledge -= Random(3);
      }
    }

  } else {

    if (Random(hero.charizma) > Random(6) + 2 && hero.subject[Fizra].knowledge < 0x0A) {
      writeln(aQZnauGdeSrezat);
      hero.subject[Fizra].knowledge += 0x1E;
    } else {
      let ax = Random(0x16);
      if (ax === 0) {
        writeln(aPomnitsqKogdaT);
      } else if (ax === 1) {
        writeln(aQBilBetaTester);
      } else if (ax === 2) {
        writeln(aKakZdorovoCtoD);
      } else if (ax === 3) {
        writeln(aTiUjePolucilDe);
      } else if (ax === 4) {
        writeln(aPoprobuiDlqNac);
      } else if (ax === 5) {
        writeln(aTiEseNePolucil);
      } else if (ax === 6) {
        writeln(aXocesOtdixatGd);
      } else if (ax === 7) {
        writeln(aNeVDenGaxScast);
      } else if (ax === 8) {
        writeln(aNaVsemirnoveVs);
      } else if (ax === 9) {
        writeln(aVlasenkoDamaVe);
      } else if (ax === 0xA) {
        writeln(aInteresnoKogda);
      } else if (ax === 0xB) {
        writeln(aZdorovEVKafePo);
      } else if (ax === 0xC) {
        writeln(aEsliBiQZnalAdr);
      } else if (ax === 0xD) {
        writeln(aStarVremennoNa);
      } else if (ax === 0xE) {
        writeln(aQPodozrevauCto);
      } else if (ax === 0xF) {
        writeln(aADiamondVseSvo);
      } else if (ax === 0x10) {
        writeln(aVSleduusemSeme);
      } else if (ax === 0x11) {
        writeln(aDiamondXocetPe);
      } else if (ax === 0x12) {
        writeln(aMisaProkonsulT);
      } else if (ax === 0x13) {
        writeln(aPogovoriSDiamo);
      } else if (ax === 0x14) {
        writeln(aBorisDoKonca);
      } else if (ax === 0x15) {
        writeln(aUDubcovaInogda);
      }
    }

  }

  if (hero.charizma < Random(9)) {
    TextColor(7);
    writeln(aSerjUxoditKuda);
    classmates[Serzg].current_subject = -1;
    if (!jnz(classmates[Serzg].place, 5)) {
      classmates[Serzg].place = 0;
    } else {
      classmates[Serzg].place = 5;
    }
  }

  await wait_for_key();
  TextColor(7);
  ClrScr();
} // end function 1B09A


async function sub_1B526() {
  ClrScr();
  show_header_stats();

  if (!jnz(hero.got_stipend, 0)) {
    hero.got_stipend = 1
    GotoXY(1, 8);
    output_with_highlighted_num(7, 'Паша вручает тебе твою стипуху за май: ', 0x0F, 0x32, ' руб.');
    hero.money += 0x32;
  } else {
    GotoXY(1, 8);
    TextColor(0x0A);
    writeln('Паша воодушевляет тебя на великие дела.');
    TextColor(0x0C);
    writeln('Вместе с этим он немного достает тебя.');
    ++hero.stamina;

    for (let var_2 = 0; var_2 <= 5; ++var_2) {
      if (hero.subject[var_2].knowledge > 3) {
        hero.subject[var_2].knowledge -= Random(3);
      }
    }

  }

  await wait_for_key();
  ClrScr();

} // end function 1B526


let aTiVstretilSasu = 'Ты встретил Сашу! Говорят, у него классные конспекты ...';
let aNicegoNeNado = 'Ничего не надо';
let aCegoTebeNadoOt = 'Чего тебе надо от Саши?';
let aKakZnaes___ = 'Как знаешь...';
let aSasa_1 = 'Саша:';
let aDaUMenqSSoboiA = '"Да, у меня с собой этот конспект ..."';
let aOxIzviniKtoToD = '"Ох, извини, кто-то другой уже позаимствовал ..."';


async function sub_1B6B7() {
  let var_2;

  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  TextColor(0x0E);
  writeln(aTiVstretilSasu);
  dialog_start();

  for (var_2 = 0; var_2 <= 2; ++var_2) {
    if (synopsis[var_2].hero_has === 0) {
      dialog_case(subjects[var_2].title, var_2);
    }
  }

  dialog_case(aNicegoNeNado, -1);
  GotoXY(1, 9);
  writeln(aCegoTebeNadoOt);
  var_2 = await dialog_run(1, 0x0B);

  if (!jnz(var_2, -1)) {
    GotoXY(1, 0x0F);
    writeln(aKakZnaes___);
  } else {
    if (hero.charizma > Random(0x12) && !jz(synopsis[var_2].sasha_has, 0)) {
      GotoXY(1, 0x0F);
      TextColor(7);
      write(aSasa_1);
      TextColor(0x0F);
      writeln(aDaUMenqSSoboiA);
      synopsis[var_2].hero_has = 1;
      byte_2549F = 0;
    } else {
      GotoXY(1, 0x0F);
      TextColor(7);
      write(aSasa_1);
      TextColor(0x0F);
      writeln(aOxIzviniKtoToD);
      synopsis[var_2].sasha_has = 0;
    }
  }

  await wait_for_key();
  ClrScr();
} // end function 1B6B7


let aMaladoiCilavek = '"Маладой чилавек, вы мне не паможите решить задачу?';
let aAToQSigodnqNiV = 'А то я сигодня ни в зуб нагой ..."';
let aDaKonecno_0 = '"Да, конечно"';
let aIzviniVDrugoiR = '"Извини, в другой раз"';
let aOiSpasiboVotVa = '"Ой, спасибо! Вот вам ';
let aRub_ZaAto___ = ' руб. за это..."';
let aAlTruizmNeDove = 'Альтруизм не довел до добра.';
let aUTebqNicegoNeV = 'У тебя ничего не вышло.';
let aTiZavodisSNilS = 'Ты заводишь с NiL светскую беседу.';
let aTebePoploxelo_ = 'Тебе поплохело.';
let aObsenieSNilOka = 'Общение с NiL оказалось выше человеческих сил.';


async function sub_1B986() {
  ClrScr();
  show_header_stats();

  if (!jnz(current_subject, -1)) {
    GotoXY(1, 8);
    TextColor(7);
    writeln(aTiZavodisSNilS);
    TextColor(0x0D);
    writeln(aTebePoploxelo_);
    decrease_health(0x0A, aObsenieSNilOka);

  } else {
    GotoXY(1, 8);
    TextColor(0x0B);
    writeln(aMaladoiCilavek);
    writeln(aAToQSigodnqNiV);
    dialog_start();
    dialog_case(aDaKonecno_0, -1);
    dialog_case(aIzviniVDrugoiR, -2);
    let ax = await dialog_run(1, 0x0B);

    if (ax === -1) {

      if (jg(hero.subject[current_subject].knowledge, subjects[current_subject].member0xFA)) {

        GotoXY(1, 0x0E);
        TextColor(0x0E);
        write(aOiSpasiboVotVa);
        write(hero.subject[current_subject].knowledge);
        writeln(aRub_ZaAto___);

        hero.money += hero.subject[current_subject].knowledge;
        hero.health -= subjects[current_subject].member0xFC;

        hero.subject[current_subject].knowledge -= subjects[current_subject].member0x100 + Random(subjects[current_subject].member0xFC);

        if (!jg(hero.health, 0)) {
          is_end = 1;
          death_cause = aAlTruizmNeDove;
        }

        await hour_pass();

      } else {

        GotoXY(1, 0x0E);
        TextColor(0x0D);
        writeln(aUTebqNicegoNeV);
        await hour_pass();
        hero.health -= subjects[current_subject].member0xFC;
        if (!jg(hero.health, 0)) {
          is_end = 1;
          death_cause = aAlTruizmNeDove;
        }
      }

    } else if (ax === -2) {
      hero.brain -= Random(2);
      hero.charizma -= Random(2);
      hero.stamina -= Random(2);
    }

  }

  await wait_for_key();
  TextColor(7);
  ClrScr();
} // end function 1B986


let aKuzMenko = 'Кузьменко:';
let a___Otformatiro = '"... отформатировать дискету так, чтобы 1ый сектор был 5ым ..."';
let aAViNigdeNeVide = '"А Вы нигде не видели литературы по фильтрам в Windows?"';
let a___NapisatVizu = '"... написать визуализацию байта на ассемблере за 11 байт ..."';
let aUVasOlegPlissV = '"У вас Олег Плисс ведет какие-нибудь занятия?"';
let aBillGatesMustD = '"Bill Gates = must die = кабысдох (рус.)."';
let aViCitaliJurnal = '"Вы читали журнал "Монитор"? Хотя вряд ли..."';
let aQSlisalCtoMmhe = '"Я слышал, что mmHeroes написана на BP 7.0."';
let aZapisivaitesNa = '"Записывайтесь на мой семинар по языку Си!"';
let aNaTretEmKurseQ = '"На третьем курсе я буду вести у вас спецвычпрактикум."';
let aInteresnoKog_0 = '"Интересно, когда они снова наладят STAR?"';
let aPoluciteSebeQs = '"Получите себе ящик rambler\'e или на mail.ru !"';
let aARazveTerexovS = '"А разве Терехов-старший ничего не рассказывает про IBM PC?"';


function sub_1BE39() {
  GotoXY(1, 8);
  TextColor(7);
  write(aKuzMenko);
  TextColor(0x0F);
  let ax = Random(0x0C);
  if (ax === 0) {
    writeln(a___Otformatiro);
  } else if (ax === 1) {
    writeln(aAViNigdeNeVide);
  } else if (ax === 2) {
    writeln(a___NapisatVizu);
  } else if (ax === 3) {
    writeln(aUVasOlegPlissV);
  } else if (ax === 4) {
    writeln(aBillGatesMustD);
  } else if (ax === 5) {
    writeln(aViCitaliJurnal);
  } else if (ax === 6) {
    writeln(aQSlisalCtoMmhe);
  } else if (ax === 7) {
    writeln(aZapisivaitesNa);
  } else if (ax === 8) {
    writeln(aNaTretEmKurseQ);
  } else if (ax === 9) {
    writeln(aInteresnoKog_0);
  } else if (ax === 0xA) {
    writeln(aPoluciteSebeQs);
  } else if (ax === 0xB) {
    writeln(aARazveTerexovS);
  }
} // end function 1BE39


let aKuzMenko_0 = 'Кузьменко:';
let aViZnaeteKlimov = '"Вы знаете, Климова можно найти в компьютерном классе';
let aGoMaqS = '-го мая с ';
let aPo = ' по ';
let aC__ = 'ч.."';


async function sub_1C02B() {
  let var_8;
  let var_6;
  let var_4;
  let var_1;

  ClrScr();
  show_header_stats();
  var_6 = 0;
  var_1 = 0;
  var_8 = day_of_week + 1;
  if (jge(5, var_8)) {
    for (var_4 = 5; var_4 >= var_8; --var_4) {
      if (hero.charizma > Random(0x12)) {
        if (!jnz(timesheet[var_4][Infa].where, 0)) {
          if (var_1 === 0) {
            var_1 = 1;
            var_6 = var_4;
            timesheet[var_6][Infa].where = 3;
            timesheet[var_6][Infa].from = Random(5) + 0xA;
            timesheet[var_6][Infa].to = timesheet[var_6][Infa].from + 1 + Random(2);
          }
        }
      }
    }
  }


  if (var_1 && klimov_timesheet_was_modified < 2) {

    GotoXY(1, 8);
    ++klimov_timesheet_was_modified;
    TextColor(7);
    write(aKuzMenko_0);
    TextColor(0x0F);
    writeln(aViZnaeteKlimov);
    write(var_6 + 0x16);
    write(aGoMaqS);

    write(timesheet[var_6][Infa].from);
    write(aPo);
    write(timesheet[var_6][Infa].to);
    writeln(aC__);

  } else {

    sub_1BE39();

  }

  await wait_for_key();
  TextColor(7);
  ClrScr();
} // end function 1C02B


let aDjug_0 = 'DJuG:';
let aUVasKakoiToSko = '"У Вас какой-то школьный метод решения задач..."';
let aNeObsaisqSTorm = 'Не общайся с тормозами!';


async function sub_1C1FF() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  TextColor(7);
  writeln(aDjug_0);
  TextColor(0x0F);
  writeln(aUVasKakoiToSko);

  if (hero.subject[GiT].knowledge > 5) {
    hero.subject[GiT].knowledge -= Random(5);
  }

  decrease_health(0x0F, aNeObsaisqSTorm);
  await wait_for_key();
  TextColor(7);
  ClrScr();
} // end function 1C1FF


let aAndru_1 = 'Эндрю: ';
let aSkajiDiamondUC = '"Скажи Diamond\'у, что маловато описалова!"';
let aAEseDiamondDum = '"А еще Diamond думал переписать это на JavaScript."';
let aAQZnauViigrisn = '"А я знаю выигрышную стратегию! Если только не замочат..."';
let aVoobseToVseAto = '"Вообще-то, все это происходит в мае 1998 г."';
let aQVidelNadpisNa = '"Я видел надпись на парте: ЗАКОН ВСЕМИРНОВА ТЯГОТЕНИЯ"';
let aZaglqniNaMmh_0 = '"Загляни на mmheroes.chat.ru!"';
let aTolKoNePredlag = '"Только не предлагай Diamond\'у переписать все на Прологе!"';
let aNuKogdaJeBudet = '"Ну когда же будет порт под Linux?"';
let aVmwareSuxx___N = '"VMWARE - SUXX... Но под ним идут Heroes of Mat & Mech!"';
let aPoxojeCtoMoqSt = '"Похоже, что моя стратегия обламывается..."';
let aUxTiGamma3_14V = '"Ух ты! Гамма 3.14 - в этом что-то есть."';
let aMojetBitDiamon = '"Может быть, Diamond\'а просто заклинило на многоточиях?"';
let aGovorqtMojnoZa = '"Говорят, можно зарабатывать деньги, почти ничего не делая."';
let aVotInogdaMnePr = '"Вот, иногда мне приходится тяжко - когда пристают всякие..."';
let aXorosoLiCtoMno = '"Хорошо ли, что многие реплики персонажей посвящены самой игре?"';
let aPomogiteMneXoc = '"Помогите мне! Хочу в Inet!"';
let aACto = '"А что? А ничего."';
let aEsliOnoCvetaBo = '"Если оно цвета бордо - значит, оно тебе снится."';
let aVsexSDnemMatMe = '"Всех с ДНЕМ МАТ-МЕХА!"';
let aPridumaiSvouFr = '"Придумай свою фразу для персонажа!"';
let a120kIsxodnikov = '"120К исходников - вот что такое mmHeroes!"';
let a120kVesMaKrivi = '"120К весьма кривых исходников - вот что такое mmHeroes!"';
let aQPodozrevauC_0 = '"Я подозреваю, что ';
let aNicegoTebeNeZa = ' ничего тебе не засчитает."';
let aZactetTebeZa1Z = ' зачтет тебе за 1 заход ';
let a__1 = '."';


function sub_1C6DC(/*arg_0*/) {
  TextColor(7);
  write(aAndru_1);
  TextColor(0x0F);

  if (Random(3) > 0) {

    writeln([
      aSkajiDiamondUC, aAEseDiamondDum, aAQZnauViigrisn, aVoobseToVseAto,
      aQVidelNadpisNa, aZaglqniNaMmh_0, aTolKoNePredlag, aNuKogdaJeBudet,
      aVmwareSuxx___N, aPoxojeCtoMoqSt, aUxTiGamma3_14V, aMojetBitDiamon,
      aGovorqtMojnoZa, aVotInogdaMnePr, aXorosoLiCtoMno, aPomogiteMneXoc,
      aACto, aEsliOnoCvetaBo, aVsexSDnemMatMe, aPridumaiSvouFr,
      a120kIsxodnikov, a120kVesMaKrivi
    ][Random(0x16)]);

  } else {

    let bp_var_6 = random_from_to(0, 5);
    let bp_var_8 = hero.subject[current_subject].knowledge - subjects[current_subject].member0xFA + Random(hero.brain);

    if (!jg(hero.health, 5)) {
      bp_var_8 -= Random(5 - hero.health);
    }

    if (!jle(bp_var_8, 0)) {
      bp_var_8 = Round(Sqrt(bp_var_8) / subjects[current_subject].member0x100);
    } else {
      bp_var_8 = 0;
    }

    if (!jle(hero.subject[current_subject].tasks_done + bp_var_8, subjects[current_subject].tasks)) {
      bp_var_8 = subjects[current_subject].tasks - hero.subject[current_subject].tasks_done;
    }

    write(aQPodozrevauC_0);
    write(subjects[bp_var_6].professor.name);

    if (!jnz(bp_var_8, 0)) {
      writeln(aNicegoTebeNeZa);
    } else {
      write(aZactetTebeZa1Z);
      write(bp_var_8);
      zadanie_in_case(bp_var_8);
      writeln(a__1);
    }
  }

  TextColor(7);

} // end function 1C6DC


let aObratitSqKAndr = 'Обратиться к Эндрю за помощью?';
let aDaCemQXujeDrug = 'Да, чем я хуже других?';
let aNetQUjKakNibud = 'Нет, я уж как-нибудь сам...';
let aAndruVglqdivae = 'Эндрю вглядывается в твои задачки,';
let aINacinaetDumat = 'и начинает думать очень громко...';
let aPokaAndruTakNa = 'Пока Эндрю так напрягается, ты не можешь ни на чем сосредоточиться!';
let aUAndruNicegoNe = 'У Эндрю ничего не вышло...';
let aAndruResilTebe = 'Эндрю решил тебе ';
let aNadoBudetPodoi = 'Надо будет подойти с зачеткой!';
let aAndruTebqIgnor = 'Эндрю тебя игнорирует!';
let aAndruTojeUmeet = 'Эндрю тоже умеет отбиваться от разных нехороших людей.';


async function sub_1CC94() {
  let var_6;
  let var_4;

  ClrScr();
  show_header_stats();
  GotoXY(1, 8);

  if (current_subject === -1) {
    sub_1C6DC();
  } else {
    write(aObratitSqKAndr);
    dialog_start();
    dialog_case(aDaCemQXujeDrug, -1);
    dialog_case(aNetQUjKakNibud, -2);
    let ax = await dialog_run(1, 0x0A);

    if (ax === -1) {

      var_4 = Random(0x0E);
      if (jl(var_4, hero.charizma)) {

        GotoXY(1, 0x0D);
        writeln(aAndruVglqdivae);
        writeln(aINacinaetDumat);
        writeln(aPokaAndruTakNa);

        var_6 = Trunc(Sqrt(Random(subjects[current_subject].tasks - hero.subject[current_subject].tasks_done)));

        if (!jle(var_6, 2)) {
          var_6 = 0;
        }

        hero.stamina -= Random(2);

        if (!jnz(var_6, 0)) {
          writeln(aUAndruNicegoNe);
        } else {
          TextColor(7);
          write(aAndruResilTebe);
          TextColor(0x0F);
          write(var_6);
          TextColor(7);
          zadanie_in_case(var_6);
          writeln('!');

          hero.subject[current_subject].tasks_done += var_6;
          if (!jl(hero.subject[current_subject].tasks_done, subjects[current_subject].tasks)) {
            writeln(aNadoBudetPodoi);
          }
        }

        await hour_pass();

      } else {
        GotoXY(1, 0x0D);
        TextColor(0x0C);
        writeln(aAndruTebqIgnor);
        decrease_health(Random(5) + 2, aAndruTojeUmeet);
      }

    } else if (ax === -2) {
      GotoXY(1, 0x0D);
      sub_1C6DC();
    }

  }

  await wait_for_key();
  TextColor(7);
  ClrScr();
} // end function 1CC94


let aATiNeXocesUstr = '"А ты не хочешь устроиться в ТЕРКОМ? Может, кое-чего подзаработаешь..."';
let aDaMneBiNePomes = 'Да, мне бы не помешало.';
let aNetQLucsePoucu = 'Нет, я лучше поучусь уще чуток.';
let aPozdravlquTepe = '"Поздравляю, теперь ты можешь идти в "контору"!"';
let aKakXoces_TolKo = '"Как хочешь. Только смотри, не заучись там ..."';
let aKstatiQTutZnau = '"Кстати, я тут знаю один качественно работающий прокси-сервер..."';
let aTiZapisivaesAd = 'Ты записываешь адрес. Вдруг пригодится?';
let aGrisa_1 = 'Гриша:';
let aXocuXalqvi = '"Хочу халявы!"';
let aPriidiJeOXalqv = '"Прийди же, о халява!"';
let aXalqvaEstEeNeM = '"Халява есть - ее не может не быть."';
let aDavaiOrganizue = '"Давай организуем клуб любетелей халявы!"';
let aCtobiPolucitDi = '"Чтобы получить диплом, учиться совершенно необязательно!"';
let aNuVotTiGotovil = '"Ну вот, ты готовился... Помогло это тебе?"';
let aNaTretEmKurseN = '"На третьем курсе на лекции уже никто не ходит. Почти никто."';
let aVotBeriPrimerS = '"Вот, бери пример с Коли."';
let aNenavijuLVaTol = '"Ненавижу Льва Толстого! Вчера "Войну и мир" <йк> ксерил..."';
let aAVPomiLucseVoo = '"А в ПОМИ лучше вообще не ездить!"';
let aImenaGlavnixXa = '"Имена главных халявчиков и алкоголиков висят на баобабе."';
let aPravilNoLucseP = '"Правильно, лучше посидим здесь и оттянемся!"';
let aKonspektirovat = '"Конспектировать ничего не надо. В мире есть ксероксы!"';
let aASCetvertogoKu = '"А с четвертого курса вылететь уже почти невозможно."';
let aVotUMexanikovU = '"Вот у механиков - у них халява!"';
let aIEsePoPivu___ = 'И еще по пиву...';
let aGubitLudeiNePi = 'Губит людей не пиво, а избыток пива.';
let aIEseOdinCasPro = 'И еще один час прошел в бесплодных разговорах...';


async function sub_1D30D() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);

  if (jz(hero.is_working_in_terkom, 0) && hero.charizma > Random(0x14)) {

    TextColor(0x0E);
    write(aATiNeXocesUstr);

    dialog_start();
    dialog_case(aDaMneBiNePomes, -1);
    dialog_case(aNetQLucsePoucu, -2);
    let ax = await dialog_run(1, 0x0A);

    if (ax === -1) {
      hero.is_working_in_terkom = 1;
      GotoXY(1, 0x0E);
      writeln(aPozdravlquTepe);
    } else if (ax === -2) {
      GotoXY(1, 0x0E);
      writeln(aKakXoces_TolKo);
    }

  } else {

    if (hero.charizma > Random(0x14) && !jnz(hero.has_inet, 0)) {
      writeln(aKstatiQTutZnau);
      TextColor(7);
      writeln();
      writeln(aTiZapisivaesAd);
      hero.has_inet = 1;
    } else {

      GotoXY(1, 8);
      TextColor(7);
      write(aGrisa_1);
      TextColor(0x0E);

      const ax = Random(0x0F);
      if (ax === 0) {
        writeln(aXocuXalqvi);
      } else if (ax === 1) {
        writeln(aPriidiJeOXalqv);
      } else if (ax === 2) {
        writeln(aXalqvaEstEeNeM);
      } else if (ax === 3) {
        writeln(aDavaiOrganizue);
      } else if (ax === 4) {
        writeln(aCtobiPolucitDi);
      } else if (ax === 5) {
        writeln(aNuVotTiGotovil);
      } else if (ax === 6) {
        writeln(aNaTretEmKurseN);
      } else if (ax === 7) {
        writeln(aVotBeriPrimerS);
      } else if (ax === 8) {
        writeln(aNenavijuLVaTol);
      } else if (ax === 9) {
        writeln(aAVPomiLucseVoo);
      } else if (ax === 0xA) {
        writeln(aImenaGlavnixXa);
      } else if (ax === 0xB) {
        writeln(aPravilNoLucseP);
      } else if (ax === 0xC) {
        writeln(aKonspektirovat);
      } else if (ax === 0xD) {
        writeln(aASCetvertogoKu);
      } else if (ax === 0xE) {
        writeln(aVotUMexanikovU);
      }

      TextColor(7);
      if (!jbe(Random(3), 0)) {
        writeln(aIEsePoPivu___);
        hero.brain -= Random(2);
        if (!jg(hero.brain, 0)) {
          hero.health = 0;
          is_end = 1;
          death_cause = aGubitLudeiNePi;
        }
        hero.charizma += Random(2);
      }

      if (!jnz(Random(3), 0)) {
        writeln(aIEseOdinCasPro);
        await hour_pass();
      }
    }
  }

  await wait_for_key();
  ClrScr();
} // end function 1D30D


async function talk_with_classmate(arg_0) {
  if (arg_0 === 0) {
    await sub_19259();
  } else if (arg_0 === 2) {
    await sub_19B20();
  } else if (arg_0 === 3) {
    await sub_1A0A2();
  } else if (arg_0 === 1) {
    await sub_1B526();
  } else if (arg_0 === 4) {
    await sub_1A70A();
  } else if (arg_0 === 5) {
    await sub_1B09A();
  } else if (arg_0 === 6) {
    await sub_1B6B7();
  } else if (arg_0 === 7) {
    await sub_1B986();
  } else if (arg_0 === 8) {
    await sub_1C02B();
  } else if (arg_0 === 9) {
    await sub_1C1FF();
  } else if (arg_0 === 0xA) {
    await sub_1CC94();
  } else if (arg_0 === 0xB) {
    await sub_1D30D();
  }
} // end function 1D6CE


let aRozovieSloniki = 'Розовые слоники с блестящими крылышками';
let aZelenieCelovec = 'Зеленые человечки с длинными антеннами';
let aOveckiSOslepit = 'Овечки с ослепительно-белой шерстью';
let aSidqtSOkosevsi = 'сидят с окосевшими глазами в Мавзолее';
let aIScitautOprede = 'и считают определитель матрицы 10 на 10';
let aIIsutJordanovu = 'и ищут Жорданову форму матрицы';
let aIVozvodqtMatri = 'и возводят матрицы в 239-ю степень';
let aIResautLineinu = 'и решают линейную систему уравнений с параметрами';
let aIDokazivautNep = 'и доказывают неприводимость многочлена 10-й степени над Z';
let aIDokazivautSxo = 'и доказывают сходимость неопределенного интеграла с параметрами';
let aIScitautSummuR = 'и считают сумму ряда с параметрами';
let aIDifferenciruu = 'и дифференцируют, дифференцируют, дифференцируют';
let aIBerutIntergal = 'и берут интергалы не отдают их';
let aIResautZadaciP = 'и решают задачи по математической болтологии';
let a____7 = '...';
let aGospodiNuIPris = 'Господи! Ну и присниться же такое!';
let aZaToTeperTiToc = 'За то теперь ты точно знаешь,';
let aCtoSnitsqStude = 'что снится студентам-математикам,';
let aKogdaOniVneKon = 'когда они вне кондиции';


async function sub_1DA3D() {
  ClrScr();
  TextColor(0x0D);

  let ax;
  ax = Random(3);
  if (ax === 0) {
    writeln(aRozovieSloniki);
  } else if (ax === 1) {
    writeln(aZelenieCelovec);
  } else if (ax === 2) {
    writeln(aOveckiSOslepit);
  }

  writeln(aSidqtSOkosevsi);

  ax = Random(0x0A);
  if (ax === 0) {
    writeln(aIScitautOprede);
  } else if (ax === 1) {
    writeln(aIIsutJordanovu);
  } else if (ax === 2) {
    writeln(aIVozvodqtMatri);
  } else if (ax === 3) {
    writeln(aIResautLineinu);
  } else if (ax === 4) {
    writeln(aIDokazivautNep);
  } else if (ax === 5) {
    writeln(aIDokazivautSxo);
  } else if (ax === 6) {
    writeln(aIScitautSummuR);
  } else if (ax === 7) {
    writeln(aIDifferenciruu);
  } else if (ax === 8) {
    writeln(aIBerutIntergal);
  } else if (ax === 9) {
    writeln(aIResautZadaciP);
  }

  writeln(a____7);
  await ReadKey();
  writeln();
  writeln(aGospodiNuIPris);
  writeln(aZaToTeperTiToc);
  writeln(aCtoSnitsqStude);
  writeln(aKogdaOniVneKon);
  writeln(a____7);
  await ReadKey();
  hero.health = Random(0x0A) + 0xA;
} // end function 1DA3D


let aTiSlisisMqgkii = 'Ты слышишь мягкий, ненавязчивый голос:';
let aAViDeistvitelN = '"А Вы действительно правильно выбрали';
let aSebeSpecialNos = ' себе специальность?"';
let aIntegral___ = '"Интеграл..."';
let aKakoiIntegral = '"Какой интеграл?"';
let aDaVotJeOnMiEgo = '"Да вот же он, мы его только что стерли!"';
let aViKonecnoVelik = '"Вы, конечно, великий парильщик.';
let aNoAtuZadacuQVa = ' Но эту задачу я Вам засчитаю."';
let aACtoUNasSegodn = '"А что, у нас сегодня разве аудиторное занятие?"';
let aWellLastTimeIF = '"Well, last time I found a pencil left by one of you.';
let aIWillReturnItT = ' I will return it to the owner, if he or she';
let aCanTellMeSomeN = ' can tell me some nice and pleasant words.';
let aIAmALadyNotYou = ' I am a lady, not your computer!"';
let aVSleduusemSe_0 = '"В следующем семестре вы должны будете написать реферат';
let aNaTemuBegVMiro = ' на тему "Бег в мировой литературе". В качестве первоисточника';
let aMojeteVzqtOdno = ' можете взять одноименный роман Булгакова."';
let aNuVsePoxojeZau = 'Ну все, похоже, заучился - если преподы по ночам снятся...';


async function sub_1DF40() {
  ClrScr();
  TextColor(0x0D);

  if (last_subject === 0) {
    writeln(aTiSlisisMqgkii);
    writeln(aAViDeistvitelN);
    writeln(aSebeSpecialNos);
  } else if (last_subject === 1) {
    writeln(aIntegral___);
    writeln(aKakoiIntegral);
    writeln(aDaVotJeOnMiEgo);
  } else if (last_subject === 2) {
    writeln(aViKonecnoVelik);
    writeln(aNoAtuZadacuQVa);
  } else if (last_subject === 3) {
    writeln(aACtoUNasSegodn);
  } else if (last_subject === 4) {
    writeln(aWellLastTimeIF);
    writeln(aIWillReturnItT);
    writeln(aCanTellMeSomeN);
    writeln(aIAmALadyNotYou);
  } else if (last_subject === 5) {
    writeln(aVSleduusemSe_0);
    writeln(aNaTemuBegVMiro);
    writeln(aMojeteVzqtOdno);
  }

  writeln();
  writeln(aNuVsePoxojeZau);
  await ReadKey();
} // end function 1DF40


let aZdravstvuite__ = '"Здравствуйте!" ...';
let aOnoBolSoe___ = 'Оно большое ...';
let aOnoPixtit___ = 'Оно пыхтит! ...';
let aOnoMedlennoPol = 'Оно медленно ползет прямо на тебя!!! ...';
let aOnoGovoritCelo = 'Оно говорит человеческим голосом:';
let aMolodoiCelovek = '"Молодой человек. Когда-нибудь Вы вырастете';
let aIBudeteRabotat = 'и будете работать на большой машине.';
let aVamNadoBudetNa = 'Вам надо будет нажать кнопку жизни,';
let aAViNajmeteKnop = 'а Вы нажмете кнопку смерти ..."';
let aAtoVSredneveko = '"Это в средневековье ученые спорили,';
let aSkolKoCerteiMo = 'сколько чертей может поместиться';
let aNaKoncikeIgli_ = 'на кончике иглы..."';
let aZadaciMojnoRes = '"Задачи можно решать по-разному.';
let aMojnoUstnoMojn = 'Можно устно, можно на бумажке,';
let aMojnoIgraqVKre = 'можно - играя в крестики-нолики...';
let aAMojnoProstoSp = 'А можно - просто списать ответ в конце задачника!"';
let a____8 = '...';
let aUfff___CtoToSe = 'Уффф... Что-то сегодня опять какие-то гадости снятся.';
let aVsePoraZavqziv = 'Все, пора завязывать с этим. Нельзя так много учиться.';


async function sub_1E37C() {
  ClrScr();
  TextColor(0x0D);
  writeln(aZdravstvuite__);
  await ReadKey();
  writeln(aOnoBolSoe___);
  await ReadKey();
  writeln(aOnoPixtit___);
  await ReadKey();
  writeln(aOnoMedlennoPol);
  await ReadKey();
  writeln(aOnoGovoritCelo);
  TextColor(7);

  let ax = Random(3);
  if (ax === 0) {
    writeln(aMolodoiCelovek);
    writeln(aIBudeteRabotat);
    writeln(aVamNadoBudetNa);
    writeln(aAViNajmeteKnop);
  } else if (ax === 1) {
    writeln(aAtoVSredneveko);
    writeln(aSkolKoCerteiMo);
    writeln(aNaKoncikeIgli_);
  } else if (ax === 2) {
    writeln(aZadaciMojnoRes);
    writeln(aMojnoUstnoMojn);
    writeln(aMojnoIgraqVKre);
    writeln(aAMojnoProstoSp);
  }

  TextColor(0x0D);
  writeln(a____8);
  await ReadKey();
  writeln();
  writeln(aUfff___CtoToSe);
  writeln(aVsePoraZavqziv);
  await ReadKey();
  hero.health = Random(0x0A) + 0xA;
} // end function 1E37C


let aPrevratilsqVOv = 'Превратился в овощ.';


async function sub_1E5A3() {
  let var_4 = 0;

  for (let var_2 = 0; var_2 <= 2; ++var_2) {
    synopsis[var_2].sasha_has = 1;
  }

  hero.is_invited = 0;
  if (!jg(hero.brain, 2)) {
    hero.brain = 2;
    var_4 = 1;
  }

  if (!jg(hero.stamina, 0)) {
    is_end = 1;
    hero.health = 0;
    death_cause = aPrevratilsqVOv;
  }

  if (!jz(hero.knows_djug, 0)) {
    var_4 = 2;
  }

  if (!jnz(Random(2), 0)) {
    if (var_4 === 1) {
      await sub_1DA3D();
    } else if (var_4 === 2) {
      await sub_1E37C();
    } else {
      if (!jnz(Random(3), 0)) {
        await sub_1DF40();
      }
    }
  }

  hero.knows_djug = 0;
} // end function 1E5A3


async function rest_in_obschaga() {
  hero.health += 7 + Random(8);
  await hour_pass();
} // end function 1E647


async function request_exit() {
  await prompt_exit();
} // end function 1E66B


let aVremqVislo_ = 'Время вышло.';


async function goto_sleep() {
  let var_4;
  let var_2;

  current_subject = -1;
  current_place = 4;

  if (!jle(day_of_week, 5)) {
    is_end = 1;
    death_cause = aVremqVislo_;
    return;
  }

  if (!jle(hero.health, 0x28)) {
    hero.health = 0x28;
  }

  var_2 = hero.health + 0xF + Random(0x14);

  if (!jle(var_2, 0x32)) {
    var_2 = 0x32;
  }

  var_2 -= hero.health;
  hero.health += var_2;
  var_4 = Random(idiv(var_2, 4)) + 7;
  time_of_day += var_4;

  if (time_of_day > 23) {

    time_of_day %= 24;
    ++day_of_week;

    if (day_of_week > 5) {
      is_end = 1;
      death_cause = aVremqVislo_;
    } else {
      // #warning new code
    }
  }

  await sub_1E5A3();

  if (time_of_day <= 4) {
    time_of_day = 5;
  }

  if (hero.garlic > 0) {
    --hero.garlic;
    hero.charizma += Random(2);
  }

} // end function 1E682


let aTiGlqdisNaCasi = 'Ты глядишь на часы и видишь: уже полночь!';
let aNaPosledneiAle = 'На последней электричке ты едешь домой, в общагу.';
let aZasnulVAlektri = 'Заснул в электричке и не проснулся.';


async function sub_1E7F8() {
  ClrScr();
  TextColor(7);
  writeln(aTiGlqdisNaCasi);
  writeln(aNaPosledneiAle);
  hero.health -= 4;

  if (!jge(hero.health, 1)) {
    is_end = 1;
    death_cause = aZasnulVAlektri;
  }

  current_place = 4;
  current_subject = -1;
  await wait_for_key();
  ClrScr();
} // end function 1E7F8


let aVaxtersaGlqdit = 'Вахтерша глядит на тебя странными глазами:';
let aCtoMojetDelatB = 'что может делать бедный студент в университете в полночь?';
let aNeZnaqOtvetNaA = 'Не зная ответ на этот вопрос, ты спешишь в общагу.';


async function sub_1E907() {
  ClrScr();
  TextColor(7);
  writeln(aVaxtersaGlqdit);
  writeln(aCtoMojetDelatB);
  writeln(aNeZnaqOtvetNaA);
  current_place = 4;
  current_subject = -1;
  await wait_for_key();
  ClrScr();
} // end function 1E907


let aMavzoleiZakriv = 'Мавзолей закрывается.';
let aPoraDomoi = 'Пора домой!';


async function sub_1E993() {
  ClrScr();
  TextColor(7);
  writeln(aMavzoleiZakriv);
  writeln(aPoraDomoi);
  current_place = 4;
  current_subject = -1;
  await wait_for_key();
  ClrScr();
} // end function 1E993


async function midnight() {
  if (current_place === 2) {
    await sub_1E7F8();
  } else if (current_place === 1) {
    await sub_1E907();
  } else if (current_place === 5) {
    await sub_1E993();
  } else if (current_place === 4) {
    await goto_sleep();
  }
} // end function 1E9E7


let aDjugAtoSmertel = 'DJuG - это смертельно!';
let aBurnoProgressi = 'Бурно прогрессирующая паранойя.';


async function hour_pass() {
  terkom_has_places = 1;
  sub_1F184();
  ++time_of_day;

  if (current_subject === 2 && current_place === 2) {
    decrease_health(6, aDjugAtoSmertel);
    hero.knows_djug = 1;
  }

  if (hero.charizma <= 0) {
    hero.health = 0;
    is_end = 1;
    death_cause = aBurnoProgressi;
  }

  if (time_of_day === 24) {
    ++day_of_week;
    time_of_day = 0;
    await midnight();
  }

  if (hero.charizma > Random(0x0A)) {
    byte_254A4 = 0;
  }

} // end function 1EA4F


let aNuMojetNeNadoT = 'Ну, может не надо так резко...';
let aTiCtoSerEznoXo = 'Ты что, серьезно хочешь закончить игру?';
let aNetNeXocu = 'Нет, не хочу!';
let aQJeSkazalSMenq = 'Я же сказал: с меня хватит!';
let aViselSam_ = 'Вышел сам.';


async function prompt_exit() {
  ClrScr();
  writeln(aNuMojetNeNadoT);
  writeln(aTiCtoSerEznoXo);
  dialog_start();
  dialog_case(aNetNeXocu, -1);
  dialog_case(aQJeSkazalSMenq, -2);
  if (await dialog_run(1, 4) === -2) {
    is_end = 1;
    death_cause = aViselSam_;
  }
  ClrScr();
} // end function 1EB5C


function is_professor_here(subj) {
  if (day_of_week >= 0 && day_of_week <= 5) {
    let ts = timesheet[day_of_week][subj];
    return time_of_day >= ts.from && time_of_day < ts.to && ts.where === current_place;
  } else {
    return 0;
  }
} // end function 1EBE0


function is_professor_here_today(subj) {
  if (day_of_week >= 0 && day_of_week <= 5) {
    return timesheet[day_of_week][subj].where === current_place;
  } else {
    return 0;
  }
} // end function 1EC48


function time_between_9_and_19() {
  return time_of_day > 8 && time_of_day < 20;
} // end function 1EC75


function sub_1EC97(/*arg_0*/) {
  if (time_between_9_and_19()) {
    classmates[Kolya].place = 5;
  } else {
    classmates[Kolya].place = 0;
  }
  classmates[Kolya].current_subject = -1;
} // end function 1EC97


function locatePasha(/*arg_0*/) {
  // #warning arg_0, [arg_0 + var_2 + 0|1]
  let bp_var_2 = [0, 0];

  if (time_between_9_and_19()) {
    classmates[Pasha].place = 1;
  } else {
    classmates[Pasha].place = 0;
  }

  classmates[Pasha].current_subject = -1;

  do {
    for (let var_2 = 0; var_2 <= 2; ++var_2) {
      if (!jz(is_professor_here_today(var_2), 0)) {
        bp_var_2[0] = 1;
        if (!jbe(Random(0x0A), 5)) {
          bp_var_2[1] = 1;
          classmates[Pasha].place = timesheet[day_of_week][var_2].where;
          classmates[Pasha].current_subject = var_2;
        }
      }
    }

  } while (!(bp_var_2[1] !== 0) && (bp_var_2[0] !== 0));

  console.log(classmates[Pasha]);
} // end function 1ECBC


function sub_1ED56(/*arg_0*/) {
  // #warning arg_0, [arg_0 + var_2 + 1]
  let bp_var_2 = [0, 0];

  if (time_between_9_and_19()) {
    classmates[Diamond].place = 3;
  } else {
    classmates[Diamond].place = 0;
  }

  classmates[Diamond].current_subject = -1;

  for (let var_2 = 5; var_2 >= 0; --var_2) {
    if (!jz(is_professor_here_today(var_2), 0)) {
      if (bp_var_2[1] === 0) {
        if (!jbe(Random(0x0A), 5)) {
          classmates[Diamond].place = timesheet[day_of_week][var_2].where;
          classmates[Diamond].current_subject = var_2;
        }
      }
    }
  }
} // end function 1ED56


function sub_1EDCC(/*arg_0*/) {
  if (!jz(is_professor_here(Algebra), 0)) {
    classmates[Rai].place = timesheet[day_of_week][Algebra].where;
    classmates[Rai].current_subject = 0;
    return;
  }

  if (!jz(is_professor_here(Matan), 0)) {
    classmates[Rai].place = timesheet[day_of_week][Matan].where;
    classmates[Rai].current_subject = 1;
    return;
  }

  if (time_between_9_and_19()) {
    classmates[Rai].place = 3;
  } else {
    classmates[Rai].place = 0;
  }

  classmates[Rai].current_subject = -1;
} // end function 1EDCC


function sub_1EE2C(/*arg_0*/) {
  // #warning arg_0, [arg_0 + var_2 + 0|1]
  let bp_var_2 = [0, 0];

  if (time_between_9_and_19()) {
    classmates[Misha].place = 1;
  } else {
    classmates[Misha].place = 0;
  }

  classmates[Misha].current_subject = -1;

  do {
    for (let var_2 = 4; var_2 >= 0; --var_2) {

      if (!jz(is_professor_here_today(var_2), 0)) {
        if (!jz(var_2, 3)) {
          bp_var_2[0] = 1;

          if (!jbe(Random(0x0A), 5)) {
            bp_var_2[1] = 1;
            classmates[Misha].place = timesheet[day_of_week][var_2].where;
            classmates[Misha].current_subject = var_2;
          }
        }
      }
    }
  } while (!jnz(bp_var_2[1], 0) && jnz(bp_var_2[0], 0));

} // end function 1EE2C


function sub_1EECC(/*arg_0*/) {
  // #warning arg_0, [arg_0 + var_2 + 0|1]
  let bp_var_2 = [0, 0];

  if (time_between_9_and_19()) {
    classmates[Serzg].place = 1;
  } else {
    classmates[Serzg].place = 0;
  }

  classmates[Serzg].current_subject = -1;

  do {
    for (let var_2 = 5; var_2 >= 0; --var_2) {

      if (!jz(is_professor_here_today(var_2), 0)) {
        bp_var_2[0] = 1;
        if (!jbe(Random(0x0A), 5)) {
          bp_var_2[1] = 1;
          classmates[Serzg].place = timesheet[day_of_week][var_2].where;
          classmates[Serzg].current_subject = var_2;
        }
      }
    }
  } while (!jnz(bp_var_2[1], 0) && jnz(bp_var_2[0], 0));

} // end function 1EECC


function sub_1EF66(/*arg_0*/) {
  classmates[Sasha].current_subject = -1;
  if (time_between_9_and_19()) {
    if (!jnz(Random(4), 0)) {
      classmates[Sasha].place = 1;
    } else {
      classmates[Sasha].place = 0;
    }
  } else {
    classmates[Sasha].place = 0;
  }
} // end function 1EF66


function sub_1EF9E(/*arg_0*/) {
  // #warning arg_0, [arg_0 + var_2 + 0|1]
  let bp_var_2 = [0, 0];

  classmates[Nil].place = 0;
  classmates[Nil].current_subject = -1;

  do {
    for (let var_2 = 0; var_2 <= 2; ++var_2) {
      if (!jz(is_professor_here_today(var_2), 0)) {
        bp_var_2[0] = 1;
        if (!jbe(Random(0x0A), 5)) {
          bp_var_2[1] = 1;
          classmates[Nil].place = timesheet[day_of_week][var_2].where;
          classmates[Nil].current_subject = var_2;
        }
      }
    }
  } while (!jnz(bp_var_2[1], 0) && jnz(bp_var_2[0], 0));

} // end function 1EF9E


function sub_1F025(/*arg_0*/) {
  if (time_between_9_and_19() && !jnz(Random(4), 0)) {
    classmates[Kuzmenko].place = 3;
    classmates[Kuzmenko].current_subject = -1;
  } else {
    classmates[Kuzmenko].place = 0;
    classmates[Kuzmenko].current_subject = -1;
  }
} // end function 1F025


function sub_1F05B() {
  classmates[Djug].place = 2;
  classmates[Djug].current_subject = 2;
} // end function 1F05B


function sub_1F06D() {
  classmates[Endryu].place = 1;
  classmates[Endryu].current_subject = 1;

  for (let var_2 = 0; var_2 <= 2; ++var_2) {
    if (!jz(is_professor_here_today(var_2), 0)) {
      if (!jbe(Random(0x0A), 5)) {
        classmates[Endryu].place = timesheet[day_of_week][var_2].where;
        classmates[Endryu].current_subject = var_2;
      }
    }
  }

} // end function 1F06D


function sub_1F0C6() {
  classmates[Grisha].current_subject = -1;
  if (!jnz(Random(3), 0)) {
    classmates[Grisha].place = 5;
  } else {
    classmates[Grisha].place = 0;
  }
} // end function 1F0C6


function sub_1F0EA(arg_0) {
  if (arg_0 === 0) {
    sub_1EC97();
  } else if (arg_0 === 2) {
    sub_1ED56();
  } else if (arg_0 === 1) {
    locatePasha();
  } else if (arg_0 === 3) {
    sub_1EDCC();
  } else if (arg_0 === 4) {
    sub_1EE2C();
  } else if (arg_0 === 5) {
    sub_1EECC();
  } else if (arg_0 === 6) {
    sub_1EF66();
  } else if (arg_0 === 7) {
    sub_1EF9E();
  } else if (arg_0 === 8) {
    sub_1F025();
  } else if (arg_0 === 9) {
    sub_1F05B();
  } else if (arg_0 === 0xA) {
    sub_1F06D();
  } else if (arg_0 === 0xB) {
    sub_1F0C6();
  }
} // end function 1F0EA


function sub_1F184() {
  for (let var_2 = 0; var_2 <= 0xB; ++var_2) {
    sub_1F0EA(var_2);
  }
} // end function 1F184


// =============================================================================


let aZadanie = ' задание';
let aZadaniq = ' задания';
let aZadanii = ' заданий';


function zadanie_in_case(number) {
  if (number === 1) {
    write(aZadanie);
  } else if (number >= 2 && number <= 4) {
    write(aZadaniq);
  } else {
    write(aZadanii);
  }
} // end function 1F1CB


function colored_output(color, str) {
  current_color = color;
  write(str);
  current_color = 7;
} // end function 1F22A


function colored_output_ln(color, str) {
  current_color = color;
  writeln(str);
  current_color = 7;
} // end function 1F26B


function output_with_highlighted_num(color, before, color_hi, number, after) {
  current_color = color;
  write(before);
  current_color = color_hi;
  write(number);
  current_color = color;
  write(after);
  current_color = 7;
} // end function 1F2AC


function colored_output_white(number) {
  current_color = 0x0F;
  write(number);
  current_color = 7;
} // end function 1F335


let aSegodnq = 'Сегодня ';
let aEMaq = 'е мая; ';
let asc_1F36E = '';
let a00 = ':00';
let aVersiq_0 = 'Версия ';
let aSamocuvstvie = 'Самочувствие: ';
let aJivoiTrup = 'живой труп';
let aPoraPomirat___ = 'пора помирать ...';
let aPloxoe = 'плохое';
let aTakSebe = 'так себе';
let aSrednee = 'среднее';
let aXorosee = 'хорошее';
let aOtlicnoe = 'отличное';
let aPloxo = 'Плохо';
let aUdovl_ = 'Удовл.';
let aXoroso = 'Хорошо';
let aOtlicno = 'Отлично';
let aFinansi = 'Финансы: ';
let aRub__3 = ' руб.';
let aNadoPolucitDen = 'Надо получить деньги за май...';
let aTiUspelPotrati = 'Ты успел потратить все деньги.';
let aKliniceskaqSme = 'Клиническая смерть мозга';
let aGolovaProstoNi = 'Голова просто никакая';
let aDumatPraktices = 'Думать практически невозможно';
let aDumatTrudno = 'Думать трудно';
let aGolovaPoctiVNo = 'Голова почти в норме';
let aGolovaVNorme = 'Голова в норме';
let aGolovaSvejaq = 'Голова свежая';
let aLegkostVMislqx = 'Легкость в мыслях необыкновенная';
let aObratitesKRazr = 'Обратитесь к разработчику ;)';
let aMamaRodiMenqOb = 'Мама, роди меня обратно!';
let aOkoncatelNoZau = 'Окончательно заучился';
let aQTakBolSeNemog = 'Я так больше немогууу!';
let aSkoreeBiVseAto = 'Скорее бы все это кончилось...';
let aEseNemnogoIPor = 'Еще немного и пора отдыхать';
let aNemnogoUstal = 'Немного устал';
let aGotovKTruduIOb = 'Готов к труду и обороне';
let aNasJdutVelikie = 'Нас ждут великие дела';
let aOcenZamknutiiT = 'Очень замкнутый товарищ';
let aPredpocitaesOd = 'Предпочитаешь одиночество';
let aTebeTrudnoObsa = 'Тебе трудно общаться с людьми';
let aTebeNeprostoOb = 'Тебе непросто общаться с людьми';
let aTiNormalNoOtno = 'Ты нормально относишься к окружающим';
let aUTebqMnogoDruz = 'У тебя много друзей';
let aUTebqOcenMnogo = 'У тебя очень много друзей';


function show_header_stats() {
  ClrScr();
  GotoXY(1, 1);
  output_with_highlighted_num(7, aSegodnq, 0xF, day_of_week + 0x16, aEMaq);
  output_with_highlighted_num(0xF, asc_1F36E, 0xF, time_of_day, a00);
  GotoXY(0x1A, 1);

  colored_output(0xD, aVersiq_0 + aGamma3_14);
  GotoXY(1, 2);
  write(aSamocuvstvie);

  let health_line = [1, 9, 0x11, 0x19, 0x21, 0x29];
  let health_str = [aJivoiTrup, aPoraPomirat___, aPloxoe, aTakSebe, aSrednee, aXorosee, aOtlicnoe];
  let health_col = [5, 4, 4, 0xE, 0xE, 0xA, 0xA];
  let health_i = _upper_bound(health_line, hero.health);
  colored_output(health_col[health_i], health_str[health_i]);

  let knowledge_line = [6, 0xD, 0x15, 0x1F];
  let knowledge_col = [3, 7, 0xF, 0xA, 0xE];
  let knowledge_subj_line = [
    [0xB, 0x15, 0x33],
    [9, 0x13, 0x29],
    [6, 0xB, 0x1F],
    [0xA, 0x10, 0x1F],
    [5, 9, 0x10],
    [5, 9, 0x10]
  ];
  let knowledge_subj_str = [aPloxo, aUdovl_, aXoroso, aOtlicno];
  let knowledge_subj_col = [3, 7, 0xF, 0xE];

  for (let subj = 0; subj <= 5; ++subj) {
    GotoXY(0x2D, subj + 1);
    colored_output(0xB, subjects[subj].title);

    GotoXY(0x43, subj + 1);
    let ax = hero.subject[subj].knowledge;
    current_color = knowledge_col[_upper_bound(knowledge_line, ax)];
    write(hero.subject[subj].knowledge);

    GotoXY(0x47, subj + 1);
    let k_i = _upper_bound(knowledge_subj_line[subj], ax);
    colored_output(knowledge_subj_col[k_i], knowledge_subj_str[k_i]);

    current_color = 7;
  }


  GotoXY(1, 3);
  colored_output(7, aFinansi);


  if (!jle(hero.money, 0)) {
    TextColor(0x0F);
    write(hero.money);
    TextColor(7);
    write(aRub__3);
  } else if (hero.got_stipend === 0) {
    colored_output(0x0C, aNadoPolucitDen);
  } else {
    write(aTiUspelPotrati);
  }


  GotoXY(1, 4);
  let brain_line = [0, 1, 2, 3, 4, 5, 6, 0x65];
  let brain_str = [aKliniceskaqSme, aGolovaProstoNi, aDumatPraktices, aDumatTrudno, aGolovaPoctiVNo, aGolovaVNorme, aGolovaSvejaq, aLegkostVMislqx, aObratitesKRazr];
  let brain_col = [5, 5, 0xC, 0xC, 0xE, 0xE, 0xA, 0xA, 0xB];
  let brain_i = _upper_bound(brain_line, hero.brain);
  colored_output(brain_col[brain_i], brain_str[brain_i]);


  GotoXY(1, 5);
  const stamina_line = [0, 1, 2, 3, 4, 5, 6];
  const stamina_str = [aMamaRodiMenqOb, aOkoncatelNoZau, aQTakBolSeNemog, aSkoreeBiVseAto, aEseNemnogoIPor, aNemnogoUstal, aGotovKTruduIOb, aNasJdutVelikie];
  const stamina_col = [5, 5, 0xC, 0xC, 0xE, 0xE, 0xA, 0xA];
  const stamina_i = _upper_bound(stamina_line, hero.stamina);
  colored_output(stamina_col[stamina_i], stamina_str[stamina_i]);

  GotoXY(1, 6);
  const charizma_line = [1, 2, 3, 4, 5, 6];
  const charizma_str = [aOcenZamknutiiT, aPredpocitaesOd, aTebeTrudnoObsa, aTebeNeprostoOb, aTiNormalNoOtno, aUTebqMnogoDruz, aUTebqOcenMnogo];
  const charizma_col = [5, 5, 0xC, 0xC, 0xE, 0xA, 0xA];
  const charizma_i = _upper_bound(charizma_line, hero.charizma);
  colored_output(charizma_col[charizma_i], charizma_str[charizma_i]);
} // end function 1F685


const asc_1FD4D = '██████';


function show_timesheet_day(day_color, day, subj) {
  TextColor(hero.subject[subj].passed ? 1 : day_color);

  let ts = timesheet[day][subj];
  if (ts.where !== 0) {
    GotoXY(day * 7 + 0x18, subj * 3 + 2);
    write(places[ts.where].title);
    GotoXY(day * 7 + 0x18, subj * 3 + 3);
    write(ts.from);
    write('-');
    write(ts.to);
  } else {
    TextColor(day_color > 8 ? 6 : 8);
    GotoXY(day * 7 + 0x18, subj * 3 + 2);
    write(asc_1FD4D);
    GotoXY(day * 7 + 0x18, subj * 3 + 3);
    write(asc_1FD4D);
  }

  // #warning only use
  //TextBackground(0);
} // end function 1FD54


let aOstalos = 'Осталось';
let aPodoitiS = 'Подойти с';
let aZacetkoi = 'зачеткой';
let aZacet = 'ЗАЧЕТ';
let a_05 = '.05';
let aVseUjeSdano = 'Все уже сдано!';
let aOstalsq = 'Остался ';
let aZacet_0 = ' зачет!';
let aOstalos_0 = 'Осталось ';
let aZaceta_ = ' зачета.';
let aZacetov_ = ' зачетов.';


function show_timesheet() {
  for (let subj = 0; subj <= 5; ++subj) {
    TextColor(7);
    GotoXY(1, subj * 3 + 2);
    colored_output(0xA, subjects[subj].professor.name);
    GotoXY(1, subj * 3 + 3);
    colored_output(0xB, subjects[subj].title);

    for (let day = 0; day <= 5; ++day) {
      show_timesheet_day(day === day_of_week ? 0xE : 7, day, subj);
    }
  }

  for (let day = 0; day <= 5; ++day) {
    TextColor(7);
    GotoXY(day * 7 + 0x18, 1);
    colored_output(0xB, days[day]);
  }

  for (let subj = 0; subj <= 5; ++subj) {
    if (hero.subject[subj].passed === 0) {
      if (subjects[subj].tasks > hero.subject[subj].tasks_done) {
        TextColor(7);
        GotoXY(0x46, subj * 3 + 2);
        write(aOstalos);
        GotoXY(0x46, subj * 3 + 3)
        colored_output_white(subjects[subj].tasks - hero.subject[subj].tasks_done);
        zadanie_in_case(subjects[subj].tasks - hero.subject[subj].tasks_done);
      } else {
        TextColor(7);
        GotoXY(0x46, subj * 3 + 2);
        writeln(aPodoitiS);
        GotoXY(0x46, subj * 3 + 3);
        writeln(aZacetkoi);
      }
    } else {
      TextColor(0xF);
      GotoXY(0x46, subj * 3 + 2);
      write(aZacet);
      GotoXY(0x46, subj * 3 + 3);
      write(hero.subject[subj].pass_day + 22);
      write(a_05);
    }
  }

  TextColor(7);
  GotoXY(1, 0x17);

  if (hero.exams_left === 0) {
    colored_output(0xF, aVseUjeSdano);
  } else if (hero.exams_left === 1) {
    output_with_highlighted_num(7, aOstalsq, 0xD, 1, aZacet_0);
  } else if (hero.exams_left < 5) {
    output_with_highlighted_num(7, aOstalos_0, 0xE, hero.exams_left, aZaceta_);
  } else {
    output_with_highlighted_num(7, aOstalos_0, 0xE, hero.exams_left, aZacetov_);
  }

  GotoXY(1, 7);
} // end function 1FF27


function show_short_today_timesheet(y) {
  for (let subj = 0; subj <= 5; ++subj) {
    let ts = timesheet[day_of_week][subj];

    TextColor(hero.subject[subj].passed ? 1 : 0xB);
    GotoXY(0x32, y + subj);
    write(subject_short_titles[subj]);

    TextColor(hero.subject[subj].passed ? 5 : 0xC);
    GotoXY(0x3A, y + subj);
    write(places[ts.where].title);

    if (ts.where !== 0) {
      TextColor(hero.subject[subj].passed ? 8 : 0xF);
      GotoXY(0x40, y + subj);
      write(ts.from);
      write('-');
      write(ts.to);
    }

    GotoXY(0x48, y + subj);
    if (hero.subject[subj].tasks_done === 0) {
      TextColor(7);
    } else if (hero.subject[subj].tasks_done < subjects[subj].tasks) {
      TextColor(0xA);
    } else {
      TextColor(0xE);
    }
    write(hero.subject[subj].tasks_done);
    write('/');
    write(subjects[subj].tasks);
  }

  TextColor(7);
} // end function 201DC


function init_timesheet() {
  for (let subj = 0; subj <= 5; ++subj) {
    for (let day = 0; day <= 5; ++day) {
      timesheet[day][subj].from =
          timesheet[day][subj].to =
              timesheet[day][subj].where = 0;
    }
  }

  for (let subj = 0; subj <= 5; ++subj) {
    let day_used = [0, 0, 0, 0, 0, 0];
    if (subjects[subj].exam_days >= 1) {
      for (let i = 1; i <= subjects[subj].exam_days; ++i) {
        let day;
        do {
          day = random_from_to(0, 5);
        } while (day_used[day]);

        timesheet[day][subj].from =
            random_from_to(9, 18 - subjects[subj].exam_max_time);

        const exam_time = random_from_to(
            subjects[subj].exam_min_time,
            subjects[subj].exam_max_time);

        timesheet[day][subj].to = timesheet[day][subj].from + exam_time;
        timesheet[day][subj].where = subjects[subj].exam_places[Random(3)];

        day_used[day] = 1;
      }
    }
  }
} // end function 203A0


function inception_reinit_timesheet() {
  // Тут deep copy
  let old_timesheet = [];
  for (let i = 0; i < 6; ++i) {
    old_timesheet.push([]);
    for (let j = 0; j < 6; ++j) {
      old_timesheet[i].push({from: timesheet[i][j].from, to: timesheet[i][j].to, where: timesheet[i][j].where});
    }
  }
  init_timesheet();
  for (let i = 0; i <= day_of_week; ++i) {
    timesheet[i] = old_timesheet[i]; // 0x1E bytes
  }
} // end function 204C8


let aViberiNacalNie = 'Выбери начальные параметры своего "героя":';
let aSlucainiiStude = 'Случайный студент';
let aSibkoUmnii = 'Шибко умный';
let aSibkoNaglii = 'Шибко наглый';
let aSibkoObsitelNi = 'Шибко общительный';
let aGodRejim = 'GOD-режим';


async function init_hero_interactive() {
  ClrScr();

  dialog_start();
  writeln(aViberiNacalNie);
  dialog_case(aSlucainiiStude, -1);
  dialog_case(aSibkoUmnii, -2);
  dialog_case(aSibkoNaglii, -3);
  dialog_case(aSibkoObsitelNi, -4);
  if (is_god_mode_available) {
    dialog_case(aGodRejim, -100);
  }

  is_god_mode = 0;

  let res = await dialog_run(1, 3);
  if (res === -1) {
    hero.brain = Random(3) + 4;
    hero.stamina = Random(3) + 4;
    hero.charizma = Random(3) + 4;
  } else if (res === -2) {
    hero.brain = Random(5) + 5;
    hero.stamina = Random(3) + 2;
    hero.charizma = Random(3) + 2;
  } else if (res === -3) {
    hero.brain = Random(3) + 2;
    hero.stamina = Random(5) + 5;
    hero.charizma = Random(3) + 2;
  } else if (res === -4) {
    hero.brain = Random(3) + 2;
    hero.stamina = Random(3) + 2;
    hero.charizma = Random(5) + 5;
  } else if (res === -100) {
    is_god_mode = 1;
    hero.brain = 0x1E;
    hero.stamina = 0x1E;
    hero.charizma = 0x1E;
  }

  ClrScr();
} // end function 20597


async function init_hero() {
  hero.garlic = 0;
  hero.money = 0;
  hero.inception = 0;
  hero.got_stipend = 0;
  hero.knows_djug = 0;
  hero.has_mmheroes_disk = 0;
  hero.is_working_in_terkom = 0;

  // #warning no refs
  byte_2549F = 0;

  if (ParamCount()) {
    await init_hero_interactive();
  } else {
    // #warning
    hero.brain = /*200;*/ Random(3) + 4;
    hero.stamina = /*200;*/ Random(3) + 4;
    hero.charizma = /*200;*/ Random(3) + 4;
  }

  // #warning no refs
  word_256CE = hero.brain;
  asc_256D2 = hero.stamina;
  word_256D0 = hero.charizma;

  day_of_week = 0;
  time_of_day = 8;
  current_place = 4;
  current_subject = -1;

  hero.health = Random(hero.stamina * 2) + 0x28;

  // #warning no refs
  word_2559A = hero.health;

  hero.exams_left = 6;
  hero.has_ticket = 0;
  is_end = 0;
  death_cause = 0;
  klimov_timesheet_was_modified = 0;
  hero.is_invited = 0;

  // #warning no refs
  byte_254A4 = 0;

  hero.has_inet = 0;
} // end function 206E4


let aBad_cred_count = 'bad_cred_count';


async function check_exams_left_count() {
  let exams_left = 6;
  for (let i = 0; i <= 5; ++i) {
    if (hero.subject[i].passed) {
      --exams_left;
    }
  }
  if (exams_left !== hero.exams_left) {
    await bug_report(aBad_cred_count);
  }
} // end function 207BF


function init_knowledge_synopsis_classmate() {
  for (let subj = 0; subj <= 5; ++subj) {
    hero.subject[subj] = {
      tasks_done: 0,
      pass_day: -1,
      knowledge: Random(hero.brain),
      passed: 0
    };
  }

  for (let subj = 0; subj <= 2; ++subj) {
    synopsis[subj].sasha_has = 1;
    synopsis[subj].hero_has = 0;
  }

  for (let i = 0; i <= 0xB; ++i) {
    classmates[i].current_subject = -1;
  }
} // end function 207FA


async function init_game() {
  await init_hero();
  init_timesheet();
  init_knowledge_synopsis_classmate();
} // end function 20889


async function wait_for_key() {
  GotoXY(1, 0x18);
  current_color = 0x0E;
  write('Нажми любую клавишу ...');
  current_color = 7;
  //if (ReadKey() === 0) {
  await ReadKey();
  //}
} // end function 208B8


let aVProgrammeBuga = 'В программе буга! Код : ';
let aSrocnoObratite = 'Срочно обратитесь к разработчику ;)';
let aRazdavlenBezja = 'Раздавлен безжалостной ошибкой в программе.';


async function bug_report(bug_str) {
  ClrScr();
  current_color = 0x8F;
  write(aVProgrammeBuga);
  writeln(bug_str);
  writeln(aSrocnoObratite);
  is_end = 1;
  hero.health = -100;
  death_cause = aRazdavlenBezja;
  await wait_for_key();
} // end function 2095D


function random_from_to(from, to) {
  return from + Random(to - from + 1);
} // end function 209E0


function decrease_health(num, death_str) {
  hero.health -= num;

  if (hero.health <= 0) {
    is_end = 1;
    death_cause = death_str;
  }
} // end function 20A10


function dialog_start() {
  dialog_case_count = 0;
} // end function 20A60


function dialog_case(str, num) {
  dialog[dialog_case_count++] = {str: str, num: num, color: 0xB};
} // end function 20A6A


function dialog_case_colored(str, num, color) {
  dialog[dialog_case_count++] = {str: str, num: num, color: color};
} // end function 20AC5


function dialog_show(x, y) {
  current_color = 0xB;
  for (let i = 0; i <= dialog_case_count - 1; ++i) {
    GotoXY(x, y + i);
    current_color = dialog[i].color;
    write(dialog[i].str);
  }
  current_color = 7;
} // end function 20B20



////////////////

function report_bug() {
  let s = JSON.stringify(Replay.data);
  alert('Send this string to developer and tell him what happened\r\n\r\n' + s);
}

function dev_replay() {
  Replay.data = JSON.parse(prompt('Paste string from tester'));
  Replay.data.on = 1;
  Main();
}

Main().catch(err => {
  console.error(err);
});

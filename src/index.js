import { Write, Writeln, Readln } from "./system";
import { ReadKey, ClrScr, GotoXY, TextColor, TextBackground, WhereY, Delay, _set_current_color } from "./crt";


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
    window.localStorage.setItem('nick', name);
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

const Kolya = 0, Pasha = 1, Diamond = 2, Rai = 3, Misha = 4, Serzg = 5, Sasha = 6, Nil = 7, Kuzmenko = 8, Djug = 9,
    Endryu = 10, Grisha = 11;


// 0x9E, size 7
const subject_short_titles = ['АиТЧ', 'МатАн', 'ГиТ', 'Инф', 'ИнЯз', 'Физ-ра'];

let dialog_case_count;
let is_end;
let is_god_mode;
let is_god_mode_available = 0;

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


//let Key = -1;

function idiv(x, y) {
  return Math.floor(x / y);
}

function Randomize() {
}

function ParamCount() {
  return 0;
}

function ParamStr(num) {
  return '';
}


let first_run = true;


function Random(up) {
  let res = Math.floor(Math.random() * up);
  return res;
}


async function dialog_run(x, y) {
  let current_selection = 0;
  dialog_show(x, y);

  while (1) {
    _set_current_color(0x70);
    GotoXY(x, y + current_selection);
    Write(dialog[current_selection].str);
    let key = await ReadKey();

    _set_current_color(dialog[current_selection].color);
    GotoXY(x, y + current_selection);
    Write(dialog[current_selection].str);

    if (key === 0x0D) {
      _set_current_color(7);
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
  try {
    await PROGRAM();
  } catch (e) {
    if (e !== 42) {
      console.dir(e);
      alert(e + '\r\n' + e.stack);
    }
  }
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

/**
 * a === b
 * @returns {boolean}
 */
function jz(a, b) {
  return a === b;
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
const aGamma3_14 = 'gamma3.14';


async function prompt_for_new_game() {
  ClrScr();
  Writeln('Хочешь попробовать еще?');
  dialog_start();
  dialog_case('ДА!!! ДА!!! ДА!!!', -1);
  dialog_case('Нет... Нет... Не-э-эт...', -2);
  let result = await dialog_run(1, 4) === -2;
  ClrScr();
  return result;
}


async function PROGRAM() {
  await _init_vars();

  dialog_case_count = 0;
  Randomize();

  if (ParamCount() > 0 && ParamStr(1) === '-3dec-happy-birthday-Diamond') {
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


async function show_dzin_and_timesheet() {
  ClrScr();
  TextColor(0x0A);
  Writeln('ДЗИНЬ!');
  await Delay(0x1F4);
  TextColor(0x0E);
  Writeln('ДДДЗЗЗЗЗИИИИИИННННННЬ !!!!');
  await Delay(0x2BC);
  TextColor(0x0C);
  Writeln('ДДДДДДЗЗЗЗЗЗЗЗЗЗЗЗЗИИИИИИИИИИННННННННННННЬ !!!!!!!!!!');
  await Delay(0x3E8);
  TextColor(7);
  Write('Ты просыпаешься от звонка будильника ');
  Write(0x16);
  Writeln('-го мая в 8:00. ');
  Writeln('Неожиданно ты осознаешь, что началась зачетная неделя,');
  Writeln('а твоя готовность к этому моменту практически равна нулю.');
  Writeln('Натягивая на себя скромное одеяние студента,');
  Writeln('ты всматриваешься в заботливо оставленное соседом на стене');
  Writeln('расписание: когда и где можно найти искомого препода ?');
  await wait_for_key();
  ClrScr();
  show_timesheet();
  await wait_for_key();
  ClrScr();
} // end function 102EF


async function scene_router() {
  console.log('Router, current_place=', current_place, 'current_subject=', current_subject);


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
    await bug_report('nowhere_at_turn');
  }
} // end function 10433


async function game_end_death() {
  _set_current_color(0x0C);
  Writeln('Легче лбом колоть орехи,');
  Writeln('чем учиться на МАТ-МЕХе.');
  _set_current_color(0x0D);
  Writeln(death_cause);
  await wait_for_key();
} // end function 104DC


async function game_end_alive() {
  if (hero.exams_left > 0) {
    colored_output(0x0D, 'Уффффф! Во всяком случае, ты еще живой.');
  } else {
    colored_output(0x0F, '********* Yes! Ты сделал это! *********');
  }

  Writeln();
  Writeln();

  if (hero.exams_left >= 3) {
    colored_output(0x0C, 'У тебя нет целых ');
    colored_output_white(hero.exams_left);
    colored_output(0x0C, ' зачетов!');
    Writeln();
    colored_output(0x0D, 'ТЫ ОТЧИСЛЕН!');
    await wait_for_key();
    return;
  } else if (hero.exams_left === 2) {
    colored_output_ln(0x0E, 'Нет двух зачетов - плохо.');
    colored_output_ln(0x0E, 'Говорят, у механиков жизнь проще...');
    colored_output_ln(0x0E, '- Зря говорят, ХАЛЯВЫ НЕ БУДЕТ!');
  } else if (hero.exams_left === 1) {
    colored_output_ln(0x0A, 'Нет одного зачета.');
    colored_output_ln(0x0A, 'Ничего, от этого еще никто не помирал.');
  } else if (hero.exams_left === 0) {
    colored_output_ln(0x0F, 'Поздравляю: ты можешь считать себя настоящим героем Мат-Меха!');
    colored_output_ln(0x0F, 'Успешной тебе сессии !');
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
    _set_current_color(0x0C);
    Writeln();
    Writeln('У тебя нет зачета по алгебре!');
    Writeln('Всемирнов доканал тебя на сессии.');
    Writeln('Естественно, это повлияло на твои оценки.');
    _set_current_color(7);

    score -= (subjects[Algebra].tasks - hero.subject[Algebra].tasks_done) * 4;
    if (score < 0) {
      score = 0;
    }
  }

  if (!hero.subject[Matan].passed) {
    _set_current_color(0x0C);
    Writeln();
    Writeln('У тебя нет допуска по матану!');
    score = idiv(score * 2, 3);
    _set_current_color(7);
  }

  if (!hero.subject[GiT].passed) {
    _set_current_color(0x0C);
    Writeln();
    Writeln('У тебя нет зачета по геометрии!');
    Writeln('Как тебя угораздило?');
    score = idiv(score * 2, 3);
    _set_current_color(7);
  }

  if (hero.is_working_in_terkom) {
    _set_current_color(0x0C);
    Writeln();
    Writeln('К сессии ты "готовился", "работая" в ТЕРКОМе.');
    Writeln('Ты решил больше никогда так не делать.');
    score = idiv(score * 2, 3);
    _set_current_color(7);
  }

  Writeln();

  if (score <= 0) {
    Writeln('Тебя оставили без стипухи.');
  } else {
    Write('Твоя стипуха - ');
    colored_output_white(score);
    Writeln(' руб.');
    Write('В заначке ');
    TextColor(0x0F);
    Write(hero.money);
    TextColor(7);
    Writeln(' руб.');
    Writeln();

    if (is_god_mode) {
      score = 0;
      hero.money = 0;
      Writeln('Да ты еще и GOD! Нет, тебе в таблицу рекордов нельзя.');
    } else {
      update_top_gamers(score + hero.money);
    }
  }
  await wait_for_key();
} // end function 1081D


async function show_intro_screen() {
  ClrScr();
  TextColor(8);
  Writeln('                                                Нам понятен этот смех');
  Writeln('                                                Не попавших на Мат-Мех');
  Writeln('                                                  (надпись на парте)');
  Writeln();
  Writeln();
  Writeln();
  TextColor(0x0F);
  Writeln(' H H  EEE  RR    O   EEE  SS       M   M  A   A TTTTT       M   M  EEE  X   X');
  Writeln(' H H  E    R R  O O  E   S         MM MM  AAAAA   T         MM MM    E   X X');
  Writeln(' HHH  EE   RR   O O  EE   S    OF  M M M  A   A   T    &&&  M M M   EE    X');
  Writeln(' H H  E    R R  O O  E     S       M   M   A A    T         M   M    E   X X');
  Writeln(' H H  EEE  R R   O   EEE SS        M   M    A     T         M   E  EEE  X   X');
  Writeln();
  Writeln();
  TextColor(0x0C);
  Writeln('                             ГЕРОИ МАТА И МЕХА ;)');
  Writeln();
  Writeln();
  TextColor(0x0B);
  Writeln('(P) CrWMM Development Team, 2001.');
  Write('Версия ');
  Write(aGamma3_14);
  Writeln('.');
  Writeln('Загляните на нашу страничку: mmheroes.chat.ru !');
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
  Writeln(aDisclaimer);
  Writeln();
  TextColor(9);
  Writeln(a1_VsePersonaji);
  Writeln(aMneniqEeAvtora);
  Writeln(aAvtorNeStavilC);
  Writeln();
  Writeln(a2_PoctiVseSobi);
  Writeln(aPredstavleniVN);
  Writeln();
  Writeln(a3_VseSovpadeni);
  Writeln(aProvedennimiKe);
  Writeln(aRealisticnostV);
  Writeln();
  Writeln();
  TextColor(0x0C);
  Writeln('*.) Если вы нашли в данной программе ошибку (любую, включая опечатки),');
  Writeln('    Ваши комментарии будут очень полезны.');
  Writeln();
  TextColor(8);
  Writeln('Автор не несет ответственность за психическое состояние игрока.');
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



async function goto_kompy_to_pomi() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  if (time_of_day > 20) {
    Writeln('Здравый смысл подсказывает тебе, что в такое время');
    Writeln('ты там никого уже не найдешь.');
    Writeln('Не будем зря тратить здоровье на поездку в ПОМИ.');
    await wait_for_key();
    return;
  }

  decrease_health(Random(0x0A), 'В электричке нашли бездыханное тело.');
  current_place = 2;

  if (hero.money < 10) {
    Writeln('Денег у тебя нет, пришлось ехать зайцем...');

    if (hero.charizma < Random(0x0A)) {
      Writeln('Тебя заловили контролеры!');
      Writeln('Высадили в Красных зорях, гады!');
      hero.health -= 0xA;
      if (hero.health <= 0) {
        is_end = 1;
        death_cause = 'Контролеры жизни лишили.';
      }
      await hour_pass();
    } else {
      Writeln('Уф, доехал!');
    }

  } else {
    dialog_start();
    dialog_case('Ехать зайцем', -1);
    dialog_case('Честно заплатить 10 руб. за билет в оба конца', -2);
    let result = await dialog_run(1, 0x0C);
    if (result === -1) {
      if (hero.charizma < Random(0x0A)) {
        GotoXY(1, 0x0F);
        Writeln('Тебя заловили контролеры!');
        Writeln('Высадили в Красных зорях, гады!');
        await hour_pass();
      } else {
        GotoXY(1, 0x0F);
        Writeln('Уф, доехал!');
      }
    } else if (result === -2) {
      hero.money -= 10;
      hero.has_ticket = 1;
    }
  }

  await wait_for_key();
  await hour_pass();
} // end function 1160A


async function goto_klimov() {
  if (Random(2) === 0) {
    ClrScr();
    TextColor(7);
    Writeln('Климов А.А. сидит и тоскует по халявному Inet\'у.');
    Writeln('...');
    await ReadKey();
    ClrScr();
  }
  current_subject = 3;
} // end function 1182D



function goto_kompy_to_mausoleum() {
  current_subject = -1;
  current_place = 5;
  decrease_health(2, 'Умер по пути в мавзолей.');
} // end function 1189E


async function play_mmheroes() {
  ++hero.inception;
  ClrScr();
  TextColor(0x0A);
  Writeln('ДЗИНЬ!');
  await Delay(0x1F4);
  TextColor(0x0E);
  Writeln('ДДДЗЗЗЗЗИИИИИИННННННЬ !!!!');
  await Delay(0x2BC);
  TextColor(0x0C);
  Writeln('ДДДДДДЗЗЗЗЗЗЗЗЗЗЗЗЗИИИИИИИИИИННННННННННННЬ !!!!!!!!!!');
  await Delay(0x3E8);
  TextColor(7);
  Writeln('Неожиданно ты осознаешь, что началась зачетная неделя,');
  Writeln('а твоя готовность к этому моменту практически равна нулю.');
  Writeln('Натягивая на себя скромное одеяние студента,');
  Writeln('ты всматриваешься в заботливо оставленное соседом на стене');
  Writeln('расписание: когда и где можно найти искомого препода ?');
  await wait_for_key();
  ClrScr();
  TextColor(0x0F);
  Writeln('!!!!!! СТОП! !!!!!!');
  Writeln();
  Writeln('ЧТО-ТО ТАКОЕ ТЫ УЖЕ ВИДЕЛ!!!');
  Writeln('Оглядевшись вокруг, ты осознаешь, что, вроде бы,');
  Writeln('экстраординарного не произошло. Ты просто играешь в компьютерную');
  Writeln('игру не самого лучшего качества, в которой тебе вдруг предложили...');
  Writeln('СЫГРАТЬ В ЭТУ САМУЮ ИГРУ! [...]');
  await ReadKey();

  if (hero.stamina + hero.brain - hero.inception * 5 < 8) {
    decrease_health(0x64, 'Раздвоение ложной личности.');
  }

  await hour_pass();

  if (hero.health <= 0) {
    return;
  }

  Writeln();
  TextColor(0x0E);
  Writeln('Не каждый способен пережить такое потрясение.');
  Writeln('Постепенно к тебе приходит осознание того, что');
  Writeln('на самом деле, все это - компьютерная игра, и, следовательно,');
  Writeln('эти события происходят только в твоем воображении.');
  Writeln('Вовремя выйдя из странного трансцендентального состояния,');
  Writeln('ты обнаруживаешь себя в компьютерном классе Мат-Меха.');
  Writeln('Правда, мир вокруг тебя, похоже, несколько иной,');
  Writeln('нежели он был час минут назад...');
  inception_reinit_timesheet();
  await wait_for_key();
} // end function 11CD5


async function surf_inet() {
  if (is_god_mode || Random(hero.brain) > 6 && hero.subject[Infa].tasks_done < hero.subject[Infa].tasks) {
    GotoXY(1, 0x14);
    TextColor(0x0B);
    Writeln('Ух ты! Ты нашел програмку, которая нужна для Климова!');
    ++hero.subject[Infa].tasks_done;
  } else if (Random(3) === 0 && hero.brain < 5) {
    ++hero.brain;
  }
  await wait_for_key();
  await hour_pass();
} // end function 11FA2


async function scene_kompy() {
  show_header_stats();
  TextColor(7);
  GotoXY(1, 8);

  if (time_of_day > 20) {
    Writeln('Класс закрывается. Пошли домой!');
    await wait_for_key();
    current_subject = -1;
    current_place = 4;
    decrease_health(Random(5), 'Умер по пути домой. Бывает.');
    return;
  }

  Writeln('Ты в компьютерном классе. Что делать?');

  dialog_start();
  if (is_professor_here(Infa)) {
    dialog_case_colored('Климов А.А.', -1, 0x0E);
  }
  dialog_case('Пойти в общагу', -2);
  dialog_case('Покинуть класс', -3);
  dialog_case('Поехать в ПОМИ', -4);
  dialog_case('Пойти в мавзолей', -5);
  if (hero.has_inet) {
    dialog_case('Провести 1 час в Inet\'е', -11);
  }
  for (let i = 0; i <= 0xB; ++i) {
    if (classmates[i].place === 3) {
      dialog_case_colored(classmate_names[i], i, 0xE);
    }
  }
  if (hero.has_mmheroes_disk) {
    dialog_case('Поиграть в MMHEROES', -10);
  }
  dialog_case_colored('С меня хватит!', -6, 9);

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
    11: surf_inet,
  };
  if (arr[-res] !== undefined) {
    await arr[-res]();
  } else if (res >= 0 && res <= 0xB) {
    await talk_with_classmate(res);
  }
} // end function 120F8


async function goto_mausoleum_to_punk() {
  decrease_health(3, 'Умер по пути на факультет.');
  current_subject = -1;
  current_place = 1;
}


function goto_mausoleum_to_obschaga() {
  current_subject = -1;
  current_place = 4;
} // end function 12307


async function rest_in_mausoleum() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  Writeln('Выбери себе способ "культурного отдыха".');
  show_short_today_timesheet(0x0B);

  dialog_start();
  if (hero.money >= 4) {
    dialog_case('Стакан колы за 4 р.', -2);
  }
  if (hero.money >= 6) {
    dialog_case('Суп, 6 р. все удовольствие', -3);
  }
  if (hero.money >= 8) {
    dialog_case('0,5 пива за 8 р.', -1);
  }
  dialog_case('Расслабляться будем своими силами.', -4);
  dialog_case('Нет, отдыхать - это я зря сказал.', 0);
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
      death_cause = 'Пивной алкоголизм, батенька...';
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


async function scene_mausoleum() {
  show_header_stats();
  TextColor(7);
  GotoXY(1, 8);
  Writeln('Ты в мавзолее. Что делать?');

  dialog_start();
  dialog_case('Идти в ПУНК', -1);
  dialog_case('Поехать в ПОМИ', -5);
  dialog_case('Идти в общагу', -2);
  dialog_case('Отдыхать', -3);
  for (let i = 0; i <= 0xB; ++i) {
    if (classmates[i].place === 5) {
      dialog_case_colored(classmate_names[i], i, 0xE);
    }
  }
  dialog_case_colored('С меня хватит!', -4, 9);

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


async function botva() {
  ClrScr();
  show_header_stats();
  TextColor(7);
  GotoXY(1, 8);
  Writeln('К чему готовиться?');

  dialog_start();
  for (let i = 0; i <= 5; ++i) {
    dialog_case(subjects[i].title + (i <= 2 && synopsis[i].hero_has ? ' (к)' : ''), i);
  }
  dialog_case('Ни к чему', -1);

  show_short_today_timesheet(0x0A);

  let subj = await dialog_run(1, 0x0A);
  if (subj === -1) {
    return;
  }

  let use_synopsis = 0;
  if (subj <= 2 && synopsis[subj].hero_has) {
    dialog_start();
    dialog_case('Воспользуюсь конспектом', -1);
    dialog_case('Буду учиться, как умею', -2);
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
  decrease_health(health_penalty, 'Заучился.');

  if (hero.subject[subj].knowledge > 0x2D) {
    decrease_health(0x0A, 'Зубрежка до добра не доводит!');
  }

  if (!is_end) {
    await hour_pass();
  }
} // end function 12719


function goto_obschaga_to_punk() {
  current_place = 1;
  current_subject = -1;
  decrease_health(3, 'Умер по пути на факультет.');
} // end function 12995


async function goto_obschaga_to_pomi() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);

  if (time_of_day > 20) {
    ClrScr();
    Writeln('Здравый смысл подсказывает тебе, что в такое время');
    Writeln('ты там никого уже не найдешь.');
    Writeln('Не будем зря тратить здоровье на поездку в ПОМИ.');
    await wait_for_key();
    return;
  }

  decrease_health(Random(0x0A), 'В электричке нашли бездыханное тело.');
  current_place = 2;

  if (hero.money < 10) {

    Writeln('Денег у тебя нет, пришлось ехать зайцем...');
    if (hero.charizma < Random(0x0A)) {
      Writeln('Тебя заловили контролеры!');
      Writeln('Высадили в Красных зорях, гады!');
      hero.health -= 0xA;
      if (hero.health <= 0) {
        death_cause = 'Контролеры жизни лишили.';
      }
      await hour_pass();
    } else {
      Writeln('Уф, доехал!');
    }

  } else {
    dialog_start();
    dialog_case('Ехать зайцем', -1);
    dialog_case('Честно заплатить 10 руб. за билет в оба конца', -2);
    let res = await dialog_run(1, 0x0C);

    if (!(res !== -1)) {
      if (hero.charizma < Random(0x0A)) {
        GotoXY(1, 0x0F);
        Writeln('Тебя заловили контролеры!');
        Writeln('Высадили в Красных зорях, гады!');
        await hour_pass();
      } else {
        GotoXY(1, 0x0F);
        Writeln('Уф, доехал!');
      }
    } else if (!(res !== -2)) {
      hero.money -= 10;
      hero.has_ticket = 1;
    }

  }

  await wait_for_key();
  await hour_pass();
} // end function 12B1E


function goto_obschaga_to_mausoleum() {
  current_subject = -1;
  current_place = 5;
  decrease_health(3, 'Умер по пути в мавзолей.');
} // end function 12D2A


async function see_timesheet() {
  ClrScr();
  show_timesheet();
  await wait_for_key();
  ClrScr();
} // end function 12D46


async function try_sleep() {
  if (time_of_day > 3 && time_of_day < 20) {
    GotoXY(1, 0x16);
    Writeln('Тебя чего-то не тянет по-спать...');
    await wait_for_key();
  } else {
    await goto_sleep();
  }
} // end function 12D81


function clamp0(arg_2) {
  return arg_2 < 0 ? 0 : arg_2;
} // end function 12DC1


async function invite_from_neighbor() {
  Write('К тебе ломится сосед и приглашает тебя ');
  Writeln([
    'на свой День Рожденья.',
    'на дискотеку в "Шайбе".',
    'поиграть в мафию.',
    'по-Quakать.',
  ][Random(4)]);

  dialog_start();
  dialog_case('"Угу, я сейчас!!!"', -1);
  dialog_case('"Не, извини, мне готовиться надо..."', -2);
  let res = await dialog_run(1, 0x0A);

  if (res === -1) {
    GotoXY(1, 0x0E);
    Writeln('"Пошли оттягиваться!"');

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
    Writeln('"Ну и зря!"');
    hero.charizma -= Random(2) + 1;
  }

  await wait_for_key();
  ClrScr();
} // end function 12EB2


async function scene_obschaga() {
  show_header_stats();
  TextColor(7);
  GotoXY(1, 8);

  if (23 - idiv(clamp0(0x32 - hero.health), 0xC) < time_of_day || time_of_day < 4) {
    Writeln('Тебя неумолимо клонит ко сну ...');
    await wait_for_key();
    await goto_sleep();
    return;
  } else if (time_of_day > 0x11 && Random(0x0A) < 3 && !hero.is_invited) {
    hero.is_invited = 1;
    await invite_from_neighbor();
    return;
  }

  Writeln('Ты в общаге. Что делать?');
  dialog_start();
  dialog_case('Готовиться', -1);
  dialog_case('Посмотреть расписание', -2);
  dialog_case('Отдыхать', -3);
  dialog_case('Лечь спать', -4);
  dialog_case('Пойти на факультет', -5);
  dialog_case('Поехать в ПОМИ', -6);
  dialog_case('Пойти в мавзолей', -7);
  dialog_case_colored('С меня хватит!', -8, 9);
  dialog_case_colored('ЧТО ДЕЛАТЬ ???', -9, 9);
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
  Write(character);
  TextColor(7);
  Writeln(description);
} // end function 132D0


function output_colored_string(s) {
  for (let i = 1; i <= s.length; ++i) {
    let c = s.charCodeAt(i - 1);
    if (c >= 0 && c <= 0x0F) {
      TextColor(c);
    } else {
      Write(s.substr(i - 1, 1));
    }
  }
  Writeln();
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
  Writeln('Что тебя интересует?');

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


function help_screen() {
  output_colored_string('\x07В левом верхнем углу - игровые \x0Eдата\x07 и \x0Eвремя\x07,');
  output_colored_string('\x07твое состояние (\x0Eздоровье\x07, \x0Eкачества\x07), \x0Eденьги\x07.');
  output_colored_string('\x07В правом верхнем углу - твои \x0Eнавыки\x07 по предметам.');
  output_colored_string('\x07Навыки оцениваются двояко: по \x0E"общей шкале"\x07 (число)');
  output_colored_string('\x07и по \x0Eшкале требований конкретного преподавателя\x07 ("оценка").');
  output_colored_string('\x07Ниже навыков - мини-расписание на этот день + сданные задачи.');
  output_colored_string('\x07Полное расписание можно посмотреть в общаге (выбрать в меню).');
  output_colored_string('\x07Наконец, слева в нижней половине экрана - текущее меню.')
  Writeln();
  output_colored_string(' \x0AСОСТОЯНИЕ     \x0FНАВЫКИ');
  output_colored_string(' \x0EСИТУАЦИЯ');
  output_colored_string(' \x0BМЕНЮ          \x0CРАСПИСАНИЕ');
  Writeln();
} // end function 139B9


function help_places() {
  output_colored_string('\x07В \x0Eобщаге\x07 ты готовишься и отдыхаешь.');
  output_colored_string('На \x0Eфакультете(~=ПУНК)\x07 ты бегаешь по преподам и ищешь приятелей.');
  output_colored_string('Чтобы попасть в \x0Eкомпьюетрный класс\x07, надо прийти на факультет.');
  output_colored_string('В компьютерном классе ты сдаешь зачет по информатике и ищешь друзей.');
  output_colored_string('\x0EМавзолей\x07 - это такая столовая. Там ты отдыхаешь и ищешь приятелей.');
  output_colored_string('\x0EПОМИ\x07 - Петербургское Отделение Математического Института РАН.');
  output_colored_string('В ПОМИ ты будешь искать преподов и приятелей.');
  output_colored_string('В ПОМИ надо ехать на электричке, это занимает \x0E1 час\x07.');
  output_colored_string('Если ехать зайцем - то может оказаться, что и \x0E2 часа\x07.');
  output_colored_string('Кроме того, \x0Cпоездка отнимает и здоровье тоже\x07.');
} // end function 13C75


function help_professors() {
  show_char_description('Всемирнов М.А., алгебра', ' - очень серьезный и весьма строгий.');
  show_char_description('Дубцов Е.С., матан', ' - не очень строгий и с некоторой халявой.');
  show_char_description('Подкорытов С.С., геометрия', ' - замещает Дуткевича Ю.Г.. Почти без проблем.');
  show_char_description('Климов А.А., информатика', ' - без проблем, но трудно найти.');
  show_char_description('Влащенко Н.П., English', ' - без проблем, но с некоторым своеобразием.');
  show_char_description('Альбинский Е.Г., Физ-ра', ' - без проблем, но от физ-ры сильно устаешь.');
} // end function 13E5C


function help_characters() {
  show_char_description('Diamond', ' - автор игры "Герои Мата и Меха" (MMHEROES), знает всё о ее "фичах".');
  show_char_description('Миша', ' - когда-то альфа-тестер; понимает в стратегии получения зачетов.');
  show_char_description('Серж', ' - еще один экс-альфа-тестер и просто хороший товарищ.');
  show_char_description('Паша', ' - староста. Самый нужный в конце семестра человек.');
  show_char_description('RAI', ' - простой студент. Не любит, когда кто-то НЕ ХОЧЕТ ему помогать.');
  show_char_description('Эндрю', ' - то же студент. Можно попробовать обратиться к нему за помощью.');
  show_char_description('Саша', ' - еще один студент; подробно и разборчиво конспектирует лекции.');
  show_char_description('NiL', ' - девушка из вольнослушателей. Часто эксплуатирует чужие мозги.');
  show_char_description('Коля', ' - студент, большой любитель алгебры и выпивки.');
  show_char_description('Гриша', ' - студент-пофигист. Любит пиво и халяву.');
  show_char_description('Кузьменко В.Г.', ' - преподает информатику у другой половины 19-й группы.');
  show_char_description('DJuG', ' - угадайте, кто ;)');
} // end function 1419D


function help_about() {
  output_colored_string('\x0FCrWMM Development Team:\x07');
  Writeln();
  output_colored_string('\x0EДмитрий Петров (aka Diamond)\x07 - автор идеи, главный программист');
  output_colored_string('\x0EКонстантин Буленков \x07- портирование');
  output_colored_string('\x0EВаня Павлик \x07- тестирование, веб-страничка');
  output_colored_string('\x0EАлексей Румянцев (aka RAI) \x07- retired веб-мастер');
  output_colored_string('\x07Мнение авторов не всегда совпадает с высказываниями персонажей.');
  Writeln();
  output_colored_string('\x0BЕсли запустить \x0Fmmheroes\x0B с хоть каким параметром, у тебя будет возможность');
  output_colored_string('выбрать личный профиль своего "героя"; например,');
  output_colored_string('           \x0Ammheroes z#11');
  output_colored_string('\x0BПоявится менюшка, в которой все и так ясно.');
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



async function goto_punk_or_mausoleum_to_pomi() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);

  if (time_of_day > 20) {
    Writeln('Здравый смысл подсказывает тебе, что в такое время');
    Writeln('ты там никого уже не найдешь.');
    Writeln('Не будем зря тратить здоровье на поездку в ПОМИ.');
    await wait_for_key();
    return;
  }

  hero.health -= Random(0x0A);
  if (hero.health <= 0) {
    is_end = 1;
    death_cause = 'В электричке нашли бездыханное тело.';
  }

  current_place = 2;

  if (hero.money < 0x0A) {
    Writeln('Денег у тебя нет, пришлось ехать зайцем...');
    if (hero.charizma < Random(0x0A)) {
      Writeln('Тебя заловили контролеры!');
      Writeln('Высадили в Красных зорях, гады!');
      hero.health -= 0xA;
      if (hero.health <= 0) {
        is_end = 1;
        death_cause = 'Контролеры жизни лишили.';
      }
      await hour_pass();
    } else {
      Writeln('Уф, доехал!');
    }

  } else {
    dialog_start();
    dialog_case('Ехать зайцем', -1);
    dialog_case('Честно заплатить 10 руб. за билет в оба конца', -2);
    let res = await dialog_run(1, 0x0C);

    if (res === -1) {
      if (hero.charizma < Random(0x0A)) {
        GotoXY(1, 0x0F);
        Writeln('Тебя заловили контролеры!');
        Writeln('Высадили в Красных зорях, гады!');
        await hour_pass();
      } else {
        GotoXY(1, 0x0F);
        Writeln('Уф, доехал!');
      }
    } else if (res === -2) {
      hero.money -= 10;
      hero.has_ticket = 1;
    }
  }

  await wait_for_key();
  await hour_pass();
} // end function 1467C


async function show_intro_algebra() {
  ClrScr();
  TextColor(0x0A);

  if (ja(Random(3), 0)) {
    Writeln('Болшая, рассчитанная на поток аудитория кажется забитой народом.');
    Writeln('Здесь присутствуют не только твои одногруппники,');
    Writeln('но и какие-то не очень знакомые тебе люди');
    Writeln('(кажется, прикладники со второго курса).');
    Writeln('За столом около доски сидит М. А. Всемирнов');
    Writeln('и принимает зачет у студентов.');
    Writeln('Ты решаешь не терять времени даром и присоединиться к остальным.');
  } else {
    Writeln('Ты заходишь в небольшую аудиторию, забитую народом.');
    Writeln('Около доски сидит весьма своеобразный преподаватель.');
    Writeln('Сие своебразие проявляется, в первую очередь, значком');
    Writeln('с надписью: "НЕ СТРЕЛЯЕЙТЕ В ПРЕПОДА - ОБУЧАЕТ КАК УМЕЕТ".');
    Writeln('"А вы к кому? Максим Александрович в аудитории напротив!"');
    Writeln('Похоже, ты не туда попал. Ты извиняешься и идешь к Всемирнову.');
  }

  Writeln('...');
  await ReadKey();
  ClrScr();
} // end function 14B36


async function show_intro_matan() {
  ClrScr();
  TextColor(0x0B);
  Writeln('В обычной "групповой" аудитории сидят около 15 человек.');
  Writeln('В центре их внимания находится Е.С. Дубцов,');
  Writeln('принимающий зачет по матанализу.');
  Writeln('Ты получаешь задание и садишься за свободную парту.');
  Writeln('...');
  await ReadKey();
  ClrScr();
} // end function 14D55


async function show_intro_git() {
  ClrScr();
  TextColor(9);
  Writeln('Небольшая, полупустая аудитория.');
  Writeln('И доска, и стены, и, похоже, даже пол');
  Writeln('исписаны различными геометрическими утверждениями.');
  Writeln('В центре всего этого хаоса находится');
  Writeln('(или, скорее, постоянно перемещается)');
  Writeln('Подкорытов-младший.');
  Writeln('Ты радуешься, что смог застать его на факультете!');
  Writeln('...');
  hero.health += 5
  await ReadKey();
  ClrScr();
} // end function 14EEF


async function show_intro_english() {
  ClrScr();
  TextColor(0x0E);
  Writeln('На третьем этаже учебного корпуса Мат-Меха');
  Writeln('в одной из аудиторий, закрепленных за кафедрой иностранных языков,');
  Writeln('расположилась Н.П. Влащенко.');
  Writeln('Стены кабинета выглядят как-то странно.');
  Writeln('Рядом с небольшой доской висит изображение Эйфелевой башни,');
  Writeln('чуть дальше - странное изображение,');
  Writeln('обладающее непостижимым метафизическим смыслом.');
  Writeln('Похоже, сейчас ты будешь сдавать зачет по английскому.');
  Writeln('...');
  await ReadKey();
  ClrScr();
} // end function 1513F

async function show_intro_fizra_lecture() {
  Writeln('Альбинский проводит лекцию о пользе бега');
  Writeln([
    'для народного хозяйства.',
    'для личной жизни.',
    'для научной работы.',
    'для коммунистического строительства.',
    'для учебы и досуга.',
    'для спасения от контроллеров.',
  ][Random(6)]);
  ++timesheet[day_of_week][Fizra].to;
  Writeln();
  Writeln('Похоже, он, как всегда, немного увлекся.');
  Writeln('Немного в нашем случае - 1 час.');
  Writeln();
  await hour_pass();
} // end function 1532A


async function show_intro_fizra() {
  ClrScr();
  TextColor(0x0F);
  if (Random(3) === 0) {
    await show_intro_fizra_lecture();
  }
  Writeln('Альбинский просит тебя замерить пульс.');
  Writeln('Назвав первое пришедшее в замученную математикой голову число,');
  Writeln('ты отправляешься мотать круги в парке,');
  Writeln('в котором, вообще-то, "запрещены спортивные мероприятия".');
  Writeln('...');
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
  Writeln('Ты сейчас на факультете. К кому идти?');

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


function goto_punk_to_mausoleum() {
  current_subject = -1;
  current_place = 5;
  decrease_health(3, 'Умер по пути в мавзолей.');
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
      Write(aIk);
      --iks;
      if (iks < 1) {
        iks = 2;
      }
    } else {
      Write(s[i - 1]);
    }
  }
} // end function 1573C


// =============================================================================


async function sub_15B3A() {
  let var_2;

  if (jz(terkom_has_places, 0)) {
    ClrScr();
    show_header_stats();
    GotoXY(1, 8);
    TextColor(0x0B);
    output_ik_string('"Сказано же, нет свободных компов!"');
    Writeln();
    await wait_for_key();
    ClrScr();
    return;
  }

  if (!jbe(Random(3), 0)) {
    ClrScr();
    show_header_stats();
    GotoXY(1, 8);
    TextColor(0x0A);
    output_ik_string('"Извини, парень, свободных кумпутеров нет.');
    Writeln();
    output_ik_string('Пойди поучись пока."');
    Writeln();
    terkom_has_places = 0;
    await wait_for_key();
    ClrScr();
    return;
  }

  do {
    ClrScr();
    show_header_stats();
    GotoXY(1, 8);
    Writeln('Ты сидишь за свободным компом');
    Writeln('в тереховской "конторе".');
    Writeln('Что делать будем?');
    dialog_start();
    dialog_case('Сидеть и зарабатывать деньги', -1);

    if (!(hero.has_mmheroes_disk === 0)) {
      dialog_case('Поиграть в MMHEROES', -10);
    }

    if (!(hero.has_inet === 0)) {
      dialog_case('Посидеть часок в Inet\'e', -11);
    }

    dialog_case('Выйти отсюда на "свежий воздух"', -2);
    show_short_today_timesheet(8);

    let ax = await dialog_run(1, 0x0C);
    if (ax === -1) {
      var_2 = Random(Random(hero.charizma + hero.brain)) + 1;

      while (!(var_2 <= 4)) {
        var_2 = Random(var_2 - 3) + 2;
      }

      TextColor(7);
      GotoXY(1, 0x13);
      output_ik_string('Тебе накапало ');
      TextColor(0x0F);

      Write(var_2);

      TextColor(7);
      Writeln(' руб.');

      hero.money += var_2;
      decrease_health(Random(var_2 * 2), 'Сгорел на работе.');
      await wait_for_key();
      await hour_pass();

    } else if (jz(ax, -2)) {
      GotoXY(1, 0x11);
      output_ik_string('Уходим ...');
      Writeln();
      await wait_for_key();
      ClrScr();
      return;
    } else if (ax === -10) {
      ClrScr();
      TextColor(0x0B);
      output_ik_string('По неизвестной причине, в помещении ТЕРКОМА');
      Writeln();
      output_ik_string('MMHEROES не оказывают никакого метафизического воздействия');
      Writeln();
      output_ik_string('на окружающий мир...');
      Writeln();
      await ReadKey();
      output_ik_string('Оглядевшись вокруг, ты обнаруживаешь,');
      Writeln();
      output_ik_string('что все товарищи, здесь собравшиеся,');
      Writeln();
      Writeln('РУБЯТСЯ В MMHEROES!');
      output_ik_string('Возможно, они все пытаются халявить,');
      Writeln();
      output_ik_string('пытаются играть по "тривиальному" алгоритму,');
      Writeln();
      output_ik_string('который срабатывает, увы, далеко, не всегда...');
      Writeln();
      Writeln();
      await wait_for_key();
      ClrScr();
    } else if (jz(ax, -11)) {

      GotoXY(1, 0x13);
      Writeln('Вот здорово - мы сидим, а денежки-то идут!');

      var_2 = Random(Random(hero.charizma + hero.brain)) + 1;

      while (!(var_2 <= 4)) {
        var_2 = Random(var_2 - 3) + 2;
      }

      TextColor(7);
      GotoXY(1, 0x14);
      output_ik_string('Тебе накапало ');
      TextColor(0x0F);
      Write(var_2);
      TextColor(7);
      Writeln(' руб.');
      hero.money += var_2;
      await wait_for_key();
      await hour_pass();
    }
  } while (!jg(time_of_day, 0x12));

  GotoXY(1, 0x14);
  output_ik_string('Рабочий день закончился, все по домам.');
  await wait_for_key();
} // end function 15B3A


async function sub_15F9B() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  Writeln('Что брать будем?');
  show_short_today_timesheet(0x0B);
  dialog_start();

  if (!(hero.money < 2)) {
    dialog_case('Чай за 2 р.', -1);
  }

  if (!(hero.money < 4)) {
    dialog_case('Кекс за 4 р.', -2);
  }

  if (!(hero.money < 6)) {
    dialog_case('Чай и выпечку, 6 р.', -3);
  }

  dialog_case('Просто посижу с приятелями.', -4);
  dialog_case('Я вообще зря сюда зашел.', 0);
  let ax = await dialog_run(1, 0x0B);

  if (jz(ax, -1)) {
    hero.money -= 2;
    hero.health += Random(hero.charizma) + 2;
  } else if (jz(ax, -2)) {
    hero.money -= 4;
    hero.health += Random(hero.charizma) + 4;
  } else if (jz(ax, -3)) {
    hero.money -= 6;
    hero.health += Random(hero.charizma) + 7;
  } else if (jz(ax, -4)) {
    hero.health += Random(hero.charizma);
  } else if (jz(ax, 0)) {
    return;
  }

  await hour_pass();
} // end function 15F9B


async function scene_punk() {
  show_header_stats();
  TextColor(7);
  show_short_today_timesheet(0x0A);
  GotoXY(1, 8);
  Writeln('Ты на факультете. Что делать?');
  dialog_start();
  dialog_case('Идти к преподу', -1);
  dialog_case('Посмотреть на баобаб', -2);
  dialog_case('Пойти в общагу', -3);
  dialog_case('Поехать в ПОМИ', -4);
  dialog_case('Пойти в мавзолей', -5);

  if (!jge(time_of_day, 0x14)) {
    dialog_case('Пойти в компьютерный класс', -7);
  }

  if (!(time_of_day < 0x0A) && !jg(time_of_day, 0x12)) {
    dialog_case('Сходить в кафе', -12);
  }

  for (let i = 0; i <= 0xB; ++i) {
    if (classmates[i].place === 1) {
      if (classmates[i].current_subject === -1) {
        dialog_case_colored(classmate_names[i], i, 0xE);
      }
    }
  }

  if (!(hero.is_working_in_terkom === 0) && !jg(time_of_day, 0x12)) {
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
  } else if (!(res < 0) && !jg(res, 0x0B)) {
    await talk_with_classmate(res);
  }
} // end function 16167


async function sub_163B7() {
  ClrScr();
  TextColor(0x0C);
  Writeln('Маленький кабинет в ПОМИ заполнен людьми.');
  Writeln('И, как ни странно, почти все они хотят одного и того же.');
  Writeln('Похоже, ты тоже хочешь именно этого -');
  Writeln('РАЗДЕЛАТЬСЯ НАКОНЕЦ С ЗАЧЕТОМ ПО АЛГЕБРЕ!');
  Writeln('...');
  await ReadKey();
  ClrScr();
} // end function 163B7


async function sub_1653F() {
  ClrScr();
  Writeln('В небольшом ПОМИшном кабинете собралось человек 10 студентов.');
  Writeln('Кроме них, в комнате ты видишь Подкорытова-младшего,');
  Writeln('а также - полного седоволосого лысеющего господина,');
  Writeln('издающего характерные пыхтящие звуки.');
  Writeln('Ты надеешься, что все это скоро кончится...');
  Writeln('...');
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


async function sub_16622() {
  show_header_stats();
  TextColor(7);
  GotoXY(1, 8);
  Writeln('Ты сейчас в ПОМИ. К кому идти?');
  dialog_start();

  for (let var_2 = 0; var_2 <= 5; ++var_2) {

    if (!jz(is_professor_here(var_2), 0)) {
      dialog_case(subjects[var_2].professor.name, var_2);
    }
  }

  dialog_case('Ни к кому', -1);
  current_subject = await dialog_run(1, 0x0A);

  if (jz(Random(2), 0)) {
    await sub_165D9(current_subject);
  }
} // end function 16622


async function look_board_pomi() {
  await show_top_gamers();
} // end function 166B7


async function sub_1673E() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  Writeln('Что брать будем?');
  show_short_today_timesheet(0x0A);
  dialog_start();

  if (!(hero.money < 2)) {
    dialog_case('Кофе за 2 р.', -1);
  }

  if (!(hero.money < 4)) {
    dialog_case('Корж за 4 р.', -2);
  }

  if (!(hero.money < 6)) {
    dialog_case('Кофе и выпечку, 6 р.', -3);
  }

  dialog_case('Ничего, просто просидеть здесь часок.', -4);
  dialog_case('Совсем ничего. Бывает.', 0);

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


async function sub_16914() {

  if (!hero.has_ticket && hero.money >= 5) {
    ClrScr();
    show_header_stats();
    show_short_today_timesheet(0x0A);
    GotoXY(1, 8);
    TextColor(0x0E);
    Writeln('Едем в ПУНК, билета нет. Будем покупать билет (5 рублей)?');
    dialog_start();
    dialog_case('Да, будем', -1);
    dialog_case('Нет, не будем', -2);
    let ax = await dialog_run(1, 0x0A);

    if (jz(ax, -1)) {
      hero.money -= 5
      hero.has_ticket = 1;
    }
  }

  decrease_health(Random(0x0A), 'В электричке нашли бездыханное тело.');
  current_place = 1;

  if (!hero.has_ticket) {
    GotoXY(1, 0x16);
    Write('Едем зайцем... ');

    if (hero.charizma < Random(0x0A)) {
      Writeln('Контролеры поймали! Высадили в Красных Зорях!');
      decrease_health(0x0A, 'Контролеры жизни лишили.');
    }

    await wait_for_key();
    await hour_pass();
    // #warning return here?
  }

  await hour_pass();
  hero.has_ticket = 0;
} // end function 16914


async function scene_pomi() {
  show_header_stats();
  TextColor(7);
  GotoXY(1, 8);
  Writeln('Ты в ПОМИ. Что делать?');
  dialog_start();
  dialog_case('Идти к преподу', -1);
  dialog_case('Посмотреть на доску объявлений', -2);
  dialog_case('Пойти в кафе', -3);
  dialog_case('Поехать в ПУНК', -4);

  for (let var_2 = 0; var_2 <= 0xB; ++var_2) {
    if (classmates[var_2].place === 2 && classmates[var_2].current_subject === -1) {
      dialog_case_colored(classmate_names[var_2], var_2, 0xE);
    }
  }

  dialog_case_colored('С меня хватит!', -5, 9);
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
  } else if (!(res < 0) && !jg(res, 0x0B)) {
    await talk_with_classmate(res);
  }

} // end function 16A91



function read_top_gamers() {
  /*
  let aMmheroes_hi = 'mmheroes.hi';
  let aKolq_0 = 'Коля';
  let aSasa_0 = 'Саша';
  let aAndru_0 = 'Эндрю';
  let aPasa_0 = 'Паша';
  let aGrisa_0 = 'Гриша';

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
  Writeln('********************** ПОЗДРАВЛЯЮ! ***************************');
  Writeln('Ты попал в скрижали Мат-Меха! Сейчас тебя будут увековечивать!');
  Writeln('Не бойся, это не больно.');
  Writeln();
  Write('Как тебя зовут, герой? ');
  TextColor(0x0A);
  let my_name = Readln();

  if (my_name.length === 0) {
    TextColor(0x0F);
    Writeln();
    Writeln('Не хочешь увековечиваться - не надо!');
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

  Writeln();
  TextColor(0x0F);
  Writeln('Ну, вот и все.');
  Writeln();
} // end function 16D8E


function write_top_gamers() {
  /*
	let var_82;
	let var_80;

	Assign(var_80, 'mmheroes.hi');
	Rewrite(var_80, 0x23);

	for (var_82 = 0; var_82 <= 4; ++var_82) {
		Write(var_80, top_gamers[var_82]);
	}

	Close(var_80);
*/
} // end function 16F39


async function show_top_gamers() {
  ClrScr();
  TextColor(0x0F);
  Writeln('******                                           ******');
  Writeln('      *********                         *********');
  Writeln('               *************************');
  TextColor(0x0E);
  Writeln('Вот имена тех, кто прошел это наводящее ужас испытание:');
  Writeln();
  Writeln('    ГЕРОЙ            ЗАРАБОТАЛ');

  for (let i = 0; i < top_gamers.length; ++i) {
    TextColor(0x0F);
    GotoXY(4, i + 7)
    Write(top_gamers[i].name);
    GotoXY(0x19, i + 7);
    Write(top_gamers[i].score);
    Write(' руб.');
  }

  GotoXY(1, 0x14);
  TextColor(7);
  await wait_for_key();
} // end function 1707F


async function sub_171C4() {
  if (hero.health <= 0) {
    return;
  }

  ClrScr();
  show_header_stats();
  GotoXY(1, 0x17);
  TextColor(0x0C);

  if (subjects[current_subject].member0xFA * 5 + time_of_day * 6 < hero.charizma * 3 + Random(0x3C) + 0x14) {
    Write(subjects[current_subject].professor.name);
    Write(' задерживается еще на час.');
    timesheet[day_of_week][current_subject].to = time_of_day + 1;

  } else {
    Write(subjects[current_subject].professor.name);
    Write(' уходит.');
    current_subject = -1;

  }

  await wait_for_key();
} // end function 171C4


async function sub_173B6() {
  let var_1;

  ClrScr();
  if (time_of_day > 20) {
    TextColor(0x0E);
    Writeln('Увы, ПОМИ уже закрыто, поэтому придется ехать домой...');
    var_1 = 4;
  } else {
    show_header_stats();
    current_subject = -1;
    GotoXY(1, 0x0C);
    TextColor(0x0B);
    Writeln('Ты в Питере, на Балтийском вокзале.');
    Writeln('Куда направляемся?');
    show_short_today_timesheet(0x0C);
    dialog_start();
    dialog_case('Домой, в ПУНК!', -1);
    dialog_case('Хочу в ПОМИ!', -2);
    var_1 = await dialog_run(1, 0x0F) === -1 ? 1 : 2;
  }

  if (jz(var_1, 1)) {
    GotoXY(1, 0x14);
    if (hero.has_ticket) {
      Writeln('Хорошо, билет есть...');
    } else if (hero.charizma < Random(0x0A)) {
      Writeln('Тебя заловили контролеры!');
      Writeln('Высадили в Красных зорях, гады!');
      decrease_health(0x0A, 'Контролеры жизни лишили.');
      await hour_pass();
      current_place = 1;
      await wait_for_key();
      ClrScr();
    } else {
      Writeln('Уф, доехал...');
    }
    await hour_pass();
  }

  current_place = var_1;
} // end function 173B6


async function sub_175A6() {
  let var_6;
  let var_4;
  let var_2;

  ClrScr();
  show_header_stats();
  GotoXY(1, 0x0E);
  Writeln('Всемирнов принимает зачет даже в электричке!');
  TextColor(0x0D);
  Writeln('Мучаешься ...');
  TextColor(7);
  Writeln();

  var_6 = idiv((hero.subject[current_subject].knowledge - subjects[current_subject].member0xFA + Random(hero.brain)) * 3, 4);

  if (!jg(hero.health, 5)) {
    var_6 -= Random(5 - hero.health);
  }

  if (!(var_6 <= 0)) {
    var_6 = Round(Sqrt(var_6) / subjects[current_subject].member0x100);
  } else {
    var_6 = 0;
  }

  if (!(hero.subject[current_subject].tasks_done + var_6 <= subjects[current_subject].tasks)) {
    var_6 = subjects[current_subject].tasks - hero.subject[current_subject].tasks_done;
  }

  var_2 = Random(hero.stamina) - Random(subjects[current_subject].member0xFA);
  if (!(var_2 <= 0)) {
    var_2 = 0;
  }

  hero.subject[current_subject].knowledge += var_2;
  if (hero.subject[current_subject].knowledge < 0) {
    hero.subject[current_subject].knowledge = 0;
  }

  var_4 = Random(idiv(hero.stamina * 2, 3)) - subjects[current_subject].member0xFC;
  if (!(var_4 <= 0)) {
    var_4 = 0;
  }

  hero.health += var_4;
  if (hero.health <= 0) {
    is_end = 1;
    death_cause = subjects[current_subject].professor.name + ' замучил';
    if (jz(subjects[current_subject].professor.sex, 0)) {
      death_cause += 'а';
    }
    death_cause += '.';
  } else {

    GotoXY(1, 0x15);

    if (var_6 === 0) {
      colored_output(0x0C, 'Твои мучения были напрасны.');
    } else {
      colored_output(0x0A, 'Тебе зачли еще ');
      colored_output_white(var_6);
      TextColor(0x0A);
      zadanie_in_case(var_6);
      Write('!');
      TextColor(7);
    }

    hero.subject[current_subject].tasks_done += var_6;
    await wait_for_key();
    await hour_pass();
  }

  await sub_173B6();
} // end function 175A6


async function sub_17AA2() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 0x0C);

  if (!(time_of_day <= 0x14)) {
    TextColor(7);
    Write('М.А. Всемирнов :');
    TextColor(0x0F);
    Writeln('"Нет, сегодня я больше никому ничего не засчитаю..."');
    TextColor(0x0E);
    Writeln('Услышав эту фразу, ты осознаешь беспочвенность своих мечтаний');
    Writeln('о сдаче зачета по алгебре в электричке.');
    await wait_for_key();
    current_subject = -1;
    return;
  }

  TextColor(7);
  Writeln('Есть надежда, что в электричке удастся что-то еще решить.');
  Writeln('Правда, зачетной ведомости с собой туда не взять...');

  if (hero.money < 0x0A) {
    TextColor(0x0C);
    Writeln('Денег у тебя нет, пришлось ехать зайцем...');

    if (hero.charizma < Random(0x0A)) {
      TextColor(0x0D);
      Writeln('Тебя заловили контролеры!');
      Writeln('Высадили в Красных зорях, гады!');
      decrease_health(0x0A, 'Контролеры жизни лишили.');
      current_place = 1;
      await wait_for_key();
      ClrScr();
    }

  } else {
    dialog_start();
    dialog_case('Ехать зайцем', -1);
    dialog_case('Честно заплатить 10 руб. за билет в оба конца', -2);
    const ax = await dialog_run(1, 0x11);

    if (ax === -1) {
      hero.has_ticket = 0;

      if (hero.charizma < Random(0x0A)) {
        GotoXY(1, 0x15);
        TextColor(0x0D);
        Writeln('Тебя заловили контролеры!');
        decrease_health(0x0A, 'Контроллеры, контроллеры, контроллеры...');
        Writeln('И со Всемирновым ты ничего не успел...');
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


async function sub_17D20() {
  ClrScr();
  show_header_stats();
  TextColor(0x0C);
  GotoXY(1, 0x0C);
  Writeln('Всеминов М.А. уходит.');

  if (current_place !== 1 || hero.subject[Algebra].tasks_done >= subjects[Algebra].tasks) {
    current_subject = -1;
    await wait_for_key();
  } else {
    Writeln('Пойти за ним на электричку?');
    dialog_start();
    dialog_case('Да, я хочу еще помучаться', -1);
    dialog_case('Ну уж нет, спасибо!', -2);
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


async function sub_17E1A() {
  Writeln();
  TextColor(0x0A);
  Writeln('Твоя зачетка пополнилась еще одной записью.');
  TextColor(7);
  await wait_for_key();
  ClrScr();
  show_header_stats();
} // end function 17E1A


async function sub_17F12() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  Writeln('Всемирнов медленно рисует минус ...');
  await Delay(0x3E8);
  Writeln('И так же медленно пририсовывает к нему вертикальную палочку!');
  Writeln('Уф! Ну и шуточки у него!');
  Writeln('Хорошо хоть, зачет поставил...');
  decrease_health(Random(6), 'Всемирнов М.А. изничтожил.');
  await wait_for_key();
  ClrScr();
  show_header_stats();
} // end function 17F12


function sub_17FAD(arg_2) {
  TextColor(Random(6) + 9);
  Writeln(arg_2);
  TextColor(7);
} // end function 17FAD


async function sub_183A0() {
  colored_output(7, 'Влащенко Н.П.:');
  colored_output_ln(0x0F, '"Закройте глаза ..."');
  Writeln('Ты послушно закрываешь глаза.');
  await Delay(0x3E8);
  colored_output_ln(0x0F, '"Октройте глаза ..."');
  sub_17FAD('Ты видишь Влащенко Н.П. в костюме сказочной феи.');
  sub_17FAD('Влащенко Н.П. касается тебя указкой (она же - волшебная палочка ...)');
  sub_17FAD('Ты чувствуешь, что с тобой происходит что-то сверхъестественное.');

  const ax = Random(0x0F);

  if (ax === 0) {
    sub_17FAD('Тебе сильно поплохело.');
    decrease_health(0x1E, 'Фея была явно не в настроении.');
  } else if (ax === 1) {
    sub_17FAD('Ты почувствовал себя где-то в другом месте.');
    current_place = 2;
    current_subject = -1;
  } else if (ax === 2) {
    hero.subject[Algebra].knowledge = idiv(hero.subject[Algebra].knowledge, 2);
    sub_17FAD('Ты чувствуешь, что подзабыл алгебру...');
  } else if (ax === 3) {
    hero.subject[Matan].knowledge = idiv(hero.subject[Matan].knowledge, 2);
    sub_17FAD('Ты чувствуешь, что анализ придется учить заново.');
  } else if (ax === 4) {
    hero.brain -= Random(2) + 1;
    sub_17FAD('В голову постоянно лезут мысли о всяких феях...');
  } else if (ax === 5) {
    hero.charizma -= Random(2) + 1;
    sub_17FAD('Ты чувствуешь, что все вокруг жаждут твоей смерти.');
  } else if (ax === 6) {
    hero.stamina -= Random(2) + 1;
    sub_17FAD('Куда-то подевалась твоя уверенность в себе.');
  } else if (ax === 7) {
    hero.brain += Random(3) + 1;
    sub_17FAD('Голова стала работать заметно лучше.');
  } else if (ax === 8) {
    hero.charizma += Random(3) + 1;
    sub_17FAD('Ты проникся любовью к окружающему миру.');
  } else if (ax === 9) {
    hero.stamina += Random(3) + 1;
    sub_17FAD('Ты готов к любым испытаниям.');
  } else if (ax === 0xA) {
    if (!(hero.money <= 0)) {
      hero.money = 0;
      sub_17FAD('Пока твои глаза были закрыты, кто-то утащил твои деньги!!!');
    } else {
      hero.money = 0x14;
      sub_17FAD('Ты нашел в своем кармане какие-то деньги!');
    }
  } else if (ax === 0xB || ax === 0xC || ax === 0xD) {
    sub_17FAD('Ты чувствуешь, что от тебя сильно несет чесноком.');
    sub_17FAD('Не знаю, выветрится ли такой сильный запах...');
    hero.garlic = Random(4) + 1;
    hero.charizma -= idiv(hero.garlic, 2);
  } else if (ax === 0xE) {
    sub_17FAD('Странное чувство быстро прошло.');
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


async function sub_18677() {
  GotoXY(1, 0x14);
  TextColor(0x0D);
  Writeln('Мучаешься ...');
  TextColor(7);
  Writeln();

  let bp_var_4 = hero.subject[current_subject].knowledge - subjects[current_subject].member0xFA + Random(hero.brain);
  if (!jg(hero.health, 5)) {
    bp_var_4 -= Random(5 - hero.health);
  }

  if (!(bp_var_4 <= 0)) {
    bp_var_4 = Round(Sqrt(bp_var_4) / subjects[current_subject].member0x100);
  } else {
    bp_var_4 = 0;
  }

  if (!(hero.subject[current_subject].tasks_done + bp_var_4 <= subjects[current_subject].tasks)) {
    bp_var_4 = subjects[current_subject].tasks - hero.subject[current_subject].tasks_done;
  }

  let var_4 = Random(hero.stamina) - Random(subjects[current_subject].member0xFA);
  if (!(var_4 <= 0)) {
    var_4 = 0;
  }

  hero.subject[current_subject].knowledge += var_4;
  if (hero.subject[current_subject].knowledge < 0) {
    hero.subject[current_subject].knowledge = 0;
  }

  if (jz(current_subject, 2) && !jge(hero.charizma * 2 + 0x1A, hero.subject[current_subject].knowledge)) {
    GotoXY(1, 0x14);
    TextColor(7);
    Write('Подкорытов:');
    TextColor(0x0F);
    Writeln('"Чего-то я не понимаю... Похоже, Вы меня лечите..."');
    bp_var_4 = 0;
  }

  GotoXY(1, 0x15);
  if (jz(bp_var_4, 0)) {
    colored_output(0x0C, 'Твои мучения были напрасны.');
  } else {
    colored_output(0x0A, 'Тебе зачли еще ');
    colored_output_white(bp_var_4);
    TextColor(0x0A);
    zadanie_in_case(bp_var_4);
    Write('!');
    TextColor(7);
  }


  hero.subject[current_subject].tasks_done += bp_var_4;
  let var_2 = Random(hero.stamina) - subjects[current_subject].member0xFC;

  if (var_2 > 0) {
    var_2 = 0;
  }

  hero.health += var_2;
  if (hero.health <= 0) {
    is_end = 1;
    death_cause = subjects[current_subject].professor.name + ' замучил';
    if (jz(subjects[current_subject].professor.sex, 0)) {
      death_cause += 'а';
    }
    death_cause += '.';
  }

  await hour_pass();
  await wait_for_key();

} // end function 18677


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

  if ((hero.health <= 0) || !(is_end === 0)) {
    return;
  }

  ClrScr();
  show_header_stats();

  if (!(hero.subject[current_subject].tasks_done < subjects[current_subject].tasks)) {
    Writeln();
    TextColor(0x0A);
    Writeln('У вас все зачтено, можете быть свободны.');
    TextColor(7);

    if (hero.subject[current_subject].passed === 0) {
      hero.subject[current_subject].pass_day = day_of_week;
      hero.subject[current_subject].passed = 1;
      --hero.exams_left;

      Writeln();
      await sub_185C9(current_subject);

      if (!(current_subject !== -1)) {
        return;
      }

      if (!(is_end === 0)) {
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
  Write('Сейчас тебя истязает ');
  Write(subjects[current_subject].professor.name);
  Writeln('.');

  let var_4 = 0;
  for (var_2 = 0; var_2 <= 0xB; ++var_2) {
    if ((classmates[var_2].current_subject === current_subject) || !(current_place !== 3)) {
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
    Write('Кроме тебя, здесь еще сид');

    if (!(var_4 !== 1)) {
      Write('ит ');
    } else if (!(var_4 <= 1)) {
      Write('ят ');
    }

    for (var_2 = 0; var_2 <= 0xB; ++var_2) {
      if (jb(var_2, 0x10)) {
        if (var_6 & (1 << var_2)) {
          Write(classmate_names[var_2]);

          --var_4;

          if (!jbe(WhereY(), 0x46)) {
            Writeln();
          }

          if (!(var_4 !== 0)) {
            Writeln('.');
          } else if (!(var_4 !== 1)) {
            Write(' и ');
          } else {
            Write(', ');
          }
        }
      }
    }
  }

  do {
    if (!jg(idiv(hero.charizma, 2), var_14)) {
      break;
    }

    if (!(var_14 <= 3)) {
      break;
    }

    for (var_2 = 0; var_2 <= 0xB; ++var_2) {
      if ((var_12[var_2] === 0)) {
        if (classmates[var_2].member0x32C - idiv(var_14, 2) - hero.garlic > Random(0x0A)) {
          if (!jnb(var_2, 0x10)) {
            if (var_6 & (1 << var_2)) {
              if (!(idiv(hero.charizma, 2) <= var_14)) {
                var_12[var_2] = 1;

                ++var_14;
                await sub_18FB2(var_2);

                if (!jg(timesheet[day_of_week][current_subject].to, time_of_day)) {
                  await sub_17DD3(current_subject);
                  return;
                } else {
                  await check_exams_left_count();
                  if (!(is_end === 0)) {
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
    colored_output_ln(7, 'У тебя еще ничего не зачтено.');
  } else {
    if (!jge(hero.subject[current_subject].tasks_done, subjects[current_subject].tasks)) {
      colored_output(7, 'Зачтено ');
      colored_output_white(hero.subject[current_subject].tasks_done);
      colored_output(7, ' задач из ');
      colored_output_white(subjects[current_subject].tasks);
      Writeln();
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
  } else if (!(var_2 < 0) && !jg(var_2, 0xB)) {
    await talk_with_classmate(var_2);
  }
} // end function 18A75


async function sub_18FB2(arg_0) {
  let var_104;
  let var_4;
  let var_1;

  if (!(jz(arg_0, 3) && jz(current_place, 3))) {

    Writeln();
    Write('К тебе пристает ');
    Write(classmate_names[arg_0]);

    Writeln('. Что будешь делать?');

    dialog_start();
    dialog_case('Пытаться игнорировать', -1);
    dialog_case(classmate_names[arg_0], -2);

    var_4 = WhereY() + 2;
    show_short_today_timesheet(var_4);
    const res = await dialog_run(1, var_4);

    if (res === -1) {
      if (classmates[arg_0].member0x344 > 0) {
        GotoXY(1, 0x16);
        Writeln('Тебе как-то нехорошо ...');
        decrease_health(classmates[arg_0].member0x344, classmate_names[arg_0] + ' лучше игнорировать не надо.');
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


async function talkToKolya() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  Writeln('Коля смотрит на тебя немного окосевшими глазами.');

  if (hero.charizma > Random(0x0A) && subjects[Algebra].tasks - 2 >= hero.subject[Algebra].tasks_done) {
    _set_current_color(0x0F);
    Writeln('"У тебя остались нерешенные задачи по Всемирнову? Давай сюда!"');
    hero.subject[Algebra].tasks_done += 2;
    output_with_highlighted_num(7, 'Коля решил тебе еще ', 0x0F, 2, ' задачи по алгебре!');
    await wait_for_key();
    ClrScr();
    await hour_pass();
    return;
  }

  _set_current_color(0x0F);
  Writeln('"Знаешь, пиво, конечно, хорошо, но настойка овса - лучше!"');

  if (hero.money <= 0x0F) {
    GotoXY(1, 0x0F);
    _set_current_color(0x0D);
    Writeln('Коля достает тормозную жидкость, и вы распиваете еще по стакану.');
    --hero.brain;

    if (hero.brain <= 0) {
      hero.health = 0;
      is_end = 1;
      death_cause = 'Спился.';
    }

  } else {
    _set_current_color(7);
    Writeln('Заказать Коле настойку овса?');
    dialog_start();
    dialog_case('Да', -1);
    dialog_case('Нет', -2);
    show_short_today_timesheet(0x0C);
    let res = await dialog_run(1, 0x0F);

    if (res === -1) {
      hero.money -= 0xF;
      GotoXY(1, 0x13);

      if (hero.charizma > Random(0x0A) && hero.subject[Algebra].tasks_done + 1 < subjects[Algebra].tasks) {
        _set_current_color(0x0F);
        Writeln('"У тебя остались нерешенные задачи по Всемирнову? Давай сюда!"');
        hero.subject[Algebra].tasks_done += 2;
        output_with_highlighted_num(7, 'Коля решил тебе еще ', 0x0F, 2, ' задачи по алгебре!');
        await wait_for_key();
        ClrScr();
        await hour_pass();
        return;
      } else {
        _set_current_color(7);
        Writeln('Твой альтруизм навсегда останется в памяти потомков.');
      }

    } else if (res === -2) {
      GotoXY(1, 0x13);
      _set_current_color(0x0F);
      Writeln('"Зря, ой, зря ..."');
      _set_current_color(0x0D);
      Writeln('Коля достает тормозную жидкость, и вы распиваете еще по стакану.');
      --hero.brain;
      await wait_for_key();
      ClrScr();
      return;
    }
  }

  await wait_for_key();
  ClrScr();
} // end function 19259


async function talkToDiamond() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  _set_current_color(0x0E);
  Writeln('Wow! Ты только что встретил автора !');
  Writeln();
  Write('Diamond:');

  if (hero.has_mmheroes_disk === 0 && current_place === 3 && !ja(Random(8), 0)) {
    Writeln('"Хочешь по-тестить новую версию Heroes of MAT-MEX?"');
    dialog_start();
    dialog_case('ДА, КОНЕЧНО, ОЧЕНЬ ХОЧУ!', -1);
    dialog_case('Нет, у меня нет на это времени...', -2);
    show_short_today_timesheet(0x0C);
    let res = await dialog_run(1, 0x0C);
    if (res === -1) {
      GotoXY(1, 0x10);
      Writeln('"Ну и ладушки! Вот тебе дискетка..."');
      hero.has_mmheroes_disk = 1;
      await wait_for_key();
    } else if (res === -2) {
      GotoXY(1, 0x10);
      Writeln('"Извини, что побеспокоил."');
      await wait_for_key();
    }
    return;
  }

  _set_current_color(0x0F);
  Writeln([
    '"Коля поможет с алгеброй."',
    '"Миша расскажет всем, какой ты хороший."',
    '"Паша - твой староста."',
    '"С DJuGом лучше не сталкиваться."',
    '"RAI не отстанет, лучше решить ему чего-нибудь."',
    '"Коля все время сидит в мавзолее и оттягивается."',
    '"Следи за своим здоровьем!!!"',
    '"Если встретишь Сашу - ОБЯЗАТЕЛЬНО заговори с ним."',
    '"Если плохо думается, попробуй поговорить с RAI."',
    '"Идя к Коле, будь уверен, что можешь пить с ним."',
    '"Получая зачет по английскому, будь готов к неожиданностям."',
    '"Иногда разговоры с Сержем приносят ощутимую пользу."',
    '"Эндрю может помочь, но не всегда..."',
    '"Кузьменко иногда знает о Климове больше, чем сам Климов."',
    '"Не спеши слать гневные письма о багах:\nзагляни на mmheroes.chat.ru,\nможет быть, все уже в порядке!"',
    '"Серж тоже иногда забегает в мавзолей."',
    '"Не переучи топологию, а то Подкорытов-младший не поймет."',
    '"Можешь устроиться в ТЕРКОМ по знакомству."',
    '"Гриша работает ( ;*) ) в ТЕРКОМе."',
    '"В ТЕРКОМЕ можно заработать какие-то деньги."',
    '"Гриша иногда бывает в Мавзолее."',
    '"Не нравится расписание? Подумай о чем-нибудь парадоксальном."',
    '"NiL дает деньги за помощь, но..."',
    '"Честно, не знаю, когда будет готов порт под Linux..."',
    '"Срочно! Нужны новые фишки для "Зачетной недели" !"',
    '"Пожелания, идеи, bug report\'ы шлите на mmheroes@chat.ru !"',
    '"Встретишь Костю Буленкова - передай ему большой привет!"',
    '"Большое спасибо Ване Павлику за mmheroes.chat.ru !"'
  ][Random(0x1C)]);
  _set_current_color(7);

  if (current_subject === -1) {
    if (Random(2) === 0) {
      Writeln('Diamond убегает по своим делам ...');
      classmates[Diamond].place = 0;
      classmates[Diamond].current_subject = -1;
    }
  }

  await wait_for_key();
} // end function 19B20


async function talkToRAI() {
  if (current_subject >= 3 || current_subject === -1) {
    ClrScr();
    show_header_stats();
    GotoXY(1, 8);
    Writeln('RAI не реагирует на твои позывы.');
  } else {
    dialog_start();
    ClrScr();
    show_header_stats();
    TextColor(7);
    GotoXY(1, 0x0A);
    Write('RAI:');
    TextColor(0x0F);
    Write('"Ты мне поможешь?"');
    dialog_case('"Да, конечно"', 1);
    dialog_case('"Нет, извини..."', 2);
    show_short_today_timesheet(0x0C);
    let ax = await dialog_run(1, 0x0C);

    if (ax === 1) {
      GotoXY(1, 0x0F);

      if (!jbe(Random(hero.subject[current_subject].knowledge), Random(subjects[current_subject].member0xFA))) {
        TextColor(0x0A);
        Writeln('Ты помог RAI.');
        ++hero.brain;
        TextColor(7);
      } else {
        Writeln('Ничего не вышло.');
      }
      await hour_pass();
    } else if (ax === 2) {
      GotoXY(1, 0x0F);
      TextColor(0x0D);
      Writeln('"Ах, так! Получай! Получай!"');
      TextColor(7);
      Writeln('RAI делает тебе больно ...');
      decrease_health(0x0A, 'RAI замочил.');
    }
  }

  await wait_for_key();
  ClrScr();
} // end function 1A0A2


async function talkToMisha() {
  ClrScr();
  show_header_stats();

  if (!(current_place === 3 || current_subject === -1)) {
    GotoXY(1, 8);
    TextColor(7);
    Write('Миша : ');
    TextColor(0x0F);
    Writeln('"Слушай, хватит мучаться! Прервись!');
    Writeln('Давай в клоподавку сыграем!"');
    dialog_start();
    dialog_case('"Давай!"', 1);
    dialog_case('"Нет, не буду я в клоподавку ..."', 2);
    const res = await dialog_run(1, 0x0C);

    if (res === 1) {
      GotoXY(1, 0x0F);
      TextColor(0x0A);
      Writeln('Ты сыграл с Мишей партию в клоподавку.');
      TextColor(7);
      ++hero.charizma;
      await wait_for_key();
      ClrScr();
      await hour_pass();
    } else if (res === 2) {
      GotoXY(1, 0x0F);
      TextColor(0x0F);
      Writeln('"Зря, очень зря!"');
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
      Write('Миша : ');
      TextColor(0x0F);
      Writeln('"Слушай, а ведь в ТЕРКОМе есть столик для тенниса. Сыграем?"');
      dialog_start();
      dialog_case('"Обязательно!"', 1);
      dialog_case('"Извини, потом."', 2);
      const res = await dialog_run(1, 0x0C);

      if (res === 1) {
        GotoXY(1, 0x0F);
        TextColor(0x0A);
        Writeln('Ты сыграл с Мишей в теннис.');
        TextColor(7);
        ++hero.charizma;

        if (hero.charizma < Random(0x0A)) {
          decrease_health(Random(3) + 3, 'Загонял тебя Миша.');
        } else {
          await wait_for_key();
          ClrScr();
          await hour_pass();
        }

      } else if (res === 2) {
        GotoXY(1, 0x0F);
        TextColor(0x0F);
        Writeln('"Ничего, я на тебя не в обиде."');
        await wait_for_key();
        TextColor(7);
        ClrScr();
      }
      return;
    }
  }

  GotoXY(1, 8);
  TextColor(7);
  Write('Миша:');
  TextColor(0x0F);

  Write([
    '"Эх, жаль, негде сыграть в клоподавку!"',
    '"Всегда следи за здоровьем!"',
    '"Мозги влияют на подготовку и сдачу зачетов."',
    '"Чем больше выносливость, тем меньше здоровья ты тратишь."',
    '"Чем больше твоя харизма, тем лучше у тебя отношения с людьми."',
    '"Важность конкретного качества сильно зависит от стиля игры."',
    '"Харизма помогает получить что угодно от кого угодно."',
    '"Чем больше харизма, тем чаще к тебе пристают."',
    '"Чем меньше выносливость, тем больнее учиться."',
    '"Чем больше мозги, тем легче готовиться."',
    '"Сидение в Inet\'e иногда развивает мозги."',
    '"Если тебе надоело умирать - попробуй другую стратегию."',
    '"Хочешь халявы - набирай харизму."',
    '"Хочешь добиться всего сам - развивай мозги."',
    '"В "Мавзолее" важно знать меру..."',
    '"От раздвоения личности спасают харизма и выносливость."',
    '"От любого общения с NiL ты тупеешь!"',
    '"Гриша может помочь с трудоустройством."',
    '"Перемещения студентов предсказуемы."',
  ][Random(0x13)]);

  await wait_for_key();
  ClrScr();
} // end function 1A70A


async function sub_Serzg() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  TextColor(7);
  Write('Серж: ');
  TextColor(0x0F);

  if (!(!ja(Random(hero.charizma), Random(3) + 2)) && !(hero.charizma * 2 + 0x14 <= hero.health)) {
    Writeln('"На, глотни кефирчику."');
    hero.health += hero.charizma + Random(hero.charizma);

    if (!jz(current_subject, -1)) {
      if (hero.subject[current_subject].knowledge > 3) {
        hero.subject[current_subject].knowledge -= Random(3);
      }
    }

  } else {
    if (Random(hero.charizma) > Random(6) + 2 && hero.subject[Fizra].knowledge < 0x0A) {
      Writeln('"Я знаю, где срезать в парке на физ-ре!"');
      hero.subject[Fizra].knowledge += 0x1E;
    } else {
      let ax = Random(0x16);
      if (ax === 0) {
        Writeln('"Помнится, когда-то была еще графическая версия mmHeroes..."');
      } else if (ax === 1) {
        Writeln('"Я был бета-тестером первой версии mmHeroes (тогда еще CRWMM19)!"');
      } else if (ax === 2) {
        Writeln('"Как здорово, что Diamond написал новую версию!"');
      } else if (ax === 3) {
        Writeln('"Ты уже получил деньги у Паши?"');
      } else if (ax === 4) {
        Writeln('"Попробуй для начала легкие зачеты."');
      } else if (ax === 5) {
        Writeln('"Ты еще не получил зачет по английскому?"');
      } else if (ax === 6) {
        Writeln('"Хочешь отдыхать, где угодно? Заимей деньги!"');
      } else if (ax === 7) {
        Writeln('"Не в деньгах счастье. Но они действуют успокаивающе."');
      } else if (ax === 8) {
        Writeln('"На Всемирнове всегда толпа народу."');
      } else if (ax === 9) {
        Writeln('"Влащенко - дама весьма оригинальная."');
      } else if (ax === 0xA) {
        Writeln('"Интересно, когда будет готова следующая версия?"');
      } else if (ax === 0xB) {
        Writeln('"Здоровье в кафе повышается в зависимости от наличия денег."');
      } else if (ax === 0xC) {
        Writeln('"Если бы я знал адрес хорошего proxy..."');
      } else if (ax === 0xD) {
        Writeln('"STAR временно накрылся. Хорошо бы узнать адрес другого proxy..."');
      } else if (ax === 0xE) {
        Writeln('"Я подозреваю, что Гриша знает адресок теркомовского proxy."');
      } else if (ax === 0xF) {
        Writeln('"А Diamond все свободное время дописывает свою игрушку!"');
      } else if (ax === 0x10) {
        Writeln('"В следующем семестре информатику будет вести Терехов-младший."');
      } else if (ax === 0x11) {
        Writeln('"Diamond хочет переписать это все на Java."');
      } else if (ax === 0x12) {
        Writeln('"Миша проконсультирует тебя о стратегии."');
      } else if (ax === 0x13) {
        Writeln('"Поговори с Diamond\'ом, он много ценного скажет."');
      } else if (ax === 0x14) {
        Writeln('"Борись до конца!"');
      } else if (ax === 0x15) {
        Writeln('"У Дубцова иногда бывает халява."');
      }
    }
  }

  if (hero.charizma < Random(9)) {
    TextColor(7);
    Writeln('Серж уходит куда-то по своим делам ...');
    classmates[Serzg].current_subject = -1;
    if (jz(classmates[Serzg].place, 5)) {
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

  if (jz(hero.got_stipend, 0)) {
    hero.got_stipend = 1
    GotoXY(1, 8);
    output_with_highlighted_num(7, 'Паша вручает тебе твою стипуху за май: ', 0x0F, 0x32, ' руб.');
    hero.money += 0x32;
  } else {
    GotoXY(1, 8);
    TextColor(0x0A);
    Writeln('Паша воодушевляет тебя на великие дела.');
    TextColor(0x0C);
    Writeln('Вместе с этим он немного достает тебя.');
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


async function sub_1B6B7() {
  let var_2;

  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  TextColor(0x0E);
  Writeln('Ты встретил Сашу! Говорят, у него классные конспекты ...');
  dialog_start();

  for (var_2 = 0; var_2 <= 2; ++var_2) {
    if (synopsis[var_2].hero_has === 0) {
      dialog_case(subjects[var_2].title, var_2);
    }
  }

  dialog_case('Ничего не надо', -1);
  GotoXY(1, 9);
  Writeln('Чего тебе надо от Саши?');
  var_2 = await dialog_run(1, 0x0B);

  if (jz(var_2, -1)) {
    GotoXY(1, 0x0F);
    Writeln('Как знаешь...');
  } else {
    if (hero.charizma > Random(0x12) && !jz(synopsis[var_2].sasha_has, 0)) {
      GotoXY(1, 0x0F);
      TextColor(7);
      Write('Саша:');
      TextColor(0x0F);
      Writeln('"Да, у меня с собой этот конспект ..."');
      synopsis[var_2].hero_has = 1;
      byte_2549F = 0;
    } else {
      GotoXY(1, 0x0F);
      TextColor(7);
      Write('Саша:');
      TextColor(0x0F);
      Writeln('"Ох, извини, кто-то другой уже позаимствовал ..."');
      synopsis[var_2].sasha_has = 0;
    }
  }

  await wait_for_key();
  ClrScr();
} // end function 1B6B7


async function sub_1B986() {
  ClrScr();
  show_header_stats();

  if (jz(current_subject, -1)) {
    GotoXY(1, 8);
    TextColor(7);
    Writeln('Ты заводишь с NiL светскую беседу.');
    TextColor(0x0D);
    Writeln('Тебе поплохело.');
    decrease_health(0x0A, 'Общение с NiL оказалось выше человеческих сил.');

  } else {
    GotoXY(1, 8);
    TextColor(0x0B);
    Writeln('"Маладой чилавек, вы мне не паможите решить задачу?');
    Writeln('А то я сигодня ни в зуб нагой ..."');
    dialog_start();
    dialog_case('"Да, конечно"', -1);
    dialog_case('"Извини, в другой раз"', -2);
    let ax = await dialog_run(1, 0x0B);

    if (ax === -1) {
      if (jg(hero.subject[current_subject].knowledge, subjects[current_subject].member0xFA)) {
        GotoXY(1, 0x0E);
        TextColor(0x0E);
        Write('"Ой, спасибо! Вот вам ');
        Write(hero.subject[current_subject].knowledge);
        Writeln(' руб. за это..."');

        hero.money += hero.subject[current_subject].knowledge;
        hero.health -= subjects[current_subject].member0xFC;

        hero.subject[current_subject].knowledge -= subjects[current_subject].member0x100 + Random(subjects[current_subject].member0xFC);

        if (!jg(hero.health, 0)) {
          is_end = 1;
          death_cause = 'Альтруизм не довел до добра.';
        }

        await hour_pass();

      } else {
        GotoXY(1, 0x0E);
        TextColor(0x0D);
        Writeln('У тебя ничего не вышло.');
        await hour_pass();
        hero.health -= subjects[current_subject].member0xFC;
        if (!jg(hero.health, 0)) {
          is_end = 1;
          death_cause = 'Альтруизм не довел до добра.';
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


function sub_1BE39() {
  GotoXY(1, 8);
  TextColor(7);
  Write('Кузьменко:');
  TextColor(0x0F);
  let ax = Random(0x0C);
  if (ax === 0) {
    Writeln('"... отформатировать дискету так, чтобы 1ый сектор был 5ым ..."');
  } else if (ax === 1) {
    Writeln('"А Вы нигде не видели литературы по фильтрам в Windows?"');
  } else if (ax === 2) {
    Writeln('"... написать визуализацию байта на ассемблере за 11 байт ..."');
  } else if (ax === 3) {
    Writeln('"У вас Олег Плисс ведет какие-нибудь занятия?"');
  } else if (ax === 4) {
    Writeln('"Bill Gates = must die = кабысдох (рус.)."');
  } else if (ax === 5) {
    Writeln('"Вы читали журнал "Монитор"? Хотя вряд ли..."');
  } else if (ax === 6) {
    Writeln('"Я слышал, что mmHeroes написана на BP 7.0."');
  } else if (ax === 7) {
    Writeln('"Записывайтесь на мой семинар по языку Си!"');
  } else if (ax === 8) {
    Writeln('"На третьем курсе я буду вести у вас спецвычпрактикум."');
  } else if (ax === 9) {
    Writeln('"Интересно, когда они снова наладят STAR?"');
  } else if (ax === 0xA) {
    Writeln('"Получите себе ящик rambler\'e или на mail.ru !"');
  } else if (ax === 0xB) {
    Writeln('"А разве Терехов-старший ничего не рассказывает про IBM PC?"');
  }
} // end function 1BE39


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
        if (jz(timesheet[var_4][Infa].where, 0)) {
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
    Write('Кузьменко:');
    TextColor(0x0F);
    Writeln('"Вы знаете, Климова можно найти в компьютерном классе');
    Write(var_6 + 0x16);
    Write('-го мая с ');

    Write(timesheet[var_6][Infa].from);
    Write(' по ');
    Write(timesheet[var_6][Infa].to);
    Writeln('ч.."');

  } else {
    sub_1BE39();
  }

  await wait_for_key();
  TextColor(7);
  ClrScr();
} // end function 1C02B


async function sub_1C1FF() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);
  TextColor(7);
  Writeln('DJuG:');
  TextColor(0x0F);
  Writeln('"У Вас какой-то школьный метод решения задач..."');

  if (hero.subject[GiT].knowledge > 5) {
    hero.subject[GiT].knowledge -= Random(5);
  }

  decrease_health(0x0F, 'Не общайся с тормозами!');
  await wait_for_key();
  TextColor(7);
  ClrScr();
} // end function 1C1FF


function sub_1C6DC(/*arg_0*/) {
  TextColor(7);
  Write('Эндрю: ');
  TextColor(0x0F);

  if (Random(3) > 0) {

    Writeln([
      '"Скажи Diamond\'у, что маловато описалова!"',
      '"А еще Diamond думал переписать это на JavaScript."',
      '"А я знаю выигрышную стратегию! Если только не замочат..."',
      '"Вообще-то, все это происходит в мае 1998 г."',
      '"Я видел надпись на парте: ЗАКОН ВСЕМИРНОВА ТЯГОТЕНИЯ"',
      '"Загляни на mmheroes.chat.ru!"',
      '"Только не предлагай Diamond\'у переписать все на Прологе!"',
      '"Ну когда же будет порт под Linux?"',
      '"VMWARE - SUXX... Но под ним идут Heroes of Mat & Mech!"',
      '"Похоже, что моя стратегия обламывается..."',
      '"Ух ты! Гамма 3.14 - в этом что-то есть."',
      '"Может быть, Diamond\'а просто заклинило на многоточиях?"',
      '"Говорят, можно зарабатывать деньги, почти ничего не делая."',
      '"Вот, иногда мне приходится тяжко - когда пристают всякие..."',
      '"Хорошо ли, что многие реплики персонажей посвящены самой игре?"',
      '"Помогите мне! Хочу в Inet!"',
      '"А что? А ничего."',
      '"Если оно цвета бордо - значит, оно тебе снится."',
      '"Всех с ДНЕМ МАТ-МЕХА!"',
      '"Придумай свою фразу для персонажа!"',
      '"120К исходников - вот что такое mmHeroes!"',
      '"120К весьма кривых исходников - вот что такое mmHeroes!"'
    ][Random(0x16)]);

  } else {

    let bp_var_6 = random_from_to(0, 5);
    let bp_var_8 = hero.subject[current_subject].knowledge - subjects[current_subject].member0xFA + Random(hero.brain);

    if (!jg(hero.health, 5)) {
      bp_var_8 -= Random(5 - hero.health);
    }

    if (!(bp_var_8 <= 0)) {
      bp_var_8 = Round(Sqrt(bp_var_8) / subjects[current_subject].member0x100);
    } else {
      bp_var_8 = 0;
    }

    if (!(hero.subject[current_subject].tasks_done + bp_var_8 <= subjects[current_subject].tasks)) {
      bp_var_8 = subjects[current_subject].tasks - hero.subject[current_subject].tasks_done;
    }

    Write('"Я подозреваю, что ');
    Write(subjects[bp_var_6].professor.name);

    if (jz(bp_var_8, 0)) {
      Writeln(' ничего тебе не засчитает."');
    } else {
      Write(' зачтет тебе за 1 заход ');
      Write(bp_var_8);
      zadanie_in_case(bp_var_8);
      Writeln('."');
    }
  }

  TextColor(7);
} // end function 1C6DC


async function sub_1CC94() {
  let var_6;
  let var_4;

  ClrScr();
  show_header_stats();
  GotoXY(1, 8);

  if (current_subject === -1) {
    sub_1C6DC();
  } else {
    Write('Обратиться к Эндрю за помощью?');
    dialog_start();
    dialog_case('Да, чем я хуже других?', -1);
    dialog_case('Нет, я уж как-нибудь сам...', -2);
    let ax = await dialog_run(1, 0x0A);

    if (ax === -1) {

      var_4 = Random(0x0E);
      if (var_4 < hero.charizma) {

        GotoXY(1, 0x0D);
        Writeln('Эндрю вглядывается в твои задачки,');
        Writeln('и начинает думать очень громко...');
        Writeln('Пока Эндрю так напрягается, ты не можешь ни на чем сосредоточиться!');

        var_6 = Trunc(Sqrt(Random(subjects[current_subject].tasks - hero.subject[current_subject].tasks_done)));

        if (!(var_6 <= 2)) {
          var_6 = 0;
        }

        hero.stamina -= Random(2);

        if (jz(var_6, 0)) {
          Writeln('У Эндрю ничего не вышло...');
        } else {
          TextColor(7);
          Write('Эндрю решил тебе ');
          TextColor(0x0F);
          Write(var_6);
          TextColor(7);
          zadanie_in_case(var_6);
          Writeln('!');

          hero.subject[current_subject].tasks_done += var_6;
          if (!(hero.subject[current_subject].tasks_done < subjects[current_subject].tasks)) {
            Writeln('Надо будет подойти с зачеткой!');
          }
        }

        await hour_pass();

      } else {
        GotoXY(1, 0x0D);
        TextColor(0x0C);
        Writeln('Эндрю тебя игнорирует!');
        decrease_health(Random(5) + 2, 'Эндрю тоже умеет отбиваться от разных нехороших людей.');
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


async function sub_1D30D() {
  ClrScr();
  show_header_stats();
  GotoXY(1, 8);

  if (jz(hero.is_working_in_terkom, 0) && hero.charizma > Random(0x14)) {
    TextColor(0x0E);
    Write('"А ты не хочешь устроиться в ТЕРКОМ? Может, кое-чего подзаработаешь..."');

    dialog_start();
    dialog_case('Да, мне бы не помешало.', -1);
    dialog_case('Нет, я лучше поучусь уще чуток.', -2);
    let ax = await dialog_run(1, 0x0A);

    if (ax === -1) {
      hero.is_working_in_terkom = 1;
      GotoXY(1, 0x0E);
      Writeln('"Поздравляю, теперь ты можешь идти в "контору"!"');
    } else if (ax === -2) {
      GotoXY(1, 0x0E);
      Writeln('"Как хочешь. Только смотри, не заучись там ..."');
    }

  } else {

    if (hero.charizma > Random(0x14) && jz(hero.has_inet, 0)) {
      Writeln('"Кстати, я тут знаю один качественно работающий прокси-сервер..."');
      TextColor(7);
      Writeln();
      Writeln('Ты записываешь адрес. Вдруг пригодится?');
      hero.has_inet = 1;
    } else {

      GotoXY(1, 8);
      TextColor(7);
      Write('Гриша:');
      TextColor(0x0E);

      const ax = Random(0x0F);
      if (ax === 0) {
        Writeln('"Хочу халявы!"');
      } else if (ax === 1) {
        Writeln('"Прийди же, о халява!"');
      } else if (ax === 2) {
        Writeln('"Халява есть - ее не может не быть."');
      } else if (ax === 3) {
        Writeln('"Давай организуем клуб любетелей халявы!"');
      } else if (ax === 4) {
        Writeln('"Чтобы получить диплом, учиться совершенно необязательно!"');
      } else if (ax === 5) {
        Writeln('"Ну вот, ты готовился... Помогло это тебе?"');
      } else if (ax === 6) {
        Writeln('"На третьем курсе на лекции уже никто не ходит. Почти никто."');
      } else if (ax === 7) {
        Writeln('"Вот, бери пример с Коли."');
      } else if (ax === 8) {
        Writeln('"Ненавижу Льва Толстого! Вчера "Войну и мир" <йк> ксерил..."');
      } else if (ax === 9) {
        Writeln('"А в ПОМИ лучше вообще не ездить!"');
      } else if (ax === 0xA) {
        Writeln('"Имена главных халявчиков и алкоголиков висят на баобабе."');
      } else if (ax === 0xB) {
        Writeln('"Правильно, лучше посидим здесь и оттянемся!"');
      } else if (ax === 0xC) {
        Writeln('"Конспектировать ничего не надо. В мире есть ксероксы!"');
      } else if (ax === 0xD) {
        Writeln('"А с четвертого курса вылететь уже почти невозможно."');
      } else if (ax === 0xE) {
        Writeln('"Вот у механиков - у них халява!"');
      }

      TextColor(7);
      if (!jbe(Random(3), 0)) {
        Writeln('И еще по пиву...');
        hero.brain -= Random(2);
        if (!jg(hero.brain, 0)) {
          hero.health = 0;
          is_end = 1;
          death_cause = 'Губит людей не пиво, а избыток пива.';
        }
        hero.charizma += Random(2);
      }

      if (jz(Random(3), 0)) {
        Writeln('И еще один час прошел в бесплодных разговорах...');
        await hour_pass();
      }
    }
  }

  await wait_for_key();
  ClrScr();
} // end function 1D30D


async function talk_with_classmate(arg_0) {
  if (arg_0 === 0) {
    await talkToKolya();
  } else if (arg_0 === 2) {
    await talkToDiamond();
  } else if (arg_0 === 3) {
    await talkToRAI();
  } else if (arg_0 === 1) {
    await sub_1B526();
  } else if (arg_0 === 4) {
    await talkToMisha();
  } else if (arg_0 === 5) {
    await sub_Serzg();
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


async function sub_1DA3D() {
  ClrScr();
  TextColor(0x0D);

  let ax;
  ax = Random(3);
  if (ax === 0) {
    Writeln('Розовые слоники с блестящими крылышками');
  } else if (ax === 1) {
    Writeln('Зеленые человечки с длинными антеннами');
  } else if (ax === 2) {
    Writeln('Овечки с ослепительно-белой шерстью');
  }

  Writeln('сидят с окосевшими глазами в Мавзолее');

  ax = Random(0x0A);
  if (ax === 0) {
    Writeln('и считают определитель матрицы 10 на 10');
  } else if (ax === 1) {
    Writeln('и ищут Жорданову форму матрицы');
  } else if (ax === 2) {
    Writeln('и возводят матрицы в 239-ю степень');
  } else if (ax === 3) {
    Writeln('и решают линейную систему уравнений с параметрами');
  } else if (ax === 4) {
    Writeln('и доказывают неприводимость многочлена 10-й степени над Z');
  } else if (ax === 5) {
    Writeln('и доказывают сходимость неопределенного интеграла с параметрами');
  } else if (ax === 6) {
    Writeln('и считают сумму ряда с параметрами');
  } else if (ax === 7) {
    Writeln('и дифференцируют, дифференцируют, дифференцируют');
  } else if (ax === 8) {
    Writeln('и берут интергалы не отдают их');
  } else if (ax === 9) {
    Writeln('и решают задачи по математической болтологии');
  }

  Writeln('...');
  await ReadKey();
  Writeln();
  Writeln('Господи! Ну и присниться же такое!');
  Writeln('За то теперь ты точно знаешь,');
  Writeln('что снится студентам-математикам,');
  Writeln('когда они вне кондиции');
  Writeln('...');
  await ReadKey();
  hero.health = Random(0x0A) + 0xA;
} // end function 1DA3D


async function sub_1DF40() {
  ClrScr();
  TextColor(0x0D);

  if (last_subject === 0) {
    Writeln('Ты слышишь мягкий, ненавязчивый голос:');
    Writeln('"А Вы действительно правильно выбрали');
    Writeln(' себе специальность?"');
  } else if (last_subject === 1) {
    Writeln('"Интеграл..."');
    Writeln('"Какой интеграл?"');
    Writeln('"Да вот же он, мы его только что стерли!"');
  } else if (last_subject === 2) {
    Writeln('"Вы, конечно, великий парильщик.');
    Writeln(' Но эту задачу я Вам засчитаю."');
  } else if (last_subject === 3) {
    Writeln('"А что, у нас сегодня разве аудиторное занятие?"');
  } else if (last_subject === 4) {
    Writeln('"Well, last time I found a pencil left by one of you.');
    Writeln(' I will return it to the owner, if he or she');
    Writeln(' can tell me some nice and pleasant words.');
    Writeln(' I am a lady, not your computer!"');
  } else if (last_subject === 5) {
    Writeln('"В следующем семестре вы должны будете написать реферат');
    Writeln(' на тему "Бег в мировой литературе". В качестве первоисточника');
    Writeln(' можете взять одноименный роман Булгакова."');
  }

  Writeln();
  Writeln('Ну все, похоже, заучился - если преподы по ночам снятся...');
  await ReadKey();
} // end function 1DF40



async function sub_1E37C() {
  ClrScr();
  TextColor(0x0D);
  Writeln('"Здравствуйте!" ...');
  await ReadKey();
  Writeln('Оно большое ...');
  await ReadKey();
  Writeln('Оно пыхтит! ...');
  await ReadKey();
  Writeln('Оно медленно ползет прямо на тебя!!! ...');
  await ReadKey();
  Writeln('Оно говорит человеческим голосом:');
  TextColor(7);

  let ax = Random(3);
  if (ax === 0) {
    Writeln('"Молодой человек. Когда-нибудь Вы вырастете');
    Writeln('и будете работать на большой машине.');
    Writeln('Вам надо будет нажать кнопку жизни,');
    Writeln('а Вы нажмете кнопку смерти ..."');
  } else if (ax === 1) {
    Writeln('"Это в средневековье ученые спорили,');
    Writeln('сколько чертей может поместиться');
    Writeln('на кончике иглы..."');
  } else if (ax === 2) {
    Writeln('"Задачи можно решать по-разному.');
    Writeln('Можно устно, можно на бумажке,');
    Writeln('можно - играя в крестики-нолики...');
    Writeln('А можно - просто списать ответ в конце задачника!"');
  }

  TextColor(0x0D);
  Writeln('...');
  await ReadKey();
  Writeln();
  Writeln('Уффф... Что-то сегодня опять какие-то гадости снятся.');
  Writeln('Все, пора завязывать с этим. Нельзя так много учиться.');
  await ReadKey();
  hero.health = Random(0x0A) + 0xA;
} // end function 1E37C


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
    death_cause = 'Превратился в овощ.';
  }

  if (!jz(hero.knows_djug, 0)) {
    var_4 = 2;
  }

  if (jz(Random(2), 0)) {
    if (var_4 === 1) {
      await sub_1DA3D();
    } else if (var_4 === 2) {
      await sub_1E37C();
    } else {
      if (jz(Random(3), 0)) {
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



async function goto_sleep() {
  let var_4;
  let var_2;

  current_subject = -1;
  current_place = 4;

  if (!(day_of_week <= 5)) {
    is_end = 1;
    death_cause = 'Время вышло.';
    return;
  }

  if (!(hero.health <= 0x28)) {
    hero.health = 0x28;
  }

  var_2 = hero.health + 0xF + Random(0x14);

  if (!(var_2 <= 0x32)) {
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


async function sub_1E7F8() {
  ClrScr();
  TextColor(7);
  Writeln('Ты глядишь на часы и видишь: уже полночь!');
  Writeln('На последней электричке ты едешь домой, в общагу.');
  hero.health -= 4;

  if (!jge(hero.health, 1)) {
    is_end = 1;
    death_cause = 'Заснул в электричке и не проснулся.';
  }

  current_place = 4;
  current_subject = -1;
  await wait_for_key();
  ClrScr();
} // end function 1E7F8


async function sub_1E907() {
  ClrScr();
  TextColor(7);
  Writeln('Вахтерша глядит на тебя странными глазами:');
  Writeln('что может делать бедный студент в университете в полночь?');
  Writeln('Не зная ответ на этот вопрос, ты спешишь в общагу.');
  current_place = 4;
  current_subject = -1;
  await wait_for_key();
  ClrScr();
} // end function 1E907


async function sub_1E993() {
  ClrScr();
  TextColor(7);
  Writeln('Мавзолей закрывается.');
  Writeln('Пора домой!');
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


async function hour_pass() {
  terkom_has_places = 1;
  sub_1F184();
  ++time_of_day;

  if (current_subject === 2 && current_place === 2) {
    decrease_health(6, 'DJuG - это смертельно!');
    hero.knows_djug = 1;
  }

  if (hero.charizma <= 0) {
    hero.health = 0;
    is_end = 1;
    death_cause = 'Бурно прогрессирующая паранойя.';
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


async function prompt_exit() {
  ClrScr();
  Writeln('Ну, может не надо так резко...');
  Writeln('Ты что, серьезно хочешь закончить игру?');
  dialog_start();
  dialog_case('Нет, не хочу!', -1);
  dialog_case('Я же сказал: с меня хватит!', -2);
  if (await dialog_run(1, 4) === -2) {
    is_end = 1;
    death_cause = 'Вышел сам.';
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

/**
 *
 * @param subj
 * @returns {boolean}
 */
function is_professor_here_today(subj) {
  if (day_of_week >= 0 && day_of_week <= 5) {
    return timesheet[day_of_week][subj].where === current_place;
  } else {
    return false;
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


function updatePasha(/*arg_0*/) {
  // #warning arg_0, [arg_0 + var_2 + 0|1]
  let bp_var_2 = [0, 0];

  if (time_between_9_and_19()) {
    classmates[Pasha].place = 1;
  } else {
    classmates[Pasha].place = 0;
  }

  classmates[Pasha].current_subject = -1;

  do {
    for (let i = 0; i <= 2; ++i) {
      if (is_professor_here_today(i)) {
        bp_var_2[0] = 1;
        if (!jbe(Random(0x0A), 5)) {
          bp_var_2[1] = 1;
          classmates[Pasha].place = timesheet[day_of_week][i].where;
          classmates[Pasha].current_subject = i;
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

  for (let i = 5; i >= 0; --i) {
    if (is_professor_here_today(i)) {
      if (bp_var_2[1] === 0) {
        if (!jbe(Random(0x0A), 5)) {
          classmates[Diamond].place = timesheet[day_of_week][i].where;
          classmates[Diamond].current_subject = i;
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
    for (let i = 4; i >= 0; --i) {

      if (is_professor_here_today(i)) {
        if (!(i === 3)) {
          bp_var_2[0] = 1;

          if (!jbe(Random(0x0A), 5)) {
            bp_var_2[1] = 1;
            classmates[Misha].place = timesheet[day_of_week][i].where;
            classmates[Misha].current_subject = i;
          }
        }
      }
    }
  } while (jz(bp_var_2[1], 0) && (bp_var_2[0] !== 0));

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
    for (let i = 5; i >= 0; --i) {
      if (is_professor_here_today(i)) {
        bp_var_2[0] = 1;
        if (!jbe(Random(0x0A), 5)) {
          bp_var_2[1] = 1;
          classmates[Serzg].place = timesheet[day_of_week][i].where;
          classmates[Serzg].current_subject = i;
        }
      }
    }
  } while (jz(bp_var_2[1], 0) && (bp_var_2[0] !== 0));

} // end function 1EECC


function sub_1EF66(/*arg_0*/) {
  classmates[Sasha].current_subject = -1;
  if (time_between_9_and_19()) {
    if (jz(Random(4), 0)) {
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
      if (is_professor_here_today(var_2)) {
        bp_var_2[0] = 1;
        if (!jbe(Random(0x0A), 5)) {
          bp_var_2[1] = 1;
          classmates[Nil].place = timesheet[day_of_week][var_2].where;
          classmates[Nil].current_subject = var_2;
        }
      }
    }
  } while (jz(bp_var_2[1], 0) && (bp_var_2[0] !== 0));

} // end function 1EF9E


function sub_1F025(/*arg_0*/) {
  if (time_between_9_and_19() && jz(Random(4), 0)) {
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

  for (let i = 0; i <= 2; ++i) {
    if (is_professor_here_today(i)) {
      if (!jbe(Random(0x0A), 5)) {
        classmates[Endryu].place = timesheet[day_of_week][i].where;
        classmates[Endryu].current_subject = i;
      }
    }
  }
} // end function 1F06D


function sub_1F0C6() {
  classmates[Grisha].current_subject = -1;
  if (jz(Random(3), 0)) {
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
    updatePasha();
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

function zadanie_in_case(number) {
  if (number === 1) {
    Write(' задание');
  } else if (number >= 2 && number <= 4) {
    Write(' задания');
  } else {
    Write(' заданий');
  }
} // end function 1F1CB


function colored_output(color, str) {
  _set_current_color(color);
  Write(str);
  _set_current_color(7);
} // end function 1F22A


function colored_output_ln(color, str) {
  _set_current_color(color);
  Writeln(str);
  _set_current_color(7);
} // end function 1F26B


function output_with_highlighted_num(color, before, color_hi, number, after) {
  _set_current_color(color);
  Write(before);
  _set_current_color(color_hi);
  Write(number);
  _set_current_color(color);
  Write(after);
  _set_current_color(7);
} // end function 1F2AC


function colored_output_white(number) {
  _set_current_color(0x0F);
  Write(number);
  _set_current_color(7);
} // end function 1F335


const health_str = [
  'живой труп',
  'пора помирать ...',
  'плохое',
  'так себе',
  'среднее',
  'хорошее',
  'отличное',
];
const health_line = [1, 9, 0x11, 0x19, 0x21, 0x29];
const health_col = [5, 4, 4, 0xE, 0xE, 0xA, 0xA];

const brain_str = [
  'Клиническая смерть мозга',
  'Голова просто никакая',
  'Думать практически невозможно',
  'Думать трудно',
  'Голова почти в норме',
  'Голова в норме',
  'Голова свежая',
  'Легкость в мыслях необыкновенная',
  'Обратитесь к разработчику ;)',
];
const brain_line = [0, 1, 2, 3, 4, 5, 6, 0x65];
const brain_col = [5, 5, 0xC, 0xC, 0xE, 0xE, 0xA, 0xA, 0xB];

const stamina_str = [
  'Мама, роди меня обратно!',
  'Окончательно заучился',
  'Я так больше немогууу!',
  'Скорее бы все это кончилось...',
  'Еще немного и пора отдыхать',
  'Немного устал',
  'Готов к труду и обороне',
  'Нас ждут великие дела',
];
const stamina_line = [0, 1, 2, 3, 4, 5, 6];
const stamina_col = [5, 5, 0xC, 0xC, 0xE, 0xE, 0xA, 0xA];

const charizma_str = [
  'Очень замкнутый товарищ',
  'Предпочитаешь одиночество',
  'Тебе трудно общаться с людьми',
  'Тебе непросто общаться с людьми',
  'Ты нормально относишься к окружающим',
  'У тебя много друзей',
  'У тебя очень много друзей',
];
const charizma_line = [1, 2, 3, 4, 5, 6];
const charizma_col = [5, 5, 0xC, 0xC, 0xE, 0xA, 0xA];


function show_header_stats() {
  ClrScr();
  GotoXY(1, 1);
  output_with_highlighted_num(7, 'Сегодня ', 0xF, day_of_week + 0x16, 'е мая; ');
  output_with_highlighted_num(0xF, '', 0xF, time_of_day, ':00');
  GotoXY(0x1A, 1);

  colored_output(0xD, 'Версия ' + aGamma3_14);
  GotoXY(1, 2);
  Write('Самочувствие: ');


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
  let knowledge_subj_str = ['Плохо', 'Удовл.', 'Хорошо', 'Отлично'];
  let knowledge_subj_col = [3, 7, 0xF, 0xE];

  for (let subj = 0; subj <= 5; ++subj) {
    GotoXY(0x2D, subj + 1);
    colored_output(0xB, subjects[subj].title);

    GotoXY(0x43, subj + 1);
    let ax = hero.subject[subj].knowledge;
    _set_current_color(knowledge_col[_upper_bound(knowledge_line, ax)]);
    Write(hero.subject[subj].knowledge);

    GotoXY(0x47, subj + 1);
    let k_i = _upper_bound(knowledge_subj_line[subj], ax);
    colored_output(knowledge_subj_col[k_i], knowledge_subj_str[k_i]);

    _set_current_color(7);
  }


  GotoXY(1, 3);
  colored_output(7, 'Финансы: ');


  if (!(hero.money <= 0)) {
    TextColor(0x0F);
    Write(hero.money);
    TextColor(7);
    Write(' руб.');
  } else if (hero.got_stipend === 0) {
    colored_output(0x0C, 'Надо получить деньги за май...');
  } else {
    Write('Ты успел потратить все деньги.');
  }


  GotoXY(1, 4);
  let brain_i = _upper_bound(brain_line, hero.brain);
  colored_output(brain_col[brain_i], brain_str[brain_i]);


  GotoXY(1, 5);
  const stamina_i = _upper_bound(stamina_line, hero.stamina);
  colored_output(stamina_col[stamina_i], stamina_str[stamina_i]);

  GotoXY(1, 6);
  const charizma_i = _upper_bound(charizma_line, hero.charizma);
  colored_output(charizma_col[charizma_i], charizma_str[charizma_i]);
} // end function 1F685


function show_timesheet_day(day_color, day, subj) {
  TextColor(hero.subject[subj].passed ? 1 : day_color);

  let ts = timesheet[day][subj];
  if (ts.where !== 0) {
    GotoXY(day * 7 + 0x18, subj * 3 + 2);
    Write(places[ts.where].title);
    GotoXY(day * 7 + 0x18, subj * 3 + 3);
    Write(ts.from);
    Write('-');
    Write(ts.to);
  } else {
    TextColor(day_color > 8 ? 6 : 8);
    GotoXY(day * 7 + 0x18, subj * 3 + 2);
    Write('██████');
    GotoXY(day * 7 + 0x18, subj * 3 + 3);
    Write('██████');
  }

  // #warning only use
  //TextBackground(0);
} // end function 1FD54


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
        Write('Осталось');
        GotoXY(0x46, subj * 3 + 3)
        colored_output_white(subjects[subj].tasks - hero.subject[subj].tasks_done);
        zadanie_in_case(subjects[subj].tasks - hero.subject[subj].tasks_done);
      } else {
        TextColor(7);
        GotoXY(0x46, subj * 3 + 2);
        Writeln('Подойти с');
        GotoXY(0x46, subj * 3 + 3);
        Writeln('зачеткой');
      }
    } else {
      TextColor(0xF);
      GotoXY(0x46, subj * 3 + 2);
      Write('ЗАЧЕТ');
      GotoXY(0x46, subj * 3 + 3);
      Write(hero.subject[subj].pass_day + 22);
      Write('.05');
    }
  }

  TextColor(7);
  GotoXY(1, 0x17);

  if (hero.exams_left === 0) {
    colored_output(0xF, 'Все уже сдано!');
  } else if (hero.exams_left === 1) {
    output_with_highlighted_num(7, 'Остался ', 0xD, 1, ' зачет!');
  } else if (hero.exams_left < 5) {
    output_with_highlighted_num(7, 'Осталось ', 0xE, hero.exams_left, ' зачета.');
  } else {
    output_with_highlighted_num(7, 'Осталось ', 0xE, hero.exams_left, ' зачетов.');
  }

  GotoXY(1, 7);
} // end function 1FF27


function show_short_today_timesheet(y) {
  for (let subj = 0; subj <= 5; ++subj) {
    let ts = timesheet[day_of_week][subj];

    TextColor(hero.subject[subj].passed ? 1 : 0xB);
    GotoXY(0x32, y + subj);
    Write(subject_short_titles[subj]);

    TextColor(hero.subject[subj].passed ? 5 : 0xC);
    GotoXY(0x3A, y + subj);
    Write(places[ts.where].title);

    if (ts.where !== 0) {
      TextColor(hero.subject[subj].passed ? 8 : 0xF);
      GotoXY(0x40, y + subj);
      Write(ts.from);
      Write('-');
      Write(ts.to);
    }

    GotoXY(0x48, y + subj);
    if (hero.subject[subj].tasks_done === 0) {
      TextColor(7);
    } else if (hero.subject[subj].tasks_done < subjects[subj].tasks) {
      TextColor(0xA);
    } else {
      TextColor(0xE);
    }
    Write(hero.subject[subj].tasks_done);
    Write('/');
    Write(subjects[subj].tasks);
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


async function init_hero_interactive() {
  ClrScr();

  dialog_start();
  Writeln('Выбери начальные параметры своего "героя":');
  dialog_case('Случайный студент', -1);
  dialog_case('Шибко умный', -2);
  dialog_case('Шибко наглый', -3);
  dialog_case('Шибко общительный', -4);
  if (is_god_mode_available) {
    dialog_case('GOD-режим', -100);
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


async function check_exams_left_count() {
  let exams_left = 6;
  for (let i = 0; i <= 5; ++i) {
    if (hero.subject[i].passed) {
      --exams_left;
    }
  }
  if (exams_left !== hero.exams_left) {
    await bug_report('bad_cred_count');
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
  _set_current_color(0x0E);
  Write('Нажми любую клавишу ...');
  _set_current_color(7);
  //if (ReadKey() === 0) {
  await ReadKey();
  //}
} // end function 208B8


async function bug_report(bug_str) {
  ClrScr();
  _set_current_color(0x8F);
  Write('В программе буга! Код : ');
  Writeln(bug_str);
  Writeln('Срочно обратитесь к разработчику ;)');
  is_end = 1;
  hero.health = -100;
  death_cause = 'Раздавлен безжалостной ошибкой в программе.';
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
  TextBackground(0);
  TextColor(0x0B);
  for (let i = 0; i <= dialog_case_count - 1; ++i) {
    GotoXY(x, y + i);
    TextColor(dialog[i].color);
    Write(dialog[i].str);
  }
  TextColor(0x07);
} // end function 20B20



////////////////

Main().catch(err => {
  console.error(err);
});

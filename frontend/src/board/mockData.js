/**
 * Realistic dummy school dataset for local testing and UI demonstration.
 * Bypasses all external EduPage API dependencies.
 */

export const MOCK_LOOKUP = {
  periods: {
    name: 'Zvonění',
    item_name: 'Hodina',
    icon: '',
    data: {
      '0': { name: '0. hodina', short: '0', period: '0', start: '07:10', end: '07:55' },
      '1': { name: '1. hodina', short: '1', period: '1', start: '08:00', end: '08:45' },
      '2': { name: '2. hodina', short: '2', period: '2', start: '08:55', end: '09:40' },
      '3': { name: '3. hodina', short: '3', period: '3', start: '10:00', end: '10:45' },
      '4': { name: '4. hodina', short: '4', period: '4', start: '10:55', end: '11:40' },
      '5': { name: '5. hodina', short: '5', period: '5', start: '11:50', end: '12:35' },
      '6': { name: '6. hodina', short: '6', period: '6', start: '12:45', end: '13:30' },
      '7': { name: '7. hodina', short: '7', period: '7', start: '13:40', end: '14:25' },
    },
  },
  classes: {
    name: 'Třídy',
    item_name: 'Třída',
    icon: '',
    data: {
      c1: '1.A',
      c2: '1.B',
      c3: '2.A',
      c4: '2.B',
      c5: '3.A',
      c6: '3.B',
      c7: '4.A',
      c8: '4.B',
    },
  },
  subjects: {
    name: 'Předměty',
    item_name: 'Předmět',
    icon: '',
    data: {
      s_mat: 'Matematika',
      s_cj: 'Český jazyk',
      s_aj: 'Anglický jazyk',
      s_nj: 'Německý jazyk',
      s_fy: 'Fyzika',
      s_inf: 'Informatika',
      s_dej: 'Dějepis',
      s_ch: 'Chemie',
      s_bio: 'Biologie',
      s_tv: 'Tělesná výchova',
      s_zem: 'Zeměpis',
    },
  },
  teachers: {
    name: 'Učitelé',
    item_name: 'Učitel',
    icon: '',
    data: {
      t_nov: 'Mgr. Novák M.',
      t_svo: 'Ing. Svoboda J.',
      t_dvo: 'Mgr. Dvořáková E.',
      t_cer: 'RNDr. Černý P.',
      t_ves: 'Mgr. Veselá K.',
      t_hor: 'PaedDr. Horák T.',
      t_kra: 'Mgr. Králová L.',
      t_pro: 'Ing. Procházka M.',
    },
  },
  classrooms: {
    name: 'Učebny',
    item_name: 'Učebna',
    icon: '',
    data: {
      r_101: 'U101',
      r_102: 'U102',
      r_lab: 'LAB Fyz',
      r_inf1: 'INF 1',
      r_inf2: 'INF 2',
      r_tel: 'Tělocvična',
      r_aul: 'Aula',
      r_204: 'U204',
      r_bio: 'LAB Bio',
    },
  },
  infoscreens: {
    name: 'Informační tabule',
    item_name: 'Tabule',
    icon: '',
    data: [
      {
        id: '1',
        enabled: true,
        name: 'Kiosk',
        header: 'EduBoard Informační Tabule',
        type: 'timetable',
      },
    ],
  },
}

export const MOCK_TIMETABLE = {
  classes: [
    {
      id: 'c1', // 1.A
      ttitems: [
        { type: 'card', uniperiod: 1, starttime: '08:00', endtime: '08:45', subjectid: 's_mat', teacherids: ['t_nov'], classroomids: ['r_101'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 2, starttime: '08:55', endtime: '09:40', subjectid: 's_cj', teacherids: ['t_dvo'], classroomids: ['r_101'], groupnames: [], changed: false, removed: false },
        // Split language groups
        { type: 'card', uniperiod: 3, starttime: '10:00', endtime: '10:45', subjectid: 's_aj', teacherids: ['t_ves'], classroomids: ['r_101'], groupnames: ['skup. 1'], changed: false, removed: false },
        { type: 'card', uniperiod: 3, starttime: '10:00', endtime: '10:45', subjectid: 's_nj', teacherids: ['t_kra'], classroomids: ['r_102'], groupnames: ['skup. 2'], changed: false, removed: false },
        { type: 'card', uniperiod: 4, starttime: '10:55', endtime: '11:40', subjectid: 's_fy', teacherids: ['t_svo'], classroomids: ['r_lab'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 5, starttime: '11:50', endtime: '12:35', subjectid: 's_inf', teacherids: ['t_pro'], classroomids: ['r_inf1'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 6, starttime: '12:45', endtime: '13:30', subjectid: 's_tv', teacherids: ['t_hor'], classroomids: ['r_tel'], groupnames: [], changed: false, removed: false },
      ],
    },
    {
      id: 'c2', // 1.B
      ttitems: [
        { type: 'card', uniperiod: 1, starttime: '08:00', endtime: '08:45', subjectid: 's_cj', teacherids: ['t_dvo'], classroomids: ['r_102'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 2, starttime: '08:55', endtime: '09:40', subjectid: 's_mat', teacherids: ['t_nov'], classroomids: ['r_102'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 3, starttime: '10:00', endtime: '10:45', subjectid: 's_bio', teacherids: ['t_cer'], classroomids: ['r_bio'], groupnames: [], changed: false, removed: false },
        // Substitution change!
        { type: 'card', uniperiod: 4, starttime: '10:55', endtime: '11:40', subjectid: 's_fy', teacherids: ['t_ves'], classroomids: ['r_102'], groupnames: [], changed: true, removed: false },
        { type: 'card', uniperiod: 5, starttime: '11:50', endtime: '12:35', subjectid: 's_dej', teacherids: ['t_kra'], classroomids: ['r_102'], groupnames: [], changed: false, removed: false },
      ],
    },
    {
      id: 'c3', // 2.A
      ttitems: [
        { type: 'card', uniperiod: 1, starttime: '08:00', endtime: '08:45', subjectid: 's_dej', teacherids: ['t_kra'], classroomids: ['r_204'], groupnames: [], changed: false, removed: false },
        // Substitution change!
        { type: 'card', uniperiod: 2, starttime: '08:55', endtime: '09:40', subjectid: 's_mat', teacherids: ['t_svo'], classroomids: ['r_204'], groupnames: [], changed: true, removed: false },
        { type: 'card', uniperiod: 3, starttime: '10:00', endtime: '10:45', subjectid: 's_ch', teacherids: ['t_cer'], classroomids: ['r_bio'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 4, starttime: '10:55', endtime: '11:40', subjectid: 's_cj', teacherids: ['t_dvo'], classroomids: ['r_204'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 5, starttime: '11:50', endtime: '12:35', subjectid: 's_zem', teacherids: ['t_pro'], classroomids: ['r_204'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 6, starttime: '12:45', endtime: '13:30', subjectid: 's_aj', teacherids: ['t_ves'], classroomids: ['r_204'], groupnames: [], changed: false, removed: false },
      ],
    },
    {
      id: 'c4', // 2.B
      ttitems: [
        { type: 'card', uniperiod: 1, starttime: '08:00', endtime: '08:45', subjectid: 's_inf', teacherids: ['t_pro'], classroomids: ['r_inf1'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 2, starttime: '08:55', endtime: '09:40', subjectid: 's_fy', teacherids: ['t_svo'], classroomids: ['r_lab'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 3, starttime: '10:00', endtime: '10:45', subjectid: 's_mat', teacherids: ['t_nov'], classroomids: ['r_101'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 4, starttime: '10:55', endtime: '11:40', subjectid: 's_tv', teacherids: ['t_hor'], classroomids: ['r_tel'], groupnames: [], changed: false, removed: false },
        // Cancelled lesson (odpadá)!
        { type: 'card', uniperiod: 5, starttime: '11:50', endtime: '12:35', subjectid: 's_dej', teacherids: ['t_kra'], classroomids: ['r_102'], groupnames: [], changed: false, removed: true },
      ],
    },
    {
      id: 'c5', // 3.A
      ttitems: [
        { type: 'card', uniperiod: 1, starttime: '08:00', endtime: '08:45', subjectid: 's_cj', teacherids: ['t_dvo'], classroomids: ['r_204'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 2, starttime: '08:55', endtime: '09:40', subjectid: 's_aj', teacherids: ['t_ves'], classroomids: ['r_204'], groupnames: [], changed: false, removed: false },
        // Substitution change!
        { type: 'card', uniperiod: 3, starttime: '10:00', endtime: '10:45', subjectid: 's_ch', teacherids: ['t_nov'], classroomids: ['r_lab'], groupnames: [], changed: true, removed: false },
        { type: 'card', uniperiod: 4, starttime: '10:55', endtime: '11:40', subjectid: 's_mat', teacherids: ['t_svo'], classroomids: ['r_204'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 5, starttime: '11:50', endtime: '12:35', subjectid: 's_bio', teacherids: ['t_cer'], classroomids: ['r_bio'], groupnames: [], changed: false, removed: false },
      ],
    },
    {
      id: 'c6', // 3.B
      ttitems: [
        { type: 'card', uniperiod: 1, starttime: '08:00', endtime: '08:45', subjectid: 's_mat', teacherids: ['t_svo'], classroomids: ['r_102'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 2, starttime: '08:55', endtime: '09:40', subjectid: 's_cj', teacherids: ['t_dvo'], classroomids: ['r_102'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 3, starttime: '10:00', endtime: '10:45', subjectid: 's_inf', teacherids: ['t_pro'], classroomids: ['r_inf2'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 4, starttime: '10:55', endtime: '11:40', subjectid: 's_dej', teacherids: ['t_kra'], classroomids: ['r_102'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 5, starttime: '11:50', endtime: '12:35', subjectid: 's_zem', teacherids: ['t_nov'], classroomids: ['r_102'], groupnames: [], changed: false, removed: false },
      ],
    },
    {
      id: 'c7', // 4.A
      ttitems: [
        { type: 'card', uniperiod: 1, starttime: '08:00', endtime: '08:45', subjectid: 's_mat', teacherids: ['t_nov'], classroomids: ['r_aul'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 2, starttime: '08:55', endtime: '09:40', subjectid: 's_fy', teacherids: ['t_svo'], classroomids: ['r_aul'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 3, starttime: '10:00', endtime: '10:45', subjectid: 's_cj', teacherids: ['t_dvo'], classroomids: ['r_aul'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 4, starttime: '10:55', endtime: '11:40', subjectid: 's_aj', teacherids: ['t_ves'], classroomids: ['r_aul'], groupnames: [], changed: false, removed: false },
        // Cancelled lesson (odpadá)!
        { type: 'card', uniperiod: 6, starttime: '12:45', endtime: '13:30', subjectid: 's_tv', teacherids: ['t_hor'], classroomids: ['r_tel'], groupnames: [], changed: false, removed: true },
      ],
    },
    {
      id: 'c8', // 4.B
      ttitems: [
        { type: 'card', uniperiod: 1, starttime: '08:00', endtime: '08:45', subjectid: 's_bio', teacherids: ['t_cer'], classroomids: ['r_bio'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 2, starttime: '08:55', endtime: '09:40', subjectid: 's_ch', teacherids: ['t_cer'], classroomids: ['r_bio'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 3, starttime: '10:00', endtime: '10:45', subjectid: 's_mat', teacherids: ['t_nov'], classroomids: ['r_102'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 4, starttime: '10:55', endtime: '11:40', subjectid: 's_cj', teacherids: ['t_dvo'], classroomids: ['r_102'], groupnames: [], changed: false, removed: false },
        { type: 'card', uniperiod: 5, starttime: '11:50', endtime: '12:35', subjectid: 's_inf', teacherids: ['t_pro'], classroomids: ['r_inf1'], groupnames: [], changed: false, removed: false },
      ],
    },
  ],
}

export const MOCK_EVENTS = {
  classes: [
    {
      id: 'global',
      ttitems: [
        {
          type: 'event',
          name: 'Přednáška: Kybernetická bezpečnost a digitální hygiena',
          starttime: '10:00',
          endtime: '11:40',
          classids: ['c5', 'c6', 'c7'],
          classroomids: ['r_aul'],
          teacherids: ['t_svo', 't_pro'],
          uniperiod: 3,
        },
        {
          type: 'event',
          name: 'Okresní kolo florbalového turnaje SŠ',
          starttime: '08:30',
          endtime: '14:00',
          classids: [], // Celá škola
          classroomids: ['r_tel'],
          teacherids: ['t_hor'],
          uniperiod: 'ad',
        },
        {
          type: 'event',
          name: 'Přírodovědná exkurze: Planetárium Praha',
          starttime: '08:00',
          endtime: '13:00',
          classids: ['c1', 'c2'],
          classroomids: [],
          teacherids: ['t_cer', 't_ves'],
          uniperiod: 'ad',
        },
        {
          type: 'event',
          name: 'Maturitní generálka – didaktický test ČJL',
          starttime: '08:00',
          endtime: '10:45',
          classids: ['c7', 'c8'],
          classroomids: ['r_101', 'r_102'],
          teacherids: ['t_dvo', 't_kra'],
          uniperiod: 1,
        },
      ],
    },
  ],
}

export function getMockBoardPayload() {
  return {
    lookup: MOCK_LOOKUP,
    timetable: MOCK_TIMETABLE,
    events: MOCK_EVENTS,
    issues: [],
  }
}

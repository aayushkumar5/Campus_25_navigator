export const $ = id => document.getElementById(id);
export const SVG_NS = 'http://www.w3.org/2000/svg';

// Color & Symbol Maps
export const COLORS = {
  a: '#2563eb',
  b: '#ea580c',
  t: '#0d9488',
  r: '#e11d48',
  c: '#475569',
  s: '#16a34a',
  l: '#0891b2',
  g: '#0284c7',
  f: '#db2777',
  e: '#d97706',
  x: '#0284c7',
  w: '#06b6d4'
};

export const ICONS = {
  s: 'S',
  l: 'L',
  g: 'M',
  f: 'W',
  e: 'E',
  x: 'F',
  w: 'W'
};

export const ROOM_TYPES = {
  a: 'BLOCK A CLASS',
  b: 'BLOCK B CLASS',
  t: 'THEORY ROOM',
  r: 'LAB / OFFICE',
  c: 'BLOCK C CLASS',
  s: 'STAIRS',
  l: 'ELEVATOR',
  g: 'GENTS WASHROOM',
  f: 'LADIES WASHROOM',
  e: 'ENTRANCE',
  x: 'FACILITY',
  w: 'WATER COOLER'
};

export const FLOOR_NAMES = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'];
export const FLOOR_CODES = ['GF', '1F', '2F', '3F'];

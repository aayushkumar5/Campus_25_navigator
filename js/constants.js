export const $ = id => document.getElementById(id);
export const SVG_NS = 'http://www.w3.org/2000/svg';

// Color & Symbol Maps
export const COLORS = {
  a: '#3b82f6',
  b: '#f97316',
  t: '#8b5cf6',
  r: '#8b5cf6',
  c: '#64748b',
  s: '#f59e0b',
  l: '#38bdf8',
  g: '#14b8a6',
  f: '#ec4899',
  e: '#22c55e',
  x: '#a78bfa',
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
export const FLOOR_CODES = ['G', '1F', '2F', '3F'];

// Map scale: ~44px between adjacent classrooms ≈ 10 m
export const M_PER_PX = 0.22;
export const STEP_LEN_M = 0.75; // average adult stride length
export const WALK_M_PER_MIN = 70;

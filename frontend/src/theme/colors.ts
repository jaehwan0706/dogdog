export const colors = {
  forest: '#184D3B',
  forestMuted: '#2E604B',
  forestDeep: '#182720',
  forestSoft: '#E4ECE7',
  ivory: '#F5F7F5',
  ivorySoft: '#EAF0EC',
  white: '#FFFFFF',
  orange: '#E9903A',
  orangeSoft: '#FBE7D2',
  coral: '#D96D4B',
  sky: '#DCEBED',
  ink: '#202824',
  inkSoft: '#66706A',
  inkFaint: '#8D9791',
  line: '#DDE4DF',
  shadow: '#183B2E',
  success: '#3C7A5D',
  danger: '#B94A48',
} as const;

export type ColorName = keyof typeof colors;

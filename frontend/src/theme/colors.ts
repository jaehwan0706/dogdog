export const colors = {
  forest: '#184D3B',
  forestMuted: '#2E604B',
  forestDeep: '#182720',
  forestSoft: '#E3EBE2',
  ivory: '#FBF8F0',
  ivorySoft: '#F2EBDD',
  white: '#FFFFFF',
  orange: '#DD9A2E',
  orangeSoft: '#F8E4B5',
  coral: '#D96D4B',
  sky: '#DCEBED',
  ink: '#2A2A20',
  inkSoft: '#6B6A5C',
  inkFaint: '#9A9888',
  line: '#E8E2D4',
  shadow: '#183B2E',
  success: '#3C7A5D',
  danger: '#B94A48',
} as const;

export type ColorName = keyof typeof colors;

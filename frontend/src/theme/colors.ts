export const colors = {
  forest: '#184D3B',
  forestDeep: '#182720',
  forestSoft: '#E3EBE2',
  ivory: '#F6F1E2',
  ivorySoft: '#EFE8D4',
  white: '#FFFFFF',
  orange: '#DD9A2E',
  orangeSoft: '#F8E4B5',
  coral: '#D96D4B',
  sky: '#DCEBED',
  ink: '#2A2A20',
  inkSoft: '#6B6A5C',
  inkFaint: '#9A9888',
  line: '#DDD6BF',
  success: '#3C7A5D',
  danger: '#B94A48',
} as const;

export type ColorName = keyof typeof colors;

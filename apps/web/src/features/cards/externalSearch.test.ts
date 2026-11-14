import { describe, expect, it } from 'vitest';
import { shouldSearchExternal } from './externalSearch';

const base = {
  localSettled: true,
  localOk: true,
  total: 0,
  page: 1,
  term: 'Agumon',
};

describe('shouldSearchExternal', () => {
  it('activa el fallback con cero resultados locales, página 1 y término válido', () => {
    expect(shouldSearchExternal(base)).toBe(true);
  });

  it('no activa el fallback si hay resultados locales', () => {
    expect(shouldSearchExternal({ ...base, total: 1 })).toBe(false);
  });

  it('no activa el fallback en la página 2', () => {
    expect(shouldSearchExternal({ ...base, page: 2 })).toBe(false);
  });

  it('no activa el fallback mientras la búsqueda local está pendiente', () => {
    expect(shouldSearchExternal({ ...base, localSettled: false })).toBe(false);
  });

  it('no activa el fallback si la búsqueda local falló', () => {
    expect(shouldSearchExternal({ ...base, localOk: false })).toBe(false);
  });

  it('no activa el fallback con término vacío o demasiado corto', () => {
    expect(shouldSearchExternal({ ...base, term: '   ' })).toBe(false);
    expect(shouldSearchExternal({ ...base, term: 'a' })).toBe(false);
  });
});

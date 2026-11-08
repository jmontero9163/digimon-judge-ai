import { describe, expect, it } from 'vitest';
import {
  isValidCardIdentifier,
  validateOfficialClaim,
  validatePositiveCount,
  validateSourceReference,
} from '../src/index';

describe('identificador de carta', () => {
  it('acepta formatos estructurales validos', () => {
    expect(isValidCardIdentifier('BT1-001')).toBe(true);
    expect(isValidCardIdentifier('ST1-01')).toBe(true);
    expect(isValidCardIdentifier('P-001')).toBe(true);
  });

  it('rechaza identificadores invalidos', () => {
    expect(isValidCardIdentifier('bt1-001')).toBe(false);
    expect(isValidCardIdentifier('BT1')).toBe(false);
    expect(isValidCardIdentifier('')).toBe(false);
  });
});

describe('referencia de fuente', () => {
  it('exige sourceId', () => {
    const result = validateSourceReference({ sourceId: '' });

    expect(result.valid).toBe(false);
    expect(result.issues[0]?.code).toBe('source_required');
  });

  it('acepta una fuente HTTPS valida', () => {
    const result = validateSourceReference({
      sourceId: 'source-test',
      url: 'https://example.com/rules',
    });

    expect(result.valid).toBe(true);
  });

  it('rechaza URLs invalidas o sin HTTPS', () => {
    const invalid = validateSourceReference({
      sourceId: 'source-test',
      url: 'not-a-url',
    });
    const insecure = validateSourceReference({
      sourceId: 'source-test',
      url: 'http://example.com/rules',
    });

    expect(invalid.issues[0]?.code).toBe('source_url_invalid');
    expect(insecure.issues[0]?.code).toBe('source_url_not_https');
  });
});

describe('afirmaciones oficiales', () => {
  it('exige citas para resultados oficiales', () => {
    const result = validateOfficialClaim('official', []);

    expect(result.valid).toBe(false);
    expect(result.issues[0]?.code).toBe('official_requires_citation');
  });

  it('acepta resultados no oficiales sin citas', () => {
    const result = validateOfficialClaim('pending', []);

    expect(result.valid).toBe(true);
  });

  it('exige sourceId en cada cita oficial', () => {
    const result = validateOfficialClaim('official', [{ sourceId: '' }]);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain('official_citation_without_source');
  });
});

describe('cantidades estructurales', () => {
  it('acepta enteros positivos', () => {
    expect(validatePositiveCount(1).valid).toBe(true);
  });

  it('rechaza cero, negativos y decimales', () => {
    expect(validatePositiveCount(0).valid).toBe(false);
    expect(validatePositiveCount(-1).valid).toBe(false);
    expect(validatePositiveCount(1.5).valid).toBe(false);
  });
});

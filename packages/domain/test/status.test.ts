import { describe, expect, it } from 'vitest';
import {
  isOfficialRuleStatus,
  isOfficialSourceKind,
  isRuleStatus,
  isSourceKind,
  isSourceVersionStatus,
  RULE_STATUSES,
  SOURCE_KINDS,
  SOURCE_VERSION_STATUSES,
} from '../src/index';

describe('estados de reglas', () => {
  it('acepta unicamente los estados declarados', () => {
    for (const status of RULE_STATUSES) {
      expect(isRuleStatus(status)).toBe(true);
    }

    expect(isRuleStatus('verified')).toBe(false);
    expect(isRuleStatus(undefined)).toBe(false);
  });

  it('identifica el estado oficial', () => {
    expect(isOfficialRuleStatus('official')).toBe(true);
    expect(isOfficialRuleStatus('interpretation')).toBe(false);
    expect(isOfficialRuleStatus('pending')).toBe(false);
    expect(isOfficialRuleStatus('superseded')).toBe(false);
  });
});

describe('tipos de fuente', () => {
  it('acepta unicamente los tipos declarados', () => {
    for (const kind of SOURCE_KINDS) {
      expect(isSourceKind(kind)).toBe(true);
    }

    expect(isSourceKind('forum')).toBe(false);
  });

  it('distingue fuentes oficiales de no oficiales', () => {
    expect(isOfficialSourceKind('official_rules')).toBe(true);
    expect(isOfficialSourceKind('official_faq')).toBe(true);
    expect(isOfficialSourceKind('community')).toBe(false);
    expect(isOfficialSourceKind('internal')).toBe(false);
  });
});

describe('estados de versión de fuente', () => {
  it('acepta unicamente los estados declarados', () => {
    for (const status of SOURCE_VERSION_STATUSES) {
      expect(isSourceVersionStatus(status)).toBe(true);
    }

    expect(isSourceVersionStatus('draft')).toBe(false);
    expect(isSourceVersionStatus(undefined)).toBe(false);
  });
});

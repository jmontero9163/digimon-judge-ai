import { hasSourceReference } from './provenance';
import type { SourceReference } from './provenance';
import type { RuleStatus } from './status';

export interface ValidationIssue {
  code: string;
  message: string;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export const CARD_IDENTIFIER_PATTERN = /^[A-Z][A-Z0-9]*-[A-Z0-9]{2,4}$/;

export function isValidCardIdentifier(value: string): boolean {
  return CARD_IDENTIFIER_PATTERN.test(value.trim());
}

export function validateSourceReference(
  reference: SourceReference | undefined | null,
  path = 'source',
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!hasSourceReference(reference)) {
    issues.push({
      code: 'source_required',
      message: 'Toda regla, ruling o interpretacion debe referenciar una fuente.',
      path,
    });
  }

  if (reference?.url) {
    try {
      const parsed = new URL(reference.url);
      if (parsed.protocol !== 'https:') {
        issues.push({
          code: 'source_url_not_https',
          message: 'Las fuentes externas deben usar HTTPS.',
          path: `${path}.url`,
        });
      }
    } catch {
      issues.push({
        code: 'source_url_invalid',
        message: 'La URL de la fuente no es valida.',
        path: `${path}.url`,
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

export function validateOfficialClaim(
  status: RuleStatus,
  citations: SourceReference[],
): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (status === 'official' && citations.length === 0) {
    issues.push({
      code: 'official_requires_citation',
      message: 'Un resultado oficial requiere al menos una fuente citada.',
      path: 'citations',
    });
  }

  if (status === 'official' && citations.some((citation) => !hasSourceReference(citation))) {
    issues.push({
      code: 'official_citation_without_source',
      message: 'Cada cita de un resultado oficial debe incluir sourceId.',
      path: 'citations',
    });
  }

  return { valid: issues.length === 0, issues };
}

export function validatePositiveCount(value: number, path = 'count'): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!Number.isInteger(value) || value <= 0) {
    issues.push({
      code: 'count_invalid',
      message: 'La cantidad debe ser un entero positivo.',
      path,
    });
  }

  return { valid: issues.length === 0, issues };
}

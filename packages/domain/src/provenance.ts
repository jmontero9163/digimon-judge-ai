import type { RuleStatus, SourceKind } from './status';

export interface SourceReference {
  sourceId: string;
  sourceKind?: SourceKind;
  title?: string;
  url?: string;
  verifiedAt?: string;
  version?: string;
}

export interface CitedSource extends SourceReference {
  excerpt?: string;
}

export interface Provenance {
  status: RuleStatus;
  source: SourceReference;
}

export function hasSourceReference(value: SourceReference | undefined | null): boolean {
  return Boolean(value?.sourceId?.trim());
}

export function hasOfficialSource(value: SourceReference | undefined | null): boolean {
  if (!hasSourceReference(value)) {
    return false;
  }

  if (value?.sourceKind) {
    return value.sourceKind.startsWith('official_');
  }

  return true;
}

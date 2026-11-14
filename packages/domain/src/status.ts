export const RULE_STATUSES = ['official', 'interpretation', 'pending', 'superseded'] as const;

export type RuleStatus = (typeof RULE_STATUSES)[number];

export const SOURCE_KINDS = [
  'official_rules',
  'official_cardlist',
  'official_faq',
  'official_errata',
  'official_banlist',
  'community',
  'internal',
] as const;

export type SourceKind = (typeof SOURCE_KINDS)[number];

export const SOURCE_VERSION_STATUSES = ['pending', 'current', 'superseded'] as const;

export type SourceVersionStatus = (typeof SOURCE_VERSION_STATUSES)[number];

const RULE_STATUS_SET: ReadonlySet<string> = new Set(RULE_STATUSES);
const SOURCE_KIND_SET: ReadonlySet<string> = new Set(SOURCE_KINDS);
const SOURCE_VERSION_STATUS_SET: ReadonlySet<string> = new Set(SOURCE_VERSION_STATUSES);

export function isRuleStatus(value: unknown): value is RuleStatus {
  return typeof value === 'string' && RULE_STATUS_SET.has(value);
}

export function isSourceKind(value: unknown): value is SourceKind {
  return typeof value === 'string' && SOURCE_KIND_SET.has(value);
}

export function isSourceVersionStatus(value: unknown): value is SourceVersionStatus {
  return typeof value === 'string' && SOURCE_VERSION_STATUS_SET.has(value);
}

export function isOfficialRuleStatus(status: RuleStatus): boolean {
  return status === 'official';
}

export function isOfficialSourceKind(kind: SourceKind): boolean {
  return kind.startsWith('official_');
}

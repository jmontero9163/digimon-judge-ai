export interface ExternalSearchConditions {
  localSettled: boolean;
  localOk: boolean;
  total: number;
  page: number;
  term: string;
}

export function shouldSearchExternal({
  localSettled,
  localOk,
  total,
  page,
  term,
}: ExternalSearchConditions): boolean {
  return localSettled && localOk && total === 0 && page === 1 && term.trim().length >= 2;
}

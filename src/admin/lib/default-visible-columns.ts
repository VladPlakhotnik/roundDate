export function getDefaultVisibleAdminColumnIds<TColumn extends { id: string }>(
  columns: readonly TColumn[],
  hiddenColumnIds: readonly TColumn["id"][],
) {
  const hiddenColumnIdSet = new Set<string>(hiddenColumnIds);

  return columns
    .map((column) => column.id)
    .filter((columnId) => !hiddenColumnIdSet.has(columnId));
}

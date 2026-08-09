export function getPaginationWindow(
  currentPage: number,
  totalPages: number,
  radius = 2,
): number[] {
  if (totalPages < 1) return [];

  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const safeRadius = Math.max(0, Math.floor(radius));
  const start = Math.max(1, safeCurrentPage - safeRadius);
  const end = Math.min(totalPages, safeCurrentPage + safeRadius);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

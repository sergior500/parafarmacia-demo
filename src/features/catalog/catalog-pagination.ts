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

export type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

export function getPaginationItems(
  currentPage: number,
  totalPages: number,
  radius = 2,
): PaginationItem[] {
  const window = getPaginationWindow(currentPage, totalPages, radius);
  if (!window.length) return [];

  const items: PaginationItem[] = [];
  const firstWindowPage = window[0]!;
  const lastWindowPage = window.at(-1)!;

  if (firstWindowPage > 1) {
    items.push(1);
    if (firstWindowPage > 2) items.push("ellipsis-start");
  }

  items.push(...window);

  if (lastWindowPage < totalPages) {
    if (lastWindowPage < totalPages - 1) items.push("ellipsis-end");
    items.push(totalPages);
  }

  return items;
}

export function buildAllCategoriesHref({
  pathname,
  search,
  hasInitialCategory,
}: {
  pathname: string;
  search: string;
  hasInitialCategory: boolean;
}): string {
  const params = new URLSearchParams(search);
  params.delete("categoria");
  params.delete("pagina");

  const targetPath = hasInitialCategory ? "/parafarmacia" : pathname;
  const queryString = params.toString();
  return queryString ? `${targetPath}?${queryString}` : targetPath;
}

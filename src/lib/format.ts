export function formatMoney(amountInCents: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amountInCents / 100);
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

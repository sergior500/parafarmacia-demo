const financialLabels: Record<string, string> = {
  AUTHORIZED: "Autorizado",
  EXPIRED: "Caducado",
  PAID: "Pagado",
  PARTIALLY_PAID: "Pago parcial",
  PARTIALLY_REFUNDED: "Reembolso parcial",
  PENDING: "Pago pendiente",
  REFUNDED: "Reembolsado",
  VOIDED: "Anulado",
  UNKNOWN: "Sin información",
};

const fulfillmentLabels: Record<string, string> = {
  FULFILLED: "Enviado",
  IN_PROGRESS: "En preparación",
  ON_HOLD: "En espera",
  OPEN: "Por preparar",
  PARTIALLY_FULFILLED: "Envío parcial",
  PENDING_FULFILLMENT: "Preparación pendiente",
  REQUEST_DECLINED: "Preparación rechazada",
  RESTOCKED: "Repuesto",
  SCHEDULED: "Programado",
  UNFULFILLED: "Por preparar",
};

export function formatShopifyMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

export function formatShopifyDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

export function financialStatusLabel(status: string) {
  return financialLabels[status] ?? status;
}

export function fulfillmentStatusLabel(status: string) {
  return fulfillmentLabels[status] ?? status;
}

import type {
  NotificationProvider,
  PaymentProvider,
  ShippingProvider,
} from "@/providers/ports";

export class MockPaymentProvider implements PaymentProvider {
  readonly enabled = false;

  async authorize(): Promise<never> {
    throw new Error("Los pagos están desactivados en modo demostración.");
  }
}

export class MockShippingProvider implements ShippingProvider {
  readonly enabled = false;

  async quote(): Promise<never> {
    throw new Error("El transporte está desactivado en modo demostración.");
  }
}

export class MockNotificationProvider implements NotificationProvider {
  readonly enabled = false;

  async send(): Promise<void> {
    return Promise.resolve();
  }
}

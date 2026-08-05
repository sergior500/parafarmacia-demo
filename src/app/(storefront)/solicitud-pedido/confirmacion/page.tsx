import type { Metadata } from "next";
import { Suspense } from "react";

import { OrderConfirmation } from "@/features/checkout/order-confirmation";

export const metadata: Metadata = {
  title: "Solicitud registrada",
  description: "Confirmación de una solicitud ficticia sin cobro.",
};

export default function ConfirmationPage() {
  return (
    <div className="page-shell py-12 md:py-20">
      <Suspense
        fallback={
          <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-3xl bg-white" />
        }
      >
        <OrderConfirmation />
      </Suspense>
    </div>
  );
}

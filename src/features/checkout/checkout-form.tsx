"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type Customer,
  type CustomerInput,
  customerSchema,
} from "@/domain/customer/customer";
import { useDemo } from "@/features/demo/demo-provider";

const fields: Array<{
  name: keyof Pick<
    CustomerInput,
    | "firstName"
    | "lastName"
    | "email"
    | "phone"
    | "address"
    | "postalCode"
    | "city"
    | "province"
  >;
  label: string;
  type?: string;
  autoComplete: string;
  className?: string;
}> = [
  { name: "firstName", label: "Nombre", autoComplete: "given-name" },
  { name: "lastName", label: "Apellidos", autoComplete: "family-name" },
  {
    name: "email",
    label: "Correo electrónico",
    type: "email",
    autoComplete: "email",
  },
  { name: "phone", label: "Teléfono", type: "tel", autoComplete: "tel" },
  {
    name: "address",
    label: "Dirección",
    autoComplete: "street-address",
    className: "md:col-span-2",
  },
  {
    name: "postalCode",
    label: "Código postal",
    autoComplete: "postal-code",
  },
  { name: "city", label: "Localidad", autoComplete: "address-level2" },
  {
    name: "province",
    label: "Provincia",
    autoComplete: "address-level1",
    className: "md:col-span-2",
  },
];

export function CheckoutForm() {
  const { cart, submitOrder } = useDemo();
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      acceptsTerms: false,
      confirmsFictitiousData: false,
      notes: "",
    },
  });

  async function onSubmit(values: CustomerInput) {
    setSubmitError("");
    try {
      const customer: Customer = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        postalCode: values.postalCode,
        city: values.city,
        province: values.province,
        notes: values.notes || undefined,
      };
      const order = await submitOrder(customer);
      router.push(`/solicitud-pedido/confirmacion?id=${order.id}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "No se ha podido crear el pedido.",
      );
    }
  }

  if (cart.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="font-display text-forest text-3xl">
          Necesitas añadir productos primero
        </p>
        <Button className="mt-6" onClick={() => router.push("/buscar")}>
          Explorar catálogo
        </Button>
      </Card>
    );
  }

  return (
    <form
      className="grid gap-8 lg:grid-cols-[1fr_20rem]"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="grid gap-5">
        <Card className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <span className="bg-sage text-forest grid size-11 shrink-0 place-items-center rounded-2xl">
              <LockKeyhole aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-forest text-3xl">
                Datos de contacto ficticios
              </h2>
              <p className="text-ink-muted mt-1 text-sm">
                No introduzcas datos personales reales en esta demostración.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {fields.map((field) => (
              <div className={field.className} key={field.name}>
                <label className="field-label" htmlFor={field.name}>
                  {field.label}
                </label>
                <Input
                  id={field.name}
                  type={field.type ?? "text"}
                  autoComplete={field.autoComplete}
                  aria-invalid={Boolean(errors[field.name])}
                  aria-describedby={
                    errors[field.name] ? `${field.name}-error` : undefined
                  }
                  {...register(field.name)}
                />
                {errors[field.name]?.message ? (
                  <p
                    className="field-error"
                    id={`${field.name}-error`}
                    role="alert"
                  >
                    {errors[field.name]?.message}
                  </p>
                ) : null}
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="field-label" htmlFor="notes">
                Observaciones (opcional)
              </label>
              <Textarea
                id="notes"
                aria-invalid={Boolean(errors.notes)}
                {...register("notes")}
              />
              {errors.notes?.message ? (
                <p className="field-error" role="alert">
                  {errors.notes.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="border-forest/10 mt-8 grid gap-4 border-t pt-6">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                className="accent-forest mt-1 size-5 shrink-0"
                type="checkbox"
                {...register("acceptsTerms")}
              />
              <span>
                Acepto las condiciones simuladas de esta demostración.
                {errors.acceptsTerms?.message ? (
                  <span className="field-error block" role="alert">
                    {errors.acceptsTerms.message}
                  </span>
                ) : null}
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <input
                className="accent-forest mt-1 size-5 shrink-0"
                type="checkbox"
                {...register("confirmsFictitiousData")}
              />
              <span>
                Confirmo que todos los datos introducidos son ficticios.
                {errors.confirmsFictitiousData?.message ? (
                  <span className="field-error block" role="alert">
                    {errors.confirmsFictitiousData.message}
                  </span>
                ) : null}
              </span>
            </label>
          </div>
        </Card>

        <Card className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <span className="bg-sage text-forest grid size-11 shrink-0 place-items-center rounded-2xl">
              <Truck aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-forest text-3xl">
                Método de envío
              </h2>
              <p className="text-ink-muted mt-1 text-sm">
                Opciones visuales pendientes del transportista definitivo.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            <label className="border-forest bg-sage/40 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4">
              <span className="flex items-center gap-3">
                <input
                  defaultChecked
                  name="shipping"
                  type="radio"
                  className="accent-forest"
                />
                <span>
                  <strong className="text-forest block text-sm">
                    Entrega estándar 24–48 h
                  </strong>
                  <span className="text-ink-muted text-xs">
                    Península · estimación demo
                  </span>
                </span>
              </span>
              <strong className="text-forest text-sm">Por calcular</strong>
            </label>
            <label className="border-forest/10 flex cursor-not-allowed items-center justify-between gap-4 rounded-2xl border p-4 opacity-55">
              <span className="flex items-center gap-3">
                <input disabled name="shipping" type="radio" />
                <span>
                  <strong className="text-forest block text-sm">
                    Recogida local
                  </strong>
                  <span className="text-ink-muted text-xs">
                    Pendiente de confirmar establecimiento
                  </span>
                </span>
              </span>
              <strong className="text-forest text-sm">Gratis</strong>
            </label>
          </div>
        </Card>

        <Card className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <span className="bg-sage text-forest grid size-11 shrink-0 place-items-center rounded-2xl">
              <CreditCard aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-forest text-3xl">
                Método de pago
              </h2>
              <p className="text-ink-muted mt-1 text-sm">
                No se solicitan datos bancarios ni se realiza ningún cobro.
              </p>
            </div>
          </div>
          <div className="border-forest/10 bg-cream mt-6 rounded-2xl border p-4">
            <div className="flex items-center gap-3">
              <input
                defaultChecked
                name="payment"
                type="radio"
                className="accent-forest"
              />
              <span>
                <strong className="text-forest block text-sm">
                  Pago simulado
                </strong>
                <span className="text-ink-muted text-xs">
                  La pasarela real se elegirá más adelante
                </span>
              </span>
            </div>
          </div>
        </Card>
      </div>

      <aside>
        <Card className="sticky top-40 p-6">
          <ShieldCheck aria-hidden="true" className="text-coral size-7" />
          <h2 className="font-display text-forest mt-4 text-3xl">
            Resumen demo
          </h2>
          <ul className="text-ink-muted mt-5 grid gap-3 text-sm">
            <li className="flex gap-2">
              <CheckCircle2 className="text-forest mt-0.5 size-4 shrink-0" />
              {cart.length} líneas de producto
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="text-forest mt-0.5 size-4 shrink-0" />
              Sin pago ni reserva de stock real
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="text-forest mt-0.5 size-4 shrink-0" />
              Pedido visible en el panel de gestión
            </li>
          </ul>
          <Button className="mt-6 w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Creando pedido…" : "Confirmar pedido demo"}
          </Button>
          {submitError ? (
            <p className="mt-3 text-sm text-red-700" role="alert">
              {submitError}
            </p>
          ) : null}
        </Card>
      </aside>
    </form>
  );
}

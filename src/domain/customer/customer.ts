import { z } from "zod";

const safeText = z
  .string()
  .trim()
  .min(1, "Este campo es obligatorio.")
  .max(120, "El texto es demasiado largo.")
  .refine(
    (value) => !/[<>]/.test(value),
    "No se permiten los caracteres < o >.",
  );

export const customerSchema = z.object({
  firstName: safeText,
  lastName: safeText,
  email: z.email("Introduce un correo electrónico válido.").max(160),
  phone: z
    .string()
    .trim()
    .regex(/^[+()\d\s-]{9,20}$/, "Introduce un teléfono válido."),
  address: safeText.max(180),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Introduce un código postal de 5 cifras."),
  city: safeText,
  province: safeText,
  notes: z
    .string()
    .trim()
    .max(500, "Las observaciones no pueden superar 500 caracteres.")
    .refine(
      (value) => !/[<>]/.test(value),
      "No se permiten los caracteres < o >.",
    )
    .optional(),
  acceptsTerms: z
    .boolean()
    .refine((value) => value, "Debes aceptar las condiciones simuladas."),
  confirmsFictitiousData: z
    .boolean()
    .refine((value) => value, "Confirma que utilizas datos ficticios."),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  notes?: string;
}

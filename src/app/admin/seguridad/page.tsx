import { Fingerprint, ShieldCheck, TriangleAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { requireAdminCapability } from "@/server/admin-auth";
import { getRecentSecurityEvents } from "@/server/security-report";

export const dynamic = "force-dynamic";

const eventLabels: Record<string, string> = {
  "admin.authentication_failed": "Identidad no autorizada",
  "admin.authorization_failed": "Permiso insuficiente",
  "admin.origin_rejected": "Origen rechazado",
  "admin.csrf_rejected": "Token CSRF rechazado",
  "admin.rate_limited": "Límite de uso alcanzado",
};

export default async function AdminSecurityPage() {
  const actor = await requireAdminCapability(
    "security:read",
    "/admin/seguridad",
  );
  const events = await getRecentSecurityEvents();

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Defensa en profundidad</p>
          <h1 className="font-display text-forest mt-2 text-4xl">Seguridad</h1>
          <p className="text-ink/70 mt-3 max-w-3xl">
            Registro de intentos bloqueados por autenticación, permisos, origen,
            protección CSRF o límites de abuso. Las direcciones de red y agentes
            de usuario se guardan como huellas irreversibles, no en texto claro.
          </p>
        </div>
        <div className="bg-sage text-forest inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black">
          <ShieldCheck className="size-4" /> Sesión protegida · {actor.role}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <Fingerprint className="text-forest size-5" />
          <p className="text-ink/60 mt-3 text-xs font-black tracking-wider uppercase">
            Eventos recientes
          </p>
          <p className="font-display text-forest mt-1 text-3xl">
            {events.length}
          </p>
        </Card>
        <Card className="p-5 md:col-span-2">
          <p className="text-forest font-black">Qué significa una fila</p>
          <p className="text-ink/70 mt-2 text-sm leading-6">
            Es una petición que no llegó a ejecutar la operación administrativa.
            El identificador permite correlacionarla con los registros del
            hosting sin exponer secretos ni contenido de formularios.
          </p>
        </Card>
      </div>

      <Card className="mt-8 overflow-hidden">
        <div className="border-forest/10 flex items-center gap-2 border-b p-5">
          <TriangleAlert className="size-5 text-amber-700" />
          <h2 className="text-forest font-black">Intentos bloqueados</h2>
        </div>
        {events.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-sage/60 text-forest text-xs tracking-wider uppercase">
                <tr>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Control</th>
                  <th className="px-5 py-3">Ruta</th>
                  <th className="px-5 py-3">Identidad</th>
                  <th className="px-5 py-3">Referencia</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr className="border-forest/10 border-t" key={event.eventId}>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {new Intl.DateTimeFormat("es-ES", {
                        dateStyle: "short",
                        timeStyle: "medium",
                        timeZone: "Europe/Madrid",
                      }).format(new Date(event.createdAt))}
                    </td>
                    <td className="px-5 py-4 font-bold">
                      {eventLabels[event.eventType] ?? event.eventType}
                    </td>
                    <td className="max-w-72 truncate px-5 py-4 font-mono text-xs">
                      {event.method} {event.route}
                    </td>
                    <td className="px-5 py-4">
                      {event.actorEmail ?? "Sin identidad autorizada"}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs">
                      {event.requestId.slice(0, 12)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-ink/65 p-6 text-sm">
            No hay intentos bloqueados registrados todavía.
          </p>
        )}
      </Card>
    </main>
  );
}

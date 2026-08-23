"use client";

import {
  CheckCircle2,
  LoaderCircle,
  Pencil,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";

import { Card } from "@/components/ui/card";
import { secureAdminFetch } from "@/features/admin/secure-admin-fetch";
import { type AdminRole, adminRoleLabel } from "@/server/admin-roles";

export interface AdminTeamUser {
  email: string;
  displayName: string;
  role: AdminRole;
  enabled: boolean;
  developmentIdentityLinked: boolean;
  shopifyIdentityLinked: boolean;
  createdAt: string;
  updatedAt: string;
}

const emptyForm = {
  email: "",
  displayName: "",
  role: "catalog_manager" as AdminRole,
  enabled: true,
};

const inputClass =
  "border-forest/15 text-forest focus:border-forest focus:ring-sage mt-2 min-h-12 w-full rounded-2xl border bg-white px-4 text-sm outline-none focus:ring-3 disabled:bg-stone-100";

export function AdminTeamManager({
  currentEmail,
  initialUsers,
}: {
  currentEmail: string;
  initialUsers: AdminTeamUser[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [editingEmail, setEditingEmail] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  function edit(user: AdminTeamUser) {
    setEditingEmail(user.email);
    setForm({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      enabled: user.enabled,
    });
    setNotice("");
    setError("");
  }

  function reset() {
    setEditingEmail("");
    setForm(emptyForm);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const response = await secureAdminFetch("/api/admin/users", {
        method: editingEmail ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json()) as {
        user?: AdminTeamUser;
        error?: string;
      };
      if (!response.ok || !body.user) {
        throw new Error(body.error || "No se pudo guardar el acceso.");
      }
      const savedUser = body.user;
      setUsers((current) =>
        editingEmail
          ? current.map((user) =>
              user.email === savedUser.email ? savedUser : user,
            )
          : [...current, savedUser].sort((left, right) =>
              left.displayName.localeCompare(right.displayName, "es"),
            ),
      );
      setNotice(
        editingEmail ? "Acceso actualizado." : "Acceso creado correctamente.",
      );
      reset();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo guardar el acceso.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
      <Card className="h-fit p-6">
        <UserPlus className="text-coral size-7" />
        <h2 className="font-display text-forest mt-4 text-3xl">
          {editingEmail ? "Editar acceso" : "Añadir persona"}
        </h2>
        <p className="text-ink-muted mt-2 text-sm leading-6">
          Añade su correo profesional y asigna solo los permisos necesarios.
          Shopify vinculará automáticamente su identidad verificada durante la
          migración definitiva.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <Field label="Nombre">
            <input
              className={inputClass}
              maxLength={100}
              onChange={(event) =>
                setForm({ ...form, displayName: event.target.value })
              }
              required
              value={form.displayName}
            />
          </Field>
          <Field label="Correo profesional">
            <input
              className={inputClass}
              disabled={Boolean(editingEmail)}
              maxLength={254}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              required
              type="email"
              value={form.email}
            />
          </Field>
          <Field label="Rol">
            <select
              className={inputClass}
              onChange={(event) =>
                setForm({ ...form, role: event.target.value as AdminRole })
              }
              value={form.role}
            >
              <option value="owner">Propietario</option>
              <option value="catalog_manager">Catálogo</option>
              <option value="operations_manager">Operaciones</option>
              <option value="auditor">Solo lectura</option>
            </select>
          </Field>
          {editingEmail ? (
            <label className="text-forest flex items-center gap-3 text-sm font-bold">
              <input
                checked={form.enabled}
                className="accent-forest size-4"
                disabled={editingEmail === currentEmail}
                onChange={(event) =>
                  setForm({ ...form, enabled: event.target.checked })
                }
                type="checkbox"
              />
              Acceso activo
            </label>
          ) : null}
          {error ? (
            <p className="rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-800">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="flex gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="size-4 shrink-0" /> {notice}
            </p>
          ) : null}
          <button
            className="bg-forest inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-black text-white disabled:opacity-50"
            disabled={busy}
            type="submit"
          >
            {busy ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
            {editingEmail ? "Guardar cambios" : "Crear acceso"}
          </button>
          {editingEmail ? (
            <button
              className="border-forest/15 text-forest min-h-11 w-full rounded-full border text-sm font-bold"
              onClick={reset}
              type="button"
            >
              Cancelar edición
            </button>
          ) : null}
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-forest/10 bg-sage/40 border-b px-5 py-5 sm:px-7">
          <p className="eyebrow">Permisos actuales</p>
          <h2 className="text-forest mt-1 text-xl font-black">
            Equipo autorizado
          </h2>
        </div>
        <div className="divide-forest/10 divide-y">
          {users.map((user) => (
            <article
              className={`grid gap-4 p-5 sm:px-7 lg:grid-cols-[1fr_auto_auto] lg:items-center ${
                user.enabled ? "" : "bg-stone-50 opacity-70"
              }`}
              key={user.email}
            >
              <div className="min-w-0">
                <strong className="text-forest block truncate">
                  {user.displayName}
                </strong>
                <span className="text-ink-muted block truncate text-xs">
                  {user.email}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-sage text-forest rounded-full px-3 py-1 text-xs font-black">
                  {adminRoleLabel(user.role)}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    user.enabled
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {user.enabled ? "Acceso activo" : "Desactivado"}
                </span>
                {user.enabled ? (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      user.shopifyIdentityLinked
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {user.shopifyIdentityLinked
                      ? "Shopify vinculado"
                      : user.developmentIdentityLinked
                        ? "Acceso actual · Shopify pendiente"
                        : "Pendiente de primer acceso"}
                  </span>
                ) : null}
              </div>
              <button
                className="border-forest/15 text-forest inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-4 text-xs font-black"
                onClick={() => edit(user)}
                type="button"
              >
                <Pencil className="size-3.5" /> Editar
              </button>
            </article>
          ))}
          {!users.length ? (
            <div className="p-8 text-center">
              <p className="text-forest font-black">
                Todavía no hay personal añadido
              </p>
              <p className="text-ink-muted mt-2 text-sm">
                Tu acceso de desarrollo continúa protegido mediante la
                configuración segura del sitio.
              </p>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-forest text-xs font-black tracking-wider uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

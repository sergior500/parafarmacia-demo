"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          background: "#f4f0e5",
          color: "#1f2923",
          fontFamily: '"Segoe UI", system-ui, sans-serif',
        }}
      >
        <main
          style={{
            display: "grid",
            minHeight: "100vh",
            placeItems: "center",
            padding: "24px",
          }}
        >
          <section
            style={{
              width: "min(100%, 760px)",
              border: "1px solid rgba(33,63,50,.2)",
              background: "#f8f5ec",
              padding: "clamp(28px, 6vw, 64px)",
            }}
          >
            <span
              style={{
                display: "grid",
                width: 56,
                height: 56,
                placeItems: "center",
                borderRadius: "50%",
                background: "#213f32",
                color: "#f4f0e5",
                fontFamily: "Georgia, serif",
                fontWeight: 700,
              }}
            >
              FP
            </span>
            <p
              style={{
                margin: "32px 0 0",
                color: "#6d773f",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: ".14em",
                textTransform: "uppercase",
              }}
            >
              Error crítico temporal
            </p>
            <h1
              style={{
                margin: "16px 0 0",
                color: "#213f32",
                fontFamily: "Georgia, serif",
                fontSize: "clamp(42px, 8vw, 72px)",
                letterSpacing: "-.05em",
                lineHeight: 1,
              }}
            >
              Volvamos a empezar con calma.
            </h1>
            <p style={{ margin: "24px 0", color: "#647067", lineHeight: 1.7 }}>
              La aplicación no ha podido iniciarse correctamente. Prueba a
              recargarla; si estabas finalizando una compra, comprueba su estado
              antes de repetirla.
            </p>
            <button
              onClick={reset}
              style={{
                minHeight: 48,
                border: 0,
                borderRadius: "6px 16px 6px 16px",
                background: "#213f32",
                color: "white",
                cursor: "pointer",
                fontWeight: 800,
                padding: "0 24px",
              }}
              type="button"
            >
              Reiniciar aplicación
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}

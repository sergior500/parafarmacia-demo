export default function Loading() {
  return (
    <div
      className="page-shell animate-pulse py-8 md:py-12"
      aria-label="Cargando contenido"
    >
      <div className="paper-grid border-forest/10 grid min-h-[30rem] gap-3 border p-5 lg:grid-cols-2">
        <div className="bg-sage/70 rounded-[.35rem_2.5rem_.35rem_.35rem] p-8">
          <div className="bg-olive/20 h-3 w-36" />
          <div className="bg-forest/15 mt-8 h-14 max-w-lg" />
          <div className="bg-forest/10 mt-3 h-14 max-w-md" />
          <div className="bg-forest/10 mt-7 h-4 max-w-sm" />
          <div className="bg-forest/10 mt-3 h-4 max-w-xs" />
        </div>
        <div className="bg-cream-dark rounded-[2.5rem_.35rem_.35rem_.35rem]" />
      </div>
    </div>
  );
}

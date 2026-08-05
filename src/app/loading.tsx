export default function Loading() {
  return (
    <div
      className="page-shell animate-pulse py-12"
      aria-label="Cargando contenido"
    >
      <div className="bg-sage h-4 w-28 rounded" />
      <div className="bg-sage mt-5 h-14 max-w-xl rounded-2xl" />
      <div className="bg-cream-dark mt-4 h-5 max-w-2xl rounded" />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="h-80 rounded-3xl bg-white" key={index} />
        ))}
      </div>
    </div>
  );
}

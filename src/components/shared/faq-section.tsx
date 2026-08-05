import type { FAQ } from "@/domain/content/content";

export function FAQSection({
  title = "Preguntas frecuentes",
  faqs,
}: {
  title?: string;
  faqs: FAQ[];
}) {
  return (
    <section aria-labelledby="faq-title">
      <p className="eyebrow">Resolvemos tus dudas</p>
      <h2
        className="display-title text-forest mt-3 text-4xl md:text-5xl"
        id="faq-title"
      >
        {title}
      </h2>
      <div className="border-forest/10 mt-7 divide-y rounded-[1.75rem] border bg-white px-5 md:px-7">
        {faqs.map((faq) => (
          <details className="group py-5" key={faq.question}>
            <summary className="text-forest flex cursor-pointer list-none items-center justify-between gap-5 font-bold">
              {faq.question}
              <span className="bg-sage grid size-7 shrink-0 place-items-center rounded-full text-lg transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="text-ink-muted max-w-3xl pt-3 text-sm leading-relaxed">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Migas de pan" className="py-6">
      <ol className="text-ink-muted flex flex-wrap items-center gap-2 text-sm">
        <li>
          <Link href="/" aria-label="Inicio">
            <Home aria-hidden="true" className="size-4" />
          </Link>
        </li>
        {items.map((item) => (
          <li className="flex items-center gap-2" key={item.label}>
            <ChevronRight aria-hidden="true" className="size-3" />
            {item.href ? (
              <Link className="hover:text-forest" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

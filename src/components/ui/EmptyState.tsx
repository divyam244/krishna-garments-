import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full border border-copper/30 text-champagne/60">
        <ShoppingBag size={24} />
      </span>
      <h2 className="font-display text-3xl text-ivory/85">{title}</h2>
      <p className="max-w-md text-sm leading-relaxed text-ivory/50">{body}</p>
      {action && (
        <Link href={action.href} className="btn-solid mt-2">
          {action.label}
        </Link>
      )}
    </div>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[80svh] flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="font-display text-[92px] leading-none gold-text">404</span>
      <h1 className="font-display text-3xl md:text-4xl">This page is not in the catalogue</h1>
      <p className="max-w-md text-sm leading-relaxed text-ivory/50">
        The link may be old, or the style may have been retired. Our current pieces are all one click away.
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <Link href="/clothing" className="btn-solid">Browse Clothing</Link>
        <Link href="/" className="btn-outline">Back to Home</Link>
      </div>
    </div>
  );
}

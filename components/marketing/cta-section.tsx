import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function CtaSection() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { title, subtitle, button } = t.marketing.cta;

  return (
    <section aria-labelledby="cta-heading" className="bg-background px-4 py-14 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-12 text-center shadow-2xl shadow-primary/30 sm:px-12 sm:py-20"
          style={{
            background:
              "linear-gradient(135deg, #1d2bca 0%, #3d46cc 30%, #2f50e6 65%, #06b6d4 140%)",
          }}
        >
          {/* Soft glow accents */}
          <div
            aria-hidden
            className="pointer-events-none absolute -left-32 -top-24 size-[420px] rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, oklch(78% 0.16 215 / 0.45), transparent 75%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 -bottom-24 size-[420px] rounded-full"
            style={{
              background:
                "radial-gradient(closest-side, oklch(55% 0.22 268 / 0.45), transparent 75%)",
            }}
          />
          {/* Dot pattern */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.10]"
            style={{
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 id="cta-heading" className="text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {title}
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-white/80 sm:mt-4 sm:text-lg">
              {subtitle}
            </p>
            <div className="mt-6 sm:mt-8">
              <Link
                href="/signup"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group/cta w-full bg-white text-primary [a]:hover:bg-white [a]:hover:-translate-y-0.5 [a]:hover:shadow-xl [a]:hover:shadow-black/20 font-semibold px-8 shadow-lg shadow-black/10 transition-all duration-200 ease-out sm:w-auto"
                )}
              >
                {button}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

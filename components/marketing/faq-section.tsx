import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function FaqSection() {
  const locale = await getLocale();
  const t = getDictionary(locale);
  const { items } = t.marketing.faq;

  const faqs = [
    { value: "faq-1", q: items.q1, a: items.a1 },
    { value: "faq-2", q: items.q2, a: items.a2 },
    { value: "faq-3", q: items.q3, a: items.a3 },
    { value: "faq-4", q: items.q4, a: items.a4 },
    { value: "faq-5", q: items.q5, a: items.a5 },
    { value: "faq-6", q: items.q6, a: items.a6 },
  ];

  return (
    <section id="faq" aria-labelledby="faq-heading" className="scroll-mt-24 bg-muted/30 py-14 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 id="faq-heading" className="text-2xl sm:text-4xl font-bold tracking-tight">
            {t.marketing.faq.title}
          </h2>
        </div>

        <div className="max-w-3xl mx-auto mt-7 sm:mt-10">
          <Accordion multiple={false} className="space-y-2.5 sm:space-y-3">
            {faqs.map(({ value, q, a }) => (
              <AccordionItem
                key={value}
                value={value}
                className="border border-border rounded-xl px-4 bg-card sm:px-5"
              >
                <AccordionTrigger className="text-[15px] sm:text-base font-medium py-3.5 sm:py-4 hover:no-underline">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                  {a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

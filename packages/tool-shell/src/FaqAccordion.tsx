interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
}

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <div className="mt-4 divide-y divide-ink/10 dark:divide-paper/10">
      {items.map((item) => (
        <details key={item.question} className="group py-3">
          <summary className="cursor-pointer list-none font-medium text-ink marker:content-none dark:text-paper">
            <span className="flex items-center justify-between gap-4">
              {item.question}
              <span
                className="text-ink/40 transition-transform group-open:rotate-45 dark:text-paper/40"
                aria-hidden
              >
                +
              </span>
            </span>
          </summary>
          <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

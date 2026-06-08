"use client";

import { cn } from "@/lib/utils";
import { languageLabels, languages } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage } = useLocale();

  return (
    <div
      className={cn(
        "grid w-full grid-cols-3 items-center rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur sm:inline-flex sm:w-auto sm:grid-cols-none",
        className,
      )}
      role="group"
      aria-label="Language selector"
    >
      {languages.map((item) => {
        const active = item === language;
        return (
          <button
            key={item}
            type="button"
            onClick={() => setLanguage(item)}
            className={cn(
              "rounded-full px-2 py-2 text-xs font-semibold transition sm:px-3 sm:py-1.5",
              active ? "bg-sky-500 text-white shadow-sm" : "text-slate-300 hover:bg-white/5 hover:text-white",
            )}
            aria-pressed={active}
          >
            {languageLabels[item]}
          </button>
        );
      })}
    </div>
  );
}

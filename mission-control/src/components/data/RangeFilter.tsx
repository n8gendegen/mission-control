import Link from "next/link";
import type { RangeKey } from "../../lib/data/usage";
import { getRangeOptions } from "../../lib/data/usage";

type RangeFilterProps = {
  current: RangeKey;
};

export function RangeFilter({ current }: RangeFilterProps) {
  const options = getRangeOptions();

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const query: Record<string, string> = { range: option.value };
        const active = option.value === current;
        return (
          <Link
            key={option.value}
            href={{ pathname: "/data", query }}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              active
                ? "border-violet-400 bg-violet-500/10 text-white"
                : "border-white/10 text-white/70 hover:border-white/30"
            }`}
          >
            {option.label}
          </Link>
        );
      })}
    </div>
  );
}

import { MAX_INTERESTS } from "@/lib/profiles";
import { useInterestTags } from "@/lib/queries";

/** Chips to pick topics the student likes. They drive the "За теб" recommendations. */
export function InterestPicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (ids: number[]) => void;
}) {
  const tags = useInterestTags();
  const full = value.length >= MAX_INTERESTS;

  function flip(id: number) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-bold">
        Какво те интересува?{" "}
        <span className="font-normal text-muted-foreground">
          (по желание, до {MAX_INTERESTS}) — по това ти подреждаме обявите
        </span>
      </legend>
      {tags.isPending ? (
        <div className="zine h-20 animate-pulse bg-muted" aria-busy="true" />
      ) : tags.isError || !tags.data?.length ? (
        <p className="text-sm text-muted-foreground">
          Темите не се заредиха. Можеш да ги избереш по-късно от профила си.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.data.map((t) => {
            const on = value.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                disabled={!on && full}
                onClick={() => flip(t.id)}
                className={`jitter border-[3px] border-ink px-3 py-1 font-heavy text-base transition-colors disabled:opacity-40 ${on ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}

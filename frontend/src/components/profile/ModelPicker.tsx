import { useId, useState } from "react";
import type { AiModel } from "../../types/api";
import { Input } from "../ui/input";

interface ModelPickerProps {
  /** Current model id (free text; suggestions only help fill it in) */
  value: string;
  onChange: (value: string) => void;
  /** Suggestions, e.g. OpenRouter models that support tool calling */
  models: AiModel[] | undefined;
  /** Line under the field: loading, how many models, or why there are none */
  statusText: string;
  /** Show the status line as an error */
  statusIsError?: boolean;
  placeholder?: string;
  /** Id for the input, so a <label htmlFor> can point at it */
  id?: string;
}

const MAX_SUGGESTIONS = 50;

/**
 * Text input for a model id with a filterable list of suggestions.
 * Any id can be typed; picking a suggestion just fills it in. Keyboard:
 * arrows move, Enter picks, Escape closes.
 */
export function ModelPicker({
  value,
  onChange,
  models,
  statusText,
  statusIsError = false,
  placeholder,
  id,
}: ModelPickerProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const query = value.trim().toLowerCase();
  const matches = (models ?? [])
    .filter(
      (m) =>
        !query ||
        m.id.toLowerCase().includes(query) ||
        m.name.toLowerCase().includes(query),
    )
    .slice(0, MAX_SUGGESTIONS);
  const showList = open && matches.length > 0;

  const pick = (model: AiModel) => {
    onChange(model.id);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive(
        (i) => (i + step + matches.length) % Math.max(matches.length, 1),
      );
    } else if (e.key === "Enter" && showList) {
      e.preventDefault();
      pick(matches[active] ?? matches[0]);
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        spellCheck={false}
        className="font-mono text-sm"
      />

      {showList && (
        <div
          id={listId}
          role="listbox"
          className="step-in absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-card p-1 shadow-lg"
        >
          {matches.map((model, index) => (
            <div
              key={model.id}
              role="option"
              tabIndex={-1}
              aria-selected={index === active}
              // mousedown (not click) so the input's blur does not close the list first
              onMouseDown={(e) => {
                e.preventDefault();
                pick(model);
              }}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${
                index === active ? "bg-muted" : ""
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate text-foreground font-sans">
                  {model.name}
                </span>
                <span className="block truncate font-mono text-xs text-muted-foreground">
                  {model.id}
                </span>
              </span>
              {model.free && (
                <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Free
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <p
        className={`mt-1.5 text-xs font-sans ${
          statusIsError ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {statusText}
      </p>
    </div>
  );
}

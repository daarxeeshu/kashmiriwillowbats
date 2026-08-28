"use client";

import { useId, type ReactNode } from "react";
import { Check } from "lucide-react";
import type { BatDoctorOption } from "@/types/bat-doctor";
import { cn } from "@/lib/utils";

/* ── Form controls for Bat Doctor ─────────────────────────────────────────────────
 *
 * This project had no form components at all before this file — the only inputs on the
 * site are the ones the browser draws — so these are new, and they are built to the
 * brief's two hard constraints at once.
 *
 * §32: not a generic white SaaS form. So every control is a dark translucent surface
 * with a hairline, and focus is a warm gold border plus one soft ring rather than the
 * default blue halo. Nothing here is white.
 *
 * §35: keyboard, focus, labels, errors, and — the one that shapes the markup —
 * "do not rely on colour alone to communicate selection". So a chosen option carries a
 * tick as well as a gold border, and it is a real `<input type="radio">` underneath:
 * `sr-only`, not `opacity-0`, because an opacity-0 input is invisible *and* focusable,
 * which is how a keyboard user ends up tabbing into something they cannot see. `sr-only`
 * keeps the control in the accessibility tree, gives the group real arrow-key
 * behaviour, and lets `peer-checked:` do the styling with no JavaScript.
 *
 * Every field is 48px tall at minimum. That is above WCAG 2.5.8's 24px floor and is
 * the number that matters for the actual use case (§30): someone standing in a nets
 * session photographing a broken bat on a phone. */

/* ── Shared strings ──
 * Constants rather than a CSS class because they are Tailwind utilities that need to
 * compose with per-field state, and constants rather than repetition because the focus
 * treatment appears on twenty-odd controls and has to be identical on all of them. */

const FIELD_BASE =
  "w-full rounded-lg border bg-white/[0.04] px-4 text-[15px] text-white placeholder:text-white/30 " +
  "transition-[border-color,box-shadow] duration-200 outline-none " +
  "focus:border-expert/70 focus:shadow-[0_0_0_3px_rgba(216,180,106,0.14)]";

const FIELD_OK = "border-white/12 hover:border-white/20";
const FIELD_BAD =
  "border-danger/60 focus:border-danger focus:shadow-[0_0_0_3px_rgba(201,86,74,0.16)]";

interface FieldShellProps {
  id: string;
  label: string;
  /** Rendered next to the label. Used for the handful of genuinely optional fields, so
   *  a customer can tell at a glance what they can skip (§12, §17). */
  optional?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/** Label + control + hint + error, wired together. The wiring is the point: `hint` and
 *  `error` both get ids and both land in `aria-describedby`, so a screen reader reads
 *  the guidance and the problem rather than announcing a bare "edit text". */
function FieldShell({
  id,
  label,
  optional,
  hint,
  error,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <label
        htmlFor={id}
        className="flex flex-wrap items-baseline gap-x-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-white/70"
      >
        {label}
        {optional && (
          <span className="text-[11px] font-medium normal-case tracking-normal text-white/35">
            optional
          </span>
        )}
      </label>

      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] leading-snug text-white/45">
          {hint}
        </p>
      )}

      <div className="mt-2">{children}</div>

      {/* `role="alert"` so a message that appears after a failed Continue is announced
          without the customer having to go looking for it. */}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-[13px] leading-snug text-danger"
        >
          {/* A glyph as well as the colour, for the same reason the option cards carry
              a tick: red alone is not a message. */}
          <span aria-hidden="true" className="mt-px font-semibold">
            !
          </span>
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

/* ── Text input ── */

interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  type?: "text" | "tel" | "email" | "date";
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  maxLength?: number;
  className?: string;
}

export function TextInput({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  optional,
  type = "text",
  autoComplete,
  inputMode,
  maxLength,
  className,
}: TextInputProps) {
  const id = useId();

  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        // `autoComplete` is what turns the address step from nine fields of typing
        // into two taps on a phone that already knows the customer's address — the
        // single biggest thing that can be done for §31's "minimal typing".
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(FIELD_BASE, "h-12", error ? FIELD_BAD : FIELD_OK)}
      />
    </FieldShell>
  );
}

/* ── Textarea ── */

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  rows?: number;
  maxLength?: number;
  className?: string;
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  optional,
  rows = 4,
  maxLength = 2000,
  className,
}: TextAreaProps) {
  const id = useId();

  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cn(
          FIELD_BASE,
          "resize-y py-3 leading-relaxed",
          error ? FIELD_BAD : FIELD_OK,
        )}
      />
    </FieldShell>
  );
}

/* ── Option group ──
 * Radio semantics, card presentation. `columns` exists because the same control has to
 * serve a three-way yes/no/not-sure and a five-way service picker with a second line
 * of explanation, and forcing both into one grid makes one of them wrong. */

interface OptionGroupProps {
  label: string;
  options: BatDoctorOption[];
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  optional?: boolean;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function OptionGroup({
  label,
  options,
  value,
  onChange,
  hint,
  error,
  optional,
  columns = 2,
  className,
}: OptionGroupProps) {
  const groupId = useId();
  const labelId = `${groupId}-label`;

  return (
    <div className={cn("min-w-0", className)}>
      <p
        id={labelId}
        className="flex flex-wrap items-baseline gap-x-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-white/70"
      >
        {label}
        {optional && (
          <span className="text-[11px] font-medium normal-case tracking-normal text-white/35">
            optional
          </span>
        )}
      </p>

      {hint && (
        <p id={`${groupId}-hint`} className="mt-1.5 text-[13px] leading-snug text-white/45">
          {hint}
        </p>
      )}

      {/* A real radiogroup, so arrow keys move between options and the group is
          announced once with its label rather than as N unrelated controls. */}
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-describedby={describedBy(groupId, hint, error)}
        aria-invalid={error ? true : undefined}
        className={cn(
          "mt-2 grid gap-2",
          // One column on a phone whenever the options carry a second line — two
          // columns of wrapped explanatory text at 320px is unreadable.
          columns === 1 && "grid-cols-1",
          columns === 2 && "grid-cols-1 sm:grid-cols-2",
          columns === 3 && "grid-cols-2 sm:grid-cols-3",
        )}
      >
        {options.map((option) => {
          const selected = value === option.value;

          return (
            <label
              key={option.value}
              className={cn(
                "group/opt relative flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-3",
                "transition-[border-color,background-color,box-shadow] duration-200",
                selected
                  ? "border-expert/55 bg-accent-muted shadow-[inset_0_1px_0_0_rgba(216,180,106,0.22)]"
                  : cn(
                      "bg-white/[0.03]",
                      error ? "border-danger/45" : "border-white/10 hover:border-white/20",
                    ),
                // The focus ring lives on the label because the input itself is
                // `sr-only`; `peer-focus-visible` is what carries it across.
                "has-[:focus-visible]:border-expert/70 has-[:focus-visible]:shadow-[0_0_0_3px_rgba(216,180,106,0.16)]",
              )}
            >
              <input
                type="radio"
                name={groupId}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />

              {/* The non-colour half of the selection signal. */}
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selected
                    ? "border-expert bg-expert text-[#171410]"
                    : "border-white/25 bg-transparent",
                )}
              >
                {selected && <Check className="size-3" strokeWidth={3} />}
              </span>

              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-[14px] font-medium leading-snug",
                    selected ? "text-white" : "text-white/80",
                  )}
                >
                  {option.label}
                </span>
                {option.hint && (
                  <span className="mt-0.5 block text-[12.5px] leading-snug text-white/45">
                    {option.hint}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <p
          id={`${groupId}-error`}
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-[13px] leading-snug text-danger"
        >
          <span aria-hidden="true" className="mt-px font-semibold">
            !
          </span>
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Select ──
 * Kept for the one case a radio grid is the wrong shape: the eight-brand list, where
 * cards would take a third of the step's height to say something the customer already
 * knows. A native `<select>` also gets the platform's own picker on a phone, which is
 * faster than anything drawn in HTML.
 *
 * The one thing it needs is `appearance-none` plus an explicit dark `option` colour —
 * without it the dropdown list renders in the OS default light palette and is the one
 * place a white SaaS form leaks into this page (§32). */

interface SelectInputProps {
  label: string;
  options: BatDoctorOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
}

export function SelectInput({
  label,
  options,
  value,
  onChange,
  placeholder = "Choose one",
  hint,
  error,
  optional,
  className,
}: SelectInputProps) {
  const id = useId();

  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cn(
            FIELD_BASE,
            "h-12 cursor-pointer appearance-none pr-10",
            value ? "text-white" : "text-white/40",
            error ? FIELD_BAD : FIELD_OK,
          )}
        >
          <option value="" disabled className="bg-surface text-white/50">
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-surface text-white">
              {option.label}
            </option>
          ))}
        </select>

        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40"
        >
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path
              d="M1 1.5 6 6.5l5-5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </FieldShell>
  );
}

/* ── Section label inside a step ──
 * A step can hold three logical groups (the bat, its age, how it is used) and needs to
 * separate them without three `<h3>`s competing with the step's own heading. */
export function FieldGroup({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="eyebrow mb-4">{title}</legend>
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

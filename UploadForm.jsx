import { useMemo, useRef, useState, useId } from 'react';
import {
  RULES,
  KNOWN_EXECUTORS,
  FIELD_HELP,
  validateUpload,
  summarizeErrors,
  firstInvalidField,
  descriptionProgress,
} from './uploadValidation';

const TAG_OPTIONS = [
  'ESP', 'Auto Farm', 'Aim Assist', 'Teleport', 'Fly', 'Speed',
  'Coin Collect', 'Combat', 'GUI', 'Loader', 'Universal',
];

const EMPTY = {
  title: '',
  gameName: '',
  description: '',
  tags: [],
  executors: [],
  source: '',
  keySystem: false,
};

export default function UploadForm({ onSubmit }) {
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [showSummary, setShowSummary] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const fieldRefs = useRef({});
  const summaryRef = useRef(null);
  const formId = useId();

  const { valid, errors, cleaned } = useMemo(() => validateUpload(form), [form]);
  const desc = descriptionProgress(form.description);
  const summary = summarizeErrors(errors);

  const register = (key) => (node) => {
    if (node) fieldRefs.current[key] = node;
  };

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setServerError(null);
  };

  const toggle = (key, value) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  const blur = (key) => setTouched((t) => ({ ...t, [key]: true }));
  const errorFor = (key) => ((touched[key] || showSummary) && errors[key] ? errors[key] : null);

  /** Scrolls the field into view and drops the cursor in it. */
  function jumpTo(field) {
    const node = fieldRefs.current[field];
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      if (typeof node.focus === 'function') node.focus({ preventScroll: true });
    }, 320);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ title: true, description: true, tags: true, executors: true, source: true });

    if (!valid) {
      setShowSummary(true);
      const target = firstInvalidField(errors);
      window.requestAnimationFrame(() => {
        summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        summaryRef.current?.focus({ preventScroll: true });
        if (target) window.setTimeout(() => jumpTo(target), 500);
      });
      return;
    }

    setShowSummary(false);
    setSubmitting(true);
    try {
      await onSubmit(cleaned);
      setForm(EMPTY);
      setTouched({});
    } catch (err) {
      setServerError(err?.message || 'Upload failed. Try again.');
      window.requestAnimationFrame(() =>
        summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <div ref={summaryRef} tabIndex={-1} aria-live="assertive" className="outline-none">
        {showSummary && summary.length > 0 && (
          <ErrorSummary items={summary} onJump={jumpTo} />
        )}
        {serverError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
            {serverError}
          </div>
        )}
      </div>

      <Field
        id={`${formId}-title`}
        label="Title"
        required
        help={FIELD_HELP.title}
        error={errorFor('title')}
      >
        {(a11y) => (
          <input
            {...a11y}
            ref={register('title')}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            onBlur={() => blur('title')}
            maxLength={RULES.TITLE_MAX}
            placeholder="Murder Mystery 2 — Coin Farm + ESP"
            className={inputClass(errorFor('title'))}
          />
        )}
      </Field>

      <Field id={`${formId}-game`} label="Game" help={FIELD_HELP.gameName}>
        {(a11y) => (
          <input
            {...a11y}
            value={form.gameName}
            onChange={(e) => set('gameName', e.target.value)}
            placeholder="Murder Mystery 2"
            className={inputClass(null)}
          />
        )}
      </Field>

      <Field
        id={`${formId}-description`}
        label="Description"
        required
        help={FIELD_HELP.description}
        error={errorFor('description')}
        hint={desc.met ? `${desc.length}/${RULES.DESCRIPTION_MAX}` : `${desc.remaining} more needed`}
        hintTone={desc.met ? 'ok' : 'pending'}
      >
        {(a11y) => (
          <>
            <textarea
              {...a11y}
              ref={register('description')}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              onBlur={() => blur('description')}
              rows={4}
              placeholder="Farms coins automatically and highlights the murderer through walls. Tested on Cosmic and Delta, no key needed."
              className={inputClass(errorFor('description'))}
            />
            <ProgressBar value={desc.length} min={RULES.DESCRIPTION_MIN} />
          </>
        )}
      </Field>

      <Field
        id={`${formId}-tags`}
        label="Tags"
        required
        help={FIELD_HELP.tags}
        error={errorFor('tags')}
        hint={`${form.tags.length} selected`}
        hintTone={form.tags.length >= RULES.TAGS_MIN ? 'ok' : 'pending'}
      >
        {(a11y) => (
          <ChipGroup
            {...a11y}
            groupRef={register('tags')}
            options={TAG_OPTIONS}
            selected={form.tags}
            onToggle={(v) => {
              toggle('tags', v);
              blur('tags');
            }}
            tone="sky"
            invalid={Boolean(errorFor('tags'))}
          />
        )}
      </Field>

      <Field
        id={`${formId}-executors`}
        label="Tested executors"
        required
        help={FIELD_HELP.executors}
        error={errorFor('executors')}
        hint={`${form.executors.length} of ${RULES.EXECUTORS_MIN} minimum`}
        hintTone={form.executors.length >= RULES.EXECUTORS_MIN ? 'ok' : 'pending'}
      >
        {(a11y) => (
          <ChipGroup
            {...a11y}
            groupRef={register('executors')}
            options={KNOWN_EXECUTORS}
            selected={form.executors}
            onToggle={(v) => {
              toggle('executors', v);
              blur('executors');
            }}
            tone="violet"
            invalid={Boolean(errorFor('executors'))}
          />
        )}
      </Field>

      <Field
        id={`${formId}-source`}
        label="Script"
        required
        help={FIELD_HELP.source}
        error={errorFor('source')}
        hint={form.source.trim() ? `${form.source.length.toLocaleString()} characters` : 'Empty'}
        hintTone={form.source.trim().length >= RULES.SOURCE_MIN ? 'ok' : 'pending'}
      >
        {(a11y) => (
          <textarea
            {...a11y}
            ref={register('source')}
            value={form.source}
            onChange={(e) => set('source', e.target.value)}
            onBlur={() => blur('source')}
            rows={10}
            spellCheck={false}
            placeholder={'loadstring(game:HttpGet("https://..."))()'}
            className={`${inputClass(errorFor('source'))} bg-slate-900 font-mono text-[13px] text-emerald-300 placeholder:text-slate-600`}
          />
        )}
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.keySystem}
          onChange={(e) => set('keySystem', e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        This script has a key system
      </label>

      <button
        type="submit"
        disabled={submitting}
        aria-describedby={summary.length ? `${formId}-summary` : undefined}
        className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Uploading…' : 'Publish script'}
      </button>

      {!valid && (
        <p className="-mt-2 text-center text-xs text-slate-400">
          {summary.length} field{summary.length === 1 ? '' : 's'} still need
          {summary.length === 1 ? 's' : ''} attention
        </p>
      )}
    </form>
  );
}

function ErrorSummary({ items, onJump }) {
  return (
    <div
      role="alert"
      className="mb-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
    >
      <p className="text-sm font-bold text-rose-900">
        Can&apos;t publish yet — {items.length} field{items.length === 1 ? '' : 's'} need
        {items.length === 1 ? 's' : ''} fixing:
      </p>
      <ul className="mt-2 flex flex-col gap-1">
        {items.map(({ field, label, message }) => (
          <li key={field}>
            <button
              type="button"
              onClick={() => onJump(field)}
              className="text-left text-sm text-rose-800 underline decoration-rose-300 underline-offset-2 hover:decoration-rose-700"
            >
              <span className="font-semibold">{label}</span> — {message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Field({ id, label, required, help, error, hint, hintTone = 'pending', children }) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = [help && helpId, error && errorId].filter(Boolean).join(' ') || undefined;

  const a11y = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    'aria-required': required || undefined,
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold text-slate-900">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
        {hint && (
          <span className={`shrink-0 text-xs font-medium ${hintTone === 'ok' ? 'text-emerald-600' : 'text-slate-400'}`}>
            {hint}
          </span>
        )}
      </div>

      {typeof children === 'function' ? children(a11y) : children}

      {help && !error && (
        <p id={helpId} className="text-xs text-slate-500">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1 text-xs font-semibold text-rose-600">
          <span aria-hidden="true">⚠</span>
          <span>
            {error} <span className="font-normal text-rose-500">{help}</span>
          </span>
        </p>
      )}
    </div>
  );
}

function ChipGroup({ options, selected, onToggle, tone, invalid, groupRef, id, ...a11y }) {
  const active =
    tone === 'violet'
      ? 'border-violet-500 bg-violet-500 text-white'
      : 'border-sky-500 bg-sky-500 text-white';

  return (
    <div
      {...a11y}
      id={id}
      ref={groupRef}
      role="group"
      tabIndex={-1}
      className={`flex flex-wrap gap-1.5 rounded-lg p-1 outline-none transition ${
        invalid ? 'bg-rose-50 ring-1 ring-rose-300' : ''
      }`}
    >
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(opt)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              on ? active : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function ProgressBar({ value, min }) {
  const pct = Math.min(100, (value / min) * 100);
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className={`h-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-sky-400'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function inputClass(error) {
  return `w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 ${
    error
      ? 'border-rose-400 bg-rose-50/40 focus:ring-rose-200'
      : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100'
  }`;
}

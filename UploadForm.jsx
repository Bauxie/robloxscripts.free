import { useMemo, useState } from 'react';
import {
  RULES,
  KNOWN_EXECUTORS,
  validateUpload,
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
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const { valid, errors, cleaned } = useMemo(() => validateUpload(form), [form]);
  const desc = descriptionProgress(form.description);

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
  const errorFor = (key) => (touched[key] ? errors[key] : null);

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ title: true, description: true, tags: true, executors: true, source: true });
    if (!valid) return;

    setSubmitting(true);
    try {
      await onSubmit(cleaned);
      setForm(EMPTY);
      setTouched({});
    } catch (err) {
      setServerError(err?.message || 'Upload failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-6">
      <Field label="Title" required error={errorFor('title')}>
        <input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          onBlur={() => blur('title')}
          maxLength={RULES.TITLE_MAX}
          placeholder="Murder Mystery 2 — Coin Farm + ESP"
          className={inputClass(errorFor('title'))}
        />
      </Field>

      <Field label="Game" error={null} hint="Leave blank for universal scripts">
        <input
          value={form.gameName}
          onChange={(e) => set('gameName', e.target.value)}
          placeholder="Murder Mystery 2"
          className={inputClass(null)}
        />
      </Field>

      <Field
        label="Description"
        required
        error={errorFor('description')}
        hint={
          desc.met
            ? `${desc.length}/${RULES.DESCRIPTION_MAX}`
            : `${desc.remaining} more character${desc.remaining === 1 ? '' : 's'} required`
        }
        hintTone={desc.met ? 'ok' : 'pending'}
      >
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          onBlur={() => blur('description')}
          rows={4}
          placeholder="What does it do, what executor did you test it on, any setup needed?"
          className={inputClass(errorFor('description'))}
        />
        <ProgressBar value={desc.length} min={RULES.DESCRIPTION_MIN} />
      </Field>

      <Field
        label="Tags"
        required
        error={errorFor('tags')}
        hint={`${form.tags.length} selected · minimum ${RULES.TAGS_MIN}`}
        hintTone={form.tags.length >= RULES.TAGS_MIN ? 'ok' : 'pending'}
      >
        <ChipGroup
          options={TAG_OPTIONS}
          selected={form.tags}
          onToggle={(v) => {
            toggle('tags', v);
            blur('tags');
          }}
          tone="sky"
        />
      </Field>

      <Field
        label="Tested executors"
        required
        error={errorFor('executors')}
        hint={`${form.executors.length} selected · minimum ${RULES.EXECUTORS_MIN}`}
        hintTone={form.executors.length >= RULES.EXECUTORS_MIN ? 'ok' : 'pending'}
      >
        <ChipGroup
          options={KNOWN_EXECUTORS}
          selected={form.executors}
          onToggle={(v) => {
            toggle('executors', v);
            blur('executors');
          }}
          tone="violet"
        />
      </Field>

      <Field
        label="Script"
        required
        error={errorFor('source')}
        hint={form.source.trim() ? `${form.source.length.toLocaleString()} characters` : 'Required'}
        hintTone={form.source.trim().length >= RULES.SOURCE_MIN ? 'ok' : 'pending'}
      >
        <textarea
          value={form.source}
          onChange={(e) => set('source', e.target.value)}
          onBlur={() => blur('source')}
          rows={10}
          spellCheck={false}
          placeholder={'loadstring(game:HttpGet("https://..."))()'}
          className={`${inputClass(errorFor('source'))} bg-slate-900 font-mono text-[13px] text-emerald-300 placeholder:text-slate-600`}
        />
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

      {serverError && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={!valid || submitting}
        className="rounded-xl bg-sky-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {submitting ? 'Uploading…' : valid ? 'Publish script' : `${Object.keys(errors).length} field${Object.keys(errors).length === 1 ? '' : 's'} left`}
      </button>
    </form>
  );
}

function Field({ label, required, error, hint, hintTone = 'pending', children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-bold text-slate-900">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
        {hint && (
          <span
            className={`text-xs font-medium ${
              hintTone === 'ok' ? 'text-emerald-600' : 'text-slate-400'
            }`}
          >
            {hint}
          </span>
        )}
      </div>
      {children}
      {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
    </div>
  );
}

function ChipGroup({ options, selected, onToggle, tone }) {
  const active =
    tone === 'violet'
      ? 'border-violet-500 bg-violet-500 text-white'
      : 'border-sky-500 bg-sky-500 text-white';
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
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
      ? 'border-rose-400 focus:ring-rose-200'
      : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100'
  }`;
}

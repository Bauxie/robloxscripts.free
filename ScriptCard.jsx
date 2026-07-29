import { normalizePost } from './cardFallbacks';

/**
 * Card that never renders a dead row.
 * Blank description -> derived sentence. Zero stats -> freshness chip.
 * No thumbnail -> seeded gradient. Leftover vertical space -> code preview.
 */
export default function ScriptCard({ post, onOpen }) {
  const p = normalizePost(post);
  const thumb = typeof p.thumbnail === 'string' ? null : p.thumbnail;

  return (
    <article
      onClick={() => onOpen?.(p.id)}
      className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div
        className="relative flex h-40 items-center justify-center bg-slate-900"
        style={thumb ? { background: thumb.background } : undefined}
      >
        {typeof p.thumbnail === 'string' ? (
          <img src={p.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="text-4xl font-black tracking-tight text-white/85">{thumb.initials}</span>
        )}

        <div className="absolute inset-x-3 top-3 flex justify-between">
          {p.gameName && <Pill tone="light">{p.gameName}</Pill>}
          {p.keySystem && <Pill tone="warn">🔑 Key System</Pill>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-lg font-bold leading-snug text-slate-900">{p.title}</h3>

        <p
          className={
            p.descriptionIsDerived
              ? 'text-sm leading-relaxed text-slate-500'
              : 'text-sm leading-relaxed text-slate-700'
          }
        >
          {p.description}
        </p>

        {p.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {p.features.map((f) => (
              <Pill key={f} tone="feature">
                {f}
              </Pill>
            ))}
          </div>
        )}

        {p.codePreview && (
          <pre className="overflow-hidden rounded-lg bg-slate-900 px-3 py-2 font-mono text-[11px] leading-relaxed text-emerald-300">
            {p.codePreview.join('\n')}
          </pre>
        )}

        {p.gameName && (
          <a
            href={`/game/${slug(p.gameName)}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-sky-600 hover:underline"
          >
            More {p.gameName} scripts →
          </a>
        )}

        <div className="mt-auto flex items-center gap-2 border-t border-dashed border-slate-200 pt-3 text-xs text-slate-500">
          <img
            src={p.authorAvatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(p.author || 'anon')}`}
            alt=""
            className="h-5 w-5 rounded-full"
          />
          <span className="font-medium text-slate-700">@{(p.author || 'anonymous').replace(/^@/, '')}</span>
          {p.metrics && (
            <span className="text-slate-400">
              · {p.metrics.isLoader ? 'loader' : `${p.metrics.lineCount} lines`} · {p.metrics.sizeLabel}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {p.stats.map((s) => (
            <Pill key={s.key} tone="stat">
              {s.icon} {s.label}
            </Pill>
          ))}
        </div>
      </div>
    </article>
  );
}

const TONES = {
  light: 'bg-white/95 text-slate-800 shadow',
  warn: 'bg-amber-100 text-amber-900 shadow',
  feature: 'border border-sky-200 bg-sky-50 text-sky-700',
  stat: 'border border-slate-200 bg-slate-50 text-slate-600',
};

function Pill({ tone = 'stat', children }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONES[tone]}`}>{children}</span>
  );
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

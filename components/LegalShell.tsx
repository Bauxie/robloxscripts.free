import Link from "next/link";

export default function LegalShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="app">
      <Link href="/" className="back-link">
        ← Home
      </Link>
      <article className="panel legal-doc">
        <div className="section-head" style={{ marginTop: 0 }}>
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>
        <div className="legal-body">{children}</div>
      </article>
    </main>
  );
}

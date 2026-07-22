import Script from "next/script";

/** Loads AdSense only when NEXT_PUBLIC_ADSENSE_CLIENT is set (e.g. ca-pub-xxxxxxxx). */
export default function AdSenseLoader() {
  const client = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "").trim();
  if (!client) return null;

  return (
    <Script
      id="adsense-loader"
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`}
      crossOrigin="anonymous"
    />
  );
}

import Script from "next/script";

export const ADSENSE_CLIENT =
  (process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-9808155078584354").trim();

/** AdSense site-wide loader — must sit in <head> of the root layout. */
export default function AdSenseLoader() {
  if (!ADSENSE_CLIENT) return null;

  return (
    <Script
      id="adsense-loader"
      async
      strategy="beforeInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_CLIENT)}`}
      crossOrigin="anonymous"
    />
  );
}

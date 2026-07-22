import Script from "next/script";

const GA_ID = "G-FPKWBYCHHQ";

/** Single Google Analytics (gtag) install for the whole site — used only in root layout. */
export default function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');
`}
      </Script>
    </>
  );
}

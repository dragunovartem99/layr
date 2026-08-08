# Chrome Web Store listing

Title: Layr — dataLayer Inspector for GTM & GA4

Layr is a dataLayer inspector that lives in the Chrome side panel, built for
developers and analytics engineers who spend their day verifying Google Tag
Manager and GA4 tracking.

Open it on any page and you see every window.dataLayer.push() call as it
happens — event name, timestamp and the full payload — next to the page
instead of buried in a console.

WHY A SIDE PANEL

Because tag debugging is a side-by-side job. You click through a checkout, a
form, a product listing — and watch the events land in real time without
DevTools stealing half your screen or a preview mode changing how the page
behaves.

WHAT IT DOES

• Nothing gets missed — Layr hooks the dataLayer before the page runs, so the
pushes that fire on page load are already waiting for you when you open the
panel.
• Live capture — new events stream in as you interact with the page.
• Full payloads — expand any row for pretty-printed JSON, no truncation, no
[object Object].
• Search everything — filter across event names and payload contents, with
matches highlighted in place.
• One-click copy — grab any payload as JSON for a ticket, a spec or a diff.
• Survives soft navigations — SPA route changes keep the log intact; a real
page load clears it.
• Adjustable text size — bump the font for screen sharing or pairing.

WORKS WITH

Any site that uses a dataLayer array — Google Tag Manager, GA4, Adobe,
Tealium, or a hand-rolled implementation. No GTM container access, no preview
mode, no account required.

PRIVACY

Everything stays in your browser. Layr makes no network requests, has no
analytics, no accounts and no remote code. It reads your dataLayer to render
it, and that is all. Permissions are limited to the side panel and local
storage.

OPEN SOURCE

Source and issue tracker: https://github.com/dragunovartem99/layr

---
'@akli-dev/ui': minor
---

`Image` now forwards undeclared native `<img>` props (`id`, `width`, `height`, `data-*`, …) and merges a `style` prop with its own object-fit styles. `onLoad` and `onError` receive the native event. A changed `src` now resets the image to its loading state instead of keeping the previous image or error. The blur placeholder URL is valid for a `src` that already has a query string. Lazy images render immediately with native `loading="lazy"` instead of waiting for an IntersectionObserver, and `lazy={false}` now renders `loading="eager"`.

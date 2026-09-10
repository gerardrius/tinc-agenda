// pdfjs-dist (used by pdf-parse) polyfills DOMMatrix/ImageData/Path2D from
// @napi-rs/canvas when it can't find a browser DOM — but Vercel's function
// bundler doesn't trace that optional, conditionally-required dependency
// into the deployed function, so pdfjs-dist crashes the whole process on
// import instead of just warning. We only ever call getText() (no
// rendering), so these never need to do anything real — importing this
// file first (before "pdf-parse") satisfies pdfjs-dist's load-time check
// without needing the native canvas package at all.
if (typeof globalThis.DOMMatrix === "undefined") globalThis.DOMMatrix = class DOMMatrix {};
if (typeof globalThis.ImageData === "undefined") globalThis.ImageData = class ImageData {};
if (typeof globalThis.Path2D === "undefined") globalThis.Path2D = class Path2D {};

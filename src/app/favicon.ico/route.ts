const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="16" fill="#213f32"/>
  <text x="32" y="41" text-anchor="middle" font-family="Georgia,serif" font-size="25" font-weight="700" fill="#f4f0e5">FP</text>
</svg>`;

export function GET() {
  return new Response(favicon, {
    headers: {
      "Cache-Control": "public, max-age=604800, immutable",
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}

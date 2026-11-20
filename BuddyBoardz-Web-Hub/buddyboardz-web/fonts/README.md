# Local fonts

Place the properly licensed font files in this directory using these exact names:

- `AgravePro.ttf` — primary interface and body typeface
- `Asimovian.ttf` — display/accent typeface

The website references these files locally through `@font-face`; it does not request Google Fonts or another font CDN. The font files themselves were not present in the supplied project assets, so add them here before expecting those exact typefaces to render offline. Until then, the CSS uses local system fallbacks.

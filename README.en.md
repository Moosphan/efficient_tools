<p align="center">
  <h1 align="center">⚡ Efficient Tools</h1>
  <p align="center">A comprehensive collection of developer efficiency tools</p>
  <p align="center">
    <img src="https://img.shields.io/badge/tools-53+-blue?style=flat-square" alt="tools" />
    <img src="https://img.shields.io/badge/deps-0-brightgreen?style=flat-square" alt="deps" />
    <img src="https://img.shields.io/badge/data-local%20only-ff69b4?style=flat-square" alt="privacy" />
    <img src="https://img.shields.io/badge/license-CC--BY--NC--SA--4.0-orange?style=flat-square" alt="license" />
  </p>
</p>

> **All tools run entirely in your browser. No data ever leaves your device.** A one-stop collection of encoding, formatting, text processing, security, and network debugging tools — zero ads, responsive, bilingual (Chinese/English).

---

## Why Efficient Tools?

Most online developer tool sites are cluttered with ads, trackers, and privacy concerns. Efficient Tools takes a different approach:

| Feature | Efficient Tools | Typical Tool Sites |
|---------|----------------|-------------------|
| **Privacy** | 100% local processing | Data sent to servers |
| **Ads** | Zero | Banner/pop-up ads |
| **Bilingual** | Full CN/EN support | Usually single language |
| **Mobile** | Fully responsive | Often broken on mobile |
| **Open Source** | MIT-licensed code | Proprietary |
| **Offline** | Works after first load | Requires connection |

---

## Tool Catalog

### Encoding & Decoding (7 tools)

| Tool | Description |
|------|-------------|
| **Base64/Base32 Codec** | Encode/decode text with URL-safe format support |
| **URL Codec** | URL encode/decode with automatic query parameter parsing |
| **Unicode Codec** | Convert between characters and \uXXXX / U+XXXX / HTML entities |
| **Hex Codec** | Hex ↔ text/bytes conversion with DEC/BIN byte preview |
| **HTML Entity Codec** | HTML entity encode/decode, 30+ named entities |
| **QR Code Tool** | Generate/decode QR codes with 8 themes, gradient colors, logo embedding |
| **Barcode Generator** | Code128/EAN-13/UPC-A/ITF-14 and more, PNG/SVG export |

### Formatting & Conversion (14 tools)

| Tool | Description |
|------|-------------|
| **JSON Formatter** | Format, minify, and validate JSON with syntax error detection |
| **YAML Formatter** | YAML beautify, minify, validate, convert to JSON |
| **TOML Formatter** | TOML format, validate, convert to JSON |
| **XML Formatter** | XML beautify, minify, convert to JSON |
| **SQL Formatter** | SQL statement beautify/minify with keyword uppercase |
| **GraphQL Formatter** | GraphQL query/mutation beautify and minify |
| **JSON Schema Validator** | Validate JSON data against JSON Schema (powered by ajv) |
| **JSON ↔ CSV Converter** | Bidirectional conversion with nested object flattening |
| **Timestamp Converter** | Unix timestamp ↔ date, seconds/milliseconds, relative time |
| **Base Converter** | Binary/Octal/Decimal/Hex conversion with grouped display |
| **Unit Converter** | Length/Weight/Temperature/Storage/Speed/Area — 30+ units |

### Text Processing (11 tools)

| Tool | Description |
|------|-------------|
| **Regex Tester** | Real-time match highlighting, capture groups, structure visualization |
| **Text Diff** | Line/character-level diff with side-by-side and inline views |
| **Markdown Preview** | Live rendering with code highlighting, PDF/HTML export |
| **Text Editor** | 5-in-1: Case convert, Sort/Dedup, Find/Replace, Escape, Align |
| **Text Statistics** | Characters, words, lines, sentences, reading time, char frequency |
| **CSV Viewer** | Table preview with sort, filter, and JSON export |
| **Emoji Browser** | 1911 emojis searchable by keyword, platform rendering differences |
| **Lorem Ipsum Generator** | Latin and Chinese placeholder text, paragraph/sentence/word modes |
| **ASCII Art Text** | 6 font styles: Standard, Slant, Banner, Small, Big, Block |
| **Character Reference** | ASCII/Unicode table lookup, reverse character encoding search |

### Security & Encryption (7 tools)

| Tool | Description |
|------|-------------|
| **JWT Decoder** | Decode JWT tokens showing Header/Payload/Signature with expiry |
| **2FA Authenticator** | TOTP-based code generation with multi-account support |
| **Password Generator** | Customizable length/charset, entropy-based strength indicator |
| **Hash Generator** | MD5/SHA-1/SHA-256/SHA-512 with HEX/Base64 output |
| **HMAC Calculator** | HMAC-SHA1/256/384/512 with configurable secret key |
| **X.509 Parser** | Parse PEM certificates, view validity, issuer, version |
| **Text Cipher** | ROT13, Caesar, Morse, Braille, Upside-down, Emoji encoding |

### Developer Tools (14 tools)

| Tool | Description |
|------|-------------|
| **UUID Generator** | v4/v7 UUID batch generation with custom format options |
| **Cron Parser** | Cron to natural language, next 5 run times preview |
| **Log Analyzer** | Filter by level/keyword, auto-detect logcat and standard formats |
| **Token Counter** | Estimate tokens for GPT/Claude/DeepSeek, multi-model cost comparison |
| **TypeScript Type Gen** | Auto-generate TypeScript interfaces from JSON data |
| **Mock API Generator** | Define endpoints → generate MSW/json-server/fetch-mock code + test data |
| **Color Converter** | HEX/RGB/HSL/oklch conversion with WCAG contrast check |
| **Color Palette** | 6 harmony modes, tints/shades, CSS variable export |
| **DNS Lookup** | Google DNS-over-HTTPS, 10 record types (A/MX/TXT/NS/...) |
| **WHOIS Lookup** | RDAP protocol with 15+ TLD-specific fallback servers |
| **IP Geolocation** | ipinfo.io API — country/region/city/ASN/ISP, Google Maps link |
| **World Clock** | 25 global cities, real-time with customizable city list |

### System Tools (1 tool)

| Tool | Description |
|------|-------------|
| **ADB Automation** | Common ADB commands for device management, app install, log capture |

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/moosphon/efficient-tools.git
cd efficient-tools

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Architecture

```
src/
├── features/                  # 53 tool pages (one directory per tool)
│   ├── json-formatter/
│   ├── regex-tester/
│   ├── base64-codec/
│   └── ... (50 more)
├── shared/
│   ├── context/
│   │   └── I18nContext.tsx    # i18n system (Chinese + English)
│   ├── components/
│   │   └── HelpSection.tsx    # Shared help section component
│   └── hooks/
├── shell/
│   ├── Layout.tsx             # Global layout with nav
│   ├── HomePage.tsx           # Tool grid with search/filter
│   └── ToolShell.tsx          # Tool page wrapper
├── styles/
│   ├── layout.css             # Layout and grid styles
│   └── components.css         # Component styles
├── registry.ts                # Tool registry (auto-generates routes)
└── App.tsx                    # Router entry point
```

---

## Internationalization

All 53 tool pages fully support Chinese and English:

- **Auto-detect**: First visit selects language based on browser timezone (Chinese for Asia/Shanghai, Asia/Taipei, etc.)
- **Manual toggle**: One-click switch via navbar language button
- **Complete coverage**: Tool titles, buttons, placeholders, help sections, parameter descriptions — all bilingual
- **Smart formatting**: Cron expressions, timestamps, and date displays adapt to the selected locale

---

## Roadmap

- [ ] **Tool Workflows** — Chain multiple tools (e.g., Base64 decode → JSON format → JSONPath query)
- [ ] **PWA Offline** — Fully offline-capable after first load
- [ ] **Theme System** — Light/dark mode toggle with custom accent colors
- [ ] **Favorites** — Pin frequently used tools for quick access
- [ ] **More Tools** — See [TOOLS_ANALYSIS.md](./TOOLS_ANALYSIS.md) for 40+ additional tool ideas

---

## Contributing

Contributions are welcome! To add a new tool:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-tool`
3. Create a directory under `src/features/your-tool/`
4. Follow the existing tool pattern:
   - Use `ToolShell` wrapper for consistent layout
   - Import `useI18n` / `useToolI18n` for i18n support
   - Add `HelpSection` with features, usage, and parameters
   - Register in `src/registry.ts`
   - Add translations to `src/shared/context/I18nContext.tsx`
5. Submit a Pull Request

---

## License

[CC BY-NC-SA 4.0](./LICENSE) — Attribution-NonCommercial-ShareAlike 4.0 International

You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material

Under the following terms:
- **Attribution** — You must give appropriate credit
- **NonCommercial** — You may not use the material for commercial purposes
- **ShareAlike** — If you remix, you must distribute under the same license

<p align="center">
  <br/>
  <img src="./public/favicon.svg" width="64" alt="logo" />
  <h1 align="center">Efficient Tools</h1>
  <p align="center">A privacy-first, open-source developer toolkit that runs entirely in your browser.</p>
  <p align="center">
    <img src="https://img.shields.io/badge/tools-60+-blue?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTkgMTJsMyAzIDMtMyIvPjxwYXRoIGQ9Im0xMiA2LTMgMy0zLTMiLz48L3N2Zz4=" />
    <img src="https://img.shields.io/badge/privacy-local%20only-22c55e?style=flat-square" />
    <img src="https://img.shields.io/badge/ads-none-22c55e?style=flat-square" />
    <img src="https://img.shields.io/badge/license-CC--BY--NC--SA--4.0-orange?style=flat-square" />
    <img src="https://img.shields.io/badge/i18n-zh%20%7C%20en-blue?style=flat-square" />
  </p>
  <p align="center">
    <a href="./README.zh.md">中文文档</a>
  </p>
</p>

<br/>

**All data processing happens locally in your browser. Nothing is sent to any server.** 60+ tools for encoding, formatting, text processing, security, networking, and more — zero ads, zero tracking, fully responsive, bilingual (Chinese / English).

## Highlights

- **Privacy-first** — every tool runs client-side; your data never leaves the device
- **Zero ads, zero trackers** — clean UI focused on productivity
- **60+ tools** — encoding, formatting, text, security, network, dev utilities, image, generators
- **Bilingual** — full Chinese and English support, auto-detected by timezone
- **Responsive** — works on desktop and mobile
- **Lightweight** — pure frontend, no backend, code-split per tool

## Quick Start

```bash
git clone https://github.com/moosphon/efficient-tools.git
cd efficient-tools
npm install
npm run dev
```

## Tools

| Category | Tools |
|----------|-------|
| **Encoding / Decoding** | Base64, URL, Unicode, Hex, HTML Entity, QR Code, Barcode |
| **Formatting** | JSON, YAML, TOML, XML, SQL, GraphQL, JSON Schema, CSV |
| **Text** | Regex Tester, Text Diff, Markdown Preview, Text Toolkit, Emoji, Lorem, ASCII Art |
| **Security** | JWT Decoder, 2FA (TOTP), Password Generator, Hash, HMAC, X.509, Cipher |
| **Developer** | UUID, Cron Parser, Log Analyzer, Token Counter, TypeScript Type Gen, Mock API, Color, DNS, WHOIS, IP |
| **Generators** | Privacy Policy, Open Source License, Spin Wheel, Chart, RSS |
| **Image** | QR Code, Barcode, Favicon, Watermark |
| **Network** | HTTP Status, MIME Lookup, UA Parser, DNS Lookup, WHOIS, IP Geolocation |
| **Other** | World Clock, Travel Planner, Unit Converter, ADB |

## Architecture

```
src/
├── features/              # One directory per tool (lazy-loaded)
├── shared/
│   ├── context/           # I18nContext — bilingual i18n system
│   ├── components/        # Shared UI components
│   └── hooks/             # Shared hooks
├── shell/                 # Layout, HomePage, ToolShell
├── styles/                # Global CSS (OKLch color system)
├── registry.ts            # Tool registry (auto-generates routes)
└── App.tsx                # Router entry (HashRouter)
```

Each tool is a self-contained module under `src/features/` with its own `index.tsx`. Tools are registered in `registry.ts` and automatically get a route via lazy import.

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **React Router DOM 7** (HashRouter)
- **Pure CSS** with OKLch color system — no Tailwind, no CSS-in-JS
- Zero backend dependencies

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-tool`
3. Add your tool under `src/features/your-tool/`
4. Follow the existing pattern:
   - Wrap with `ToolShell`
   - Use `useI18n` / `useToolI18n` for i18n
   - Add `HelpSection` with features and usage
   - Register in `src/registry.ts`
   - Add translations in `src/shared/context/I18nContext.tsx`
   - Add styles in `src/styles/components.css`
5. Submit a PR

## License

[CC BY-NC-SA 4.0](./LICENSE)

<p align="center">
  <br/>
  <img src="./public/favicon.svg" width="64" alt="logo" />
  <h1 align="center">Efficient Tools</h1>
  <p align="center">面向开发者的一站式效率工具集合，纯浏览器运行，数据不出设备。</p>
  <p align="center">
    <img src="https://img.shields.io/badge/工具数-60+-blue?style=flat-square" />
    <img src="https://img.shields.io/badge/隐私-纯本地-22c55e?style=flat-square" />
    <img src="https://img.shields.io/badge/广告-零-22c55e?style=flat-square" />
    <img src="https://img.shields.io/badge/协议-CC--BY--NC--SA--4.0-orange?style=flat-square" />
    <img src="https://img.shields.io/badge/语言-中%20%7C%20英-blue?style=flat-square" />
  </p>
  <p align="center">
    <a href="./README.md">English</a>
  </p>
</p>

<br/>

**所有工具纯浏览器运行，数据不出设备。** 60+ 款开发常用工具，涵盖编解码、格式化、文本处理、安全加密、网络调试等，零广告、零追踪、响应式、中英双语。

## 核心特性

- **隐私优先** — 所有数据处理在浏览器本地完成，不上传任何输入至服务器
- **零广告零追踪** — 干净极简界面，专注工具本身
- **60+ 工具** — 编解码、格式化、文本、安全、网络、开发、图片、生成器
- **中英双语** — 自动检测时区选择语言，一键切换
- **响应式设计** — 完美适配桌面端和移动端
- **轻量秒开** — 纯前端构建，无后端依赖，按工具代码分割

## 快速开始

```bash
git clone https://github.com/moosphon/efficient-tools.git
cd efficient-tools
npm install
npm run dev
```

## 工具总览

| 分类 | 工具 |
|------|------|
| **编解码** | Base64、URL、Unicode、Hex、HTML Entity、二维码、条形码 |
| **格式化** | JSON、YAML、TOML、XML、SQL、GraphQL、JSON Schema、CSV |
| **文本** | 正则测试、Diff 对比、Markdown 预览、文本工具箱、Emoji、Lorem、ASCII Art |
| **安全** | JWT 解码、2FA (TOTP)、密码生成、Hash、HMAC、X.509、加解密 |
| **开发** | UUID、Cron 解析、日志分析、Token 计数、TS 类型生成、Mock API、颜色、DNS、WHOIS、IP |
| **生成器** | 隐私协议、开源许可证、随机转盘、图表、RSS |
| **图片** | 二维码、条形码、Favicon、水印 |
| **网络** | HTTP 状态码、MIME 查询、UA 解析、DNS、WHOIS、IP 定位 |
| **其他** | 世界时钟、旅行规划、单位换算、ADB |

## 项目结构

```
src/
├── features/              # 每个工具一个目录（懒加载）
├── shared/
│   ├── context/           # I18nContext — 中英双语国际化
│   ├── components/        # 共享 UI 组件
│   └── hooks/             # 共享 Hooks
├── shell/                 # Layout、HomePage、ToolShell
├── styles/                # 全局 CSS（OKLch 色彩系统）
├── registry.ts            # 工具注册表（自动生成路由）
└── App.tsx                # 路由入口（HashRouter）
```

## 技术栈

- **React 19** + **TypeScript** + **Vite**
- **React Router DOM 7** (HashRouter)
- **纯 CSS** + OKLch 色彩系统 — 无 Tailwind，无 CSS-in-JS
- 零后端依赖

## 贡献

1. Fork 本项目
2. 创建分支：`git checkout -b feat/my-tool`
3. 在 `src/features/your-tool/` 下添加工具
4. 遵循现有模式：
   - 使用 `ToolShell` 包裹
   - 使用 `useI18n` / `useToolI18n` 实现国际化
   - 添加 `HelpSection` 帮助说明
   - 在 `src/registry.ts` 注册
   - 在 `src/shared/context/I18nContext.tsx` 添加翻译
   - 在 `src/styles/components.css` 添加样式
5. 提交 PR

## 许可证

[CC BY-NC-SA 4.0](./LICENSE) — 署名-非商业性使用-相同方式共享

<p align="center">
  <h1 align="center">⚡ Efficient Tools</h1>
  <p align="center">面向开发者的一站式效率工具集合</p>
  <p align="center">
    <img src="https://img.shields.io/badge/工具数-53+-blue?style=flat-square" alt="tools" />
    <img src="https://img.shields.io/badge/外部依赖-0-brightgreen?style=flat-square" alt="deps" />
    <img src="https://img.shields.io/badge/数据-纯本地-ff69b4?style=flat-square" alt="privacy" />
    <img src="https://img.shields.io/badge/协议-CC--BY--NC--SA--4.0-orange?style=flat-square" alt="license" />
  </p>
</p>

> **所有工具纯浏览器运行，数据不出设备。** 一站式汇集日常开发中最常用的编解码、格式化、文本处理、安全加密、网络调试等工具，零广告、响应式、中英双语。
>
> **[English](./README.en.md)**

---

## 核心特性

- **🛡️ 隐私优先** — 所有数据处理在浏览器本地完成，不上传任何输入至服务器
- **🚫 零广告零追踪** — 干净极简界面，专注工具本身
- **🌍 中英双语** — 自动检测时区选择语言，一键切换，全部工具页面完整适配
- **📱 响应式设计** — 完美适配桌面端和移动端
- **⚡ 轻量秒开** — 纯前端构建，无后端依赖，首次加载即开即用
- **🔓 开源透明** — 代码完全开源，欢迎社区贡献

---

## 工具总览

| 分类 | 数量 | 包含工具 |
|------|------|---------|
| 编码/解码 | 7 | Base64/Base32、URL、Unicode、Hex、HTML Entity、二维码、条形码 |
| 格式化/转换 | 14 | JSON、YAML、TOML、XML、SQL、GraphQL、JSON Schema、CSV、时间戳、进制、单位等 |
| 文本处理 | 11 | 正则验证器、Diff 对比、Markdown、文本编辑工具箱、文本统计、Emoji、Lorem 等 |
| 安全/加密 | 7 | JWT、2FA、密码生成器、Hash、HMAC、X.509、文本加解密 |
| 开发调试 | 14 | UUID、Cron、日志分析、Token 计数、TS 类型生成、Mock API、DNS/WHOIS/IP 查询等 |
| 系统工具 | 1 | ADB 自动化 |

---

## 快速开始

```bash
git clone https://github.com/moosphon/efficient-tools.git
cd efficient-tools
npm install
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
```

---

## 项目结构

```
src/
├── features/              # 53 个工具（每个工具独立目录）
├── shared/
│   ├── context/           # I18nContext — 中英双语国际化
│   └── components/        # HelpSection 等共享组件
├── shell/                 # Layout、HomePage、ToolShell
├── styles/                # 全局样式
├── registry.ts            # 工具注册表
└── App.tsx                # 路由入口
```

---

## 国际化

所有 53 个工具页面均支持中英文完整切换：

- 首次访问自动根据浏览器时区选择语言
- 导航栏一键切换中/英文
- 标题、按钮、占位符、帮助说明、参数说明全部双语
- Cron 表达式、时间戳等工具会根据语言切换输出格式

---

## 路线图

- [ ] 工具组合 — 串联多个工具（如 Base64 解码 → JSON 格式化 → JSONPath 查询）
- [ ] PWA 离线支持 — 完全离线可用
- [ ] 暗色/亮色主题切换
- [ ] 收藏夹 — 常用工具快速访问
- [ ] 更多工具需求分析 → [TOOLS_ANALYSIS.md](./TOOLS_ANALYSIS.md)

---

## 贡献

欢迎贡献新工具或改进现有功能。

1. Fork 本项目
2. 创建功能分支：`git checkout -b feat/my-tool`
3. 提交更改：`git commit -m 'feat: add my-tool'`
4. 推送并创建 Pull Request

> 新增工具请遵循现有目录结构，确保集成 i18n（中英双语）和 HelpSection 帮助说明。

---

## 许可证

[CC BY-NC-SA 4.0](./LICENSE) — 署名-非商业性使用-相同方式共享

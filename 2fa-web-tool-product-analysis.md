# 网页版 2FA 验证码工具产品分析

## 背景

目标是设计一个免登录、浏览器可用的 2FA / 二步验证码工具，用户输入自己的 TOTP 密钥后，网页即时生成当前 6 位动态验证码，可用于 GitHub、Google 等支持身份验证器应用的账号登录验证。

参考产品 `2fa.fun` 的公开页面定位是“谷歌身份验证器网页版”，核心能力是输入 2FA 密钥后生成 6 位验证码，并提示验证码每 30 秒自动更新。它还支持粘贴类似 `UID|密码|2FA|邮箱|邮箱密码` 的批量账号格式，但这类账号聚合能力安全风险较高，不建议在本产品中复刻。

## 产品定位

做一个“本地优先”的网页版 TOTP 生成器：

- 不要求登录。
- 不上传密钥。
- 不保存账号密码。
- 不做账号测活、批量登录、Cookie 处理等高风险功能。
- 支持 GitHub、Google、Microsoft、Cloudflare、Vercel 等标准 TOTP 服务。

一句话定位：

> 一个隐私优先的网页 2FA 验证码生成器，在浏览器本地根据用户的 TOTP 密钥生成动态验证码。

## 用户痛点

### 1. 手机不在身边

用户登录 GitHub、Google 或其他平台时，需要打开手机里的 Google Authenticator、Microsoft Authenticator、1Password、Authy 等应用。临时没带手机或手机没电，会卡住登录流程。

### 2. 多设备协作不方便

开发者在电脑上工作，验证码却在手机里。尤其是远程桌面、公司电脑、虚拟机环境中，频繁切换设备体验很差。

### 3. 迁移和备份成本高

换手机、重装系统、丢失设备时，如果没有备份 TOTP 密钥或恢复码，可能导致账号无法登录。

### 4. 临时验证场景需要轻量工具

用户可能只想快速用一次 TOTP 密钥生成验证码，不想安装桌面应用或浏览器插件。

### 5. 安全边界不透明

很多在线 2FA 工具没有明确说明密钥是否上传、是否保存、是否被第三方脚本读取，用户不容易判断安全风险。

## 核心用户

- 开发者：GitHub、云平台、CI/CD、域名和服务器后台常用 2FA。
- 独立站长：管理 Google、Cloudflare、Vercel、GitHub Pages 等账号。
- 运营人员：需要偶尔登录广告、社媒、邮件或数据平台。
- 安全意识较强的普通用户：希望有一个透明、开源、可审计的网页工具。

## 支持范围

### 支持

- 标准 TOTP。
- Base32 Secret 输入。
- `otpauth://totp/...` URI 输入。
- 二维码解析导入。
- 6 位和 8 位验证码。
- 30 秒周期，允许扩展 60 秒等周期。
- SHA1 / SHA256 / SHA512。
- GitHub 默认参数：TOTP、SHA1、6 位、30 秒。
- Google Authenticator 常见 URI 格式。

### 不支持

- 不支持短信验证码。
- 不支持邮箱验证码。
- 不支持 Google Prompt / GitHub Mobile Push。
- 不支持 Passkey / WebAuthn 登录。
- 不支持代替用户登录账号。
- 不支持批量账号测活。
- 不支持存储用户账号密码。

## GitHub 与 Google 兼容性

GitHub 官方文档说明，GitHub 的 TOTP 手动配置参数包括：

- Type: `TOTP`
- Issuer: `GitHub`
- Algorithm: 默认 `SHA1`
- Digits: 默认 `6`
- Period: 默认 `30` 秒

Google Authenticator 的 Key URI 格式使用：

```text
otpauth://totp/LABEL?secret=BASE32_SECRET&issuer=ISSUER&algorithm=SHA1&digits=6&period=30
```

因此，只要按 RFC 6238 实现 TOTP，并兼容 Google Authenticator Key URI，就可以支持 GitHub、Google 以及大多数身份验证器场景。

## 竞品观察：2fa.fun

### 当前能力

- 在线输入 2FA 密钥。
- 生成当前 6 位动态验证码。
- 说明 30 秒自动更新。
- 支持粘贴完整账号行，从中提取 2FA 字段。
- 同站提供账号检测、Cookie 转换、文本处理等工具入口。

### 可借鉴点

- 使用门槛低，打开即用。
- 文案直接，用户知道输入密钥后点击即可获取验证码。
- 支持从复杂文本中提取 2FA 字段，适合用户复制粘贴。

### 不建议复刻点

- 不建议支持 `UID|密码|2FA|邮箱|邮箱密码` 这类账号密码混合格式。
- 不建议提供账号测活、Cookie 转换等容易被滥用的功能。
- 不建议让用户误以为可以把敏感账号信息安全地粘贴到网页里。

## MVP 模型

### MVP 目标

验证用户是否需要一个“免登录、隐私优先、浏览器本地计算”的 2FA 工具。

### MVP 功能

1. 单个密钥生成验证码
   - 输入 Base32 Secret。
   - 自动清理空格。
   - 显示当前验证码。
   - 显示剩余秒数进度条。
   - 每 30 秒自动刷新。

2. URI 导入
   - 支持粘贴 `otpauth://totp/...`。
   - 自动解析 issuer、account、secret、algorithm、digits、period。

3. 二维码导入
   - 用户上传二维码图片。
   - 本地解析二维码。
   - 不上传图片。

4. 本地列表
   - 用户可添加多个 TOTP 项。
   - 名称、服务商、密钥保存在浏览器本地。
   - 默认关闭云同步。
   - 提供一键清空。

5. 安全提示
   - 明确说明密钥只在浏览器本地处理。
   - 提醒用户不要输入账号密码。
   - 提醒用户保存服务商提供的 recovery codes。

6. 导出与备份
   - 支持导出加密备份文件。
   - 导入时需要用户输入备份密码。
   - 不提供明文批量导出作为默认入口。

### MVP 不做

- 不做账号登录。
- 不做服务端同步。
- 不做广告 SDK。
- 不做批量账号检测。
- 不做浏览器插件。
- 不做移动端 App。

## 功能设计

### 首页

首屏就是工具，不做营销落地页。

主要区域：

- 左侧：TOTP 条目列表。
- 右侧：当前条目的大号验证码、倒计时、复制按钮。
- 顶部：添加密钥、导入二维码、导入 URI、设置。

### 添加密钥

字段：

- 服务名称：例如 GitHub、Google。
- 账号标识：例如 `name@example.com`。
- Secret：Base32 密钥。
- 算法：默认 SHA1。
- 位数：默认 6。
- 周期：默认 30 秒。

校验：

- Secret 必须是合法 Base32。
- 周期建议限制在 `15-120` 秒。
- 位数只允许 `6` 或 `8`。
- 算法只允许 `SHA1 / SHA256 / SHA512`。

### 验证码卡片

展示内容：

- 服务商图标或首字母。
- 服务名称。
- 账号标识。
- 当前验证码。
- 剩余秒数。
- 复制按钮。
- 即将过期时提示等待下一轮。

交互：

- 点击验证码复制。
- 复制后显示短 toast。
- 剩余小于 5 秒时，复制按钮提示“即将刷新”。

### 隐私模式

功能：

- 默认隐藏 Secret。
- 可一键隐藏所有验证码。
- 页面失焦后自动遮罩验证码。
- 支持设置自动锁定时间。

### 本地存储

默认使用 IndexedDB 或 localStorage。

建议：

- MVP 可用 localStorage。
- 稳定版使用 IndexedDB。
- 存储前使用用户设置的本地主密码加密。
- 不设置主密码时，只保存非敏感配置，不保存 Secret。

## 可行性分析

### 算法可行

TOTP 是 RFC 6238 定义的标准算法。本质是：

```text
TOTP = HOTP(secret, floor(currentUnixTime / period))
```

默认周期通常是 30 秒，输出一般是 6 位数字。浏览器可以使用 Web Crypto API 的 HMAC 能力完成计算。

### 兼容性可行

Google Authenticator 的 URI 格式公开且被大量服务采用。GitHub 文档也给出了手动配置 TOTP 所需的默认参数。

### 前端实现可行

现代浏览器支持 Web Crypto API，但它要求 HTTPS 安全上下文。部署必须使用 HTTPS。

### 安全可行但需要克制

前端工具可以做到“不上传密钥”，但浏览器环境仍然有风险：

- 第三方脚本可能读取页面数据。
- XSS 会导致密钥泄露。
- localStorage 明文保存密钥风险较高。
- 用户在不可信设备上使用会有残留风险。

所以产品必须：

- 尽量零第三方脚本。
- 禁止加载广告脚本。
- 设置严格 CSP。
- 不接入统计 SDK 或只使用无 Cookie、无事件内容的轻量统计。
- 默认不保存 Secret，或者保存前必须加密。

## 技术方案

### 技术栈

建议：

- Vite + React + TypeScript。
- Web Crypto API 计算 HMAC。
- IndexedDB 保存加密数据。
- Service Worker 提供离线能力。
- QR 解析库选择纯前端库，例如 `jsqr`。

### 核心模块

```text
src/
  crypto/
    base32.ts
    totp.ts
    hotp.ts
    encryption.ts
  storage/
    vaultStore.ts
    migration.ts
  features/
    token-list/
    token-card/
    add-token/
    import-qr/
    backup-restore/
  security/
    csp.ts
    clipboard.ts
```

### TOTP 计算流程

1. 清理 Secret。
2. Base32 解码为 bytes。
3. 计算当前时间步：

```ts
const counter = Math.floor(Date.now() / 1000 / period);
```

4. 将 counter 转为 8 字节 big-endian。
5. 使用 HMAC 计算摘要。
6. 动态截断。
7. 取模生成 6 位或 8 位数字。
8. 左侧补零。

### 安全存储方案

推荐两档：

#### 轻量模式

- 不保存 Secret。
- 用户每次打开手动输入。
- 适合临时使用。

#### 本地保险箱模式

- 用户设置主密码。
- 使用 PBKDF2 或 Argon2id 派生密钥。
- 使用 AES-GCM 加密 TOTP Secret。
- IndexedDB 保存密文。
- 主密码不保存。

浏览器内置 Web Crypto 支持 PBKDF2 和 AES-GCM。Argon2id 安全性更好，但通常需要 WASM，引入体积和供应链风险。

### 部署要求

- 必须 HTTPS。
- 禁止 HTTP 明文访问。
- 设置 CSP：

```text
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
connect-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'none';
```

如果后续需要错误上报或统计，再显式增加对应域名，不要使用通配符。

## 数据模型

```ts
type TotpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

type TotpEntry = {
  id: string;
  issuer: string;
  account: string;
  secretCiphertext?: string;
  secretPreview?: string;
  algorithm: TotpAlgorithm;
  digits: 6 | 8;
  period: number;
  createdAt: string;
  updatedAt: string;
};

type VaultMeta = {
  version: number;
  kdf: 'PBKDF2';
  iterations: number;
  salt: string;
};
```

## 风险控制

### 用户风险

- 用户把账号密码一起粘贴进来。
- 用户在公共电脑保存 Secret。
- 用户忘记主密码。
- 用户误以为网页工具比硬件密钥更安全。

应对：

- 输入框只命名为 `2FA Secret`，不要出现账号密码字段。
- 粘贴内容检测到疑似密码格式时给出拦截提示。
- 公共设备模式默认不保存。
- 明确建议保存 recovery codes。
- 明确提示硬件密钥 / Passkey 安全性更高。

### 产品风险

- 被滥用于批量账号管理。
- 被搜索引擎误解为账号破解工具。
- 由于第三方脚本或 XSS 导致密钥泄露。

应对：

- 不做批量账号格式解析。
- 不做账号状态检测。
- 不做 Cookie 工具。
- 不接第三方广告脚本。
- 做开源透明实现。

## 版本规划

### V0.1 原型

- 单 Secret 输入。
- 当前验证码生成。
- 30 秒倒计时。
- 复制验证码。
- 本地不保存。

### V0.2 MVP

- 多条目管理。
- `otpauth://` 导入。
- 二维码图片导入。
- 本地加密保存。
- 备份与恢复。

### V0.3 安全增强

- 自动锁定。
- 页面失焦隐藏验证码。
- CSP 加固。
- 离线 PWA。
- 安全自检页面。

### V1.0

- 稳定 TOTP 兼容。
- 完整本地保险箱。
- 导入导出加密备份。
- 多语言。
- 开源审计说明。

## 成功指标

- 用户能在 30 秒内生成第一个验证码。
- GitHub 和 Google TOTP 验证通过率接近 100%。
- 首屏无登录、无说明负担。
- 密钥默认不出浏览器。
- 用户能理解“Secret 泄露等同于 2FA 泄露”。

## 结论

该工具技术上可行，MVP 复杂度较低，但安全边界必须严格。推荐做成“隐私优先的本地 TOTP 工具”，不要复刻账号测活、账号密码批量解析、Cookie 转换等高风险能力。

最小可行版本只需要：

- Base32 Secret 输入。
- TOTP 生成。
- 倒计时刷新。
- 一键复制。
- 明确的本地处理和安全提示。

在验证用户需求后，再增加二维码导入、本地加密保险箱和备份恢复。

## 参考资料

- 2FA.FUN: https://2fa.fun/
- RFC 6238 TOTP: https://www.rfc-editor.org/rfc/rfc6238.html
- Google Authenticator Key URI Format: https://github.com/google/google-authenticator/wiki/Key-Uri-Format
- GitHub TOTP configuration: https://docs.github.com/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication
- MDN Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API

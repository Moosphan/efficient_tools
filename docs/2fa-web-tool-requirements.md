# 2FA 验证码工具 - 产品需求与技术方案

## 产品定位

一个隐私优先的网页 2FA 验证码生成器，在浏览器本地根据用户的 TOTP 密钥生成动态验证码。

**核心原则：**
- 免登录
- 不上传密钥
- 不保存账号密码
- 本地计算
- 隐私优先

---

## 功能需求

### 1. 核心功能

#### 1.1 单密钥验证码生成
- 输入 Base32 Secret
- 自动清理空格
- 显示当前 6 位验证码
- 显示剩余秒数进度条
- 每 30 秒自动刷新
- 一键复制验证码

#### 1.2 多种导入方式
- **手动输入**：Base32 Secret
- **URI 导入**：支持 `otpauth://totp/...` 格式
- **二维码导入**：上传二维码图片，本地解析

#### 1.3 多条目管理
- 添加多个 TOTP 条目
- 每个条目包含：
  - 服务名称（如 GitHub、Google）
  - 账号标识（如邮箱）
  - Secret 密钥
  - 算法（SHA1/SHA256/SHA512）
  - 位数（6 位或 8 位）
  - 周期（默认 30 秒）
- 条目列表展示
- 编辑和删除条目

#### 1.4 验证码卡片展示
- 服务商图标或首字母
- 服务名称和账号标识
- 当前验证码（大号显示）
- 剩余秒数倒计时
- 复制按钮
- 即将过期提示（剩余 < 5 秒）

### 2. 安全功能

#### 2.1 本地加密存储
- 使用 IndexedDB 存储
- 用户设置主密码
- 使用 PBKDF2 派生密钥
- 使用 AES-GCM 加密 Secret
- 主密码不保存

#### 2.2 隐私模式
- 默认隐藏 Secret
- 一键隐藏所有验证码
- 页面失焦自动遮罩验证码
- 自动锁定功能

#### 2.3 备份与恢复
- 导出加密备份文件
- 导入时需要备份密码
- 一键清空所有数据

### 3. 兼容性支持

#### 支持的标准
- 标准 TOTP（RFC 6238）
- Base32 Secret 输入
- `otpauth://totp/...` URI
- 二维码解析
- 6 位和 8 位验证码
- 30 秒周期（可扩展 60 秒等）
- SHA1 / SHA256 / SHA512 算法

#### 支持的服务
- GitHub（默认：TOTP、SHA1、6 位、30 秒）
- Google Authenticator
- Microsoft Authenticator
- Cloudflare
- Vercel
- 其他标准 TOTP 服务

#### 不支持
- 短信验证码
- 邮箱验证码
- Google Prompt / GitHub Mobile Push
- Passkey / WebAuthn
- 批量账号管理
- 账号密码存储

---

## 技术方案

### 1. 技术栈

```
前端框架：Vite + React + TypeScript
加密计算：Web Crypto API
本地存储：IndexedDB
离线能力：Service Worker
二维码解析：jsqr（纯前端库）
```

### 2. 核心模块结构

```
src/
  crypto/
    base32.ts          # Base32 编解码
    totp.ts            # TOTP 算法实现
    hotp.ts            # HOTP 算法实现
    encryption.ts      # 加密解密工具
  storage/
    vaultStore.ts      # 本地保险箱存储
    migration.ts       # 数据迁移
  features/
    token-list/        # 条目列表
    token-card/        # 验证码卡片
    add-token/         # 添加条目
    import-qr/         # 二维码导入
    backup-restore/    # 备份恢复
  security/
    csp.ts             # 内容安全策略
    clipboard.ts       # 剪贴板操作
```

### 3. TOTP 算法实现

```typescript
// 计算流程
1. 清理 Secret（去除空格）
2. Base32 解码为 bytes
3. 计算时间步：counter = Math.floor(Date.now() / 1000 / period)
4. 将 counter 转为 8 字节 big-endian
5. 使用 HMAC 计算摘要
6. 动态截断
7. 取模生成 6 位或 8 位数字
8. 左侧补零
```

### 4. 数据模型

```typescript
type TotpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

type TotpEntry = {
  id: string;
  issuer: string;              // 服务商名称
  account: string;             // 账号标识
  secretCiphertext?: string;   // 加密后的密钥
  secretPreview?: string;      // 密钥预览（前几位）
  algorithm: TotpAlgorithm;    // 算法
  digits: 6 | 8;               // 位数
  period: number;              // 周期（秒）
  createdAt: string;
  updatedAt: string;
};

type VaultMeta = {
  version: number;
  kdf: 'PBKDF2';              // 密钥派生函数
  iterations: number;          // 迭代次数
  salt: string;                // 盐值
};
```

### 5. 安全存储方案

#### 轻量模式
- 不保存 Secret
- 用户每次手动输入
- 适合临时使用

#### 本地保险箱模式
- 用户设置主密码
- 使用 PBKDF2 派生密钥
- 使用 AES-GCM 加密 Secret
- IndexedDB 保存密文
- 主密码不保存

### 6. 安全加固

#### CSP 配置
```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
connect-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'none';
```

#### 部署要求
- 必须使用 HTTPS
- 禁止 HTTP 明文访问
- 零第三方脚本
- 禁止广告脚本
- 严格 CSP 策略

### 7. 输入校验规则

```typescript
// Secret 校验
- 必须是合法 Base32 字符
- 自动清理空格和换行

// 周期校验
- 限制在 15-120 秒范围

// 位数校验
- 只允许 6 或 8

// 算法校验
- 只允许 SHA1 / SHA256 / SHA512
```

---

## 用户界面设计

### 首页布局
```
┌─────────────────────────────────────────┐
│  [+ 添加] [导入二维码] [导入URI] [设置]  │
├──────────────┬──────────────────────────┤
│              │                          │
│  条目列表    │    当前验证码            │
│              │                          │
│  □ GitHub    │    ┌──────────────┐     │
│  □ Google    │    │   123 456    │     │
│  □ Vercel    │    └──────────────┘     │
│              │                          │
│              │    剩余: 18 秒           │
│              │    [━━━━━━━━░░]         │
│              │                          │
│              │    [复制验证码]          │
│              │                          │
└──────────────┴──────────────────────────┘
```

### 添加密钥表单
```
服务名称：[GitHub        ]
账号标识：[user@email.com]
Secret：  [JBSWY3DPEHPK3PXP]
算法：    [SHA1 ▼]
位数：    [6 ▼]
周期：    [30 秒 ▼]

[取消]  [保存]
```

---

## 版本规划

### V0.1 原型（验证可行性）
- ✓ 单 Secret 输入
- ✓ 验证码生成
- ✓ 30 秒倒计时
- ✓ 复制功能
- ✓ 本地不保存

### V0.2 MVP（最小可用版本）
- ✓ 多条目管理
- ✓ URI 导入
- ✓ 二维码导入
- ✓ 本地加密保存
- ✓ 备份与恢复

### V0.3 安全增强
- ✓ 自动锁定
- ✓ 页面失焦隐藏
- ✓ CSP 加固
- ✓ 离线 PWA
- ✓ 安全自检页面

### V1.0 正式版
- ✓ 稳定 TOTP 兼容
- ✓ 完整本地保险箱
- ✓ 加密备份导入导出
- ✓ 多语言支持
- ✓ 开源审计说明

---

## 风险控制

### 用户风险应对
| 风险 | 应对措施 |
|------|---------|
| 用户粘贴账号密码 | 输入框只命名为 "2FA Secret"，检测疑似密码格式时拦截 |
| 公共电脑保存密钥 | 公共设备模式默认不保存 |
| 忘记主密码 | 明确建议保存 recovery codes |
| 误解安全性 | 提示硬件密钥 / Passkey 安全性更高 |

### 产品风险应对
| 风险 | 应对措施 |
|------|---------|
| 被滥用于批量账号管理 | 不做批量账号格式解析 |
| 被误解为破解工具 | 不做账号状态检测、Cookie 工具 |
| 第三方脚本泄露密钥 | 不接第三方广告脚本，开源透明实现 |

---

## 成功指标

- ✓ 用户能在 30 秒内生成第一个验证码
- ✓ GitHub 和 Google TOTP 验证通过率接近 100%
- ✓ 首屏无登录、无说明负担
- ✓ 密钥默认不出浏览器
- ✓ 用户理解 "Secret 泄露等同于 2FA 泄露"

---

## 参考资料

- RFC 6238 TOTP: https://www.rfc-editor.org/rfc/rfc6238.html
- Google Authenticator Key URI Format: https://github.com/google/google-authenticator/wiki/Key-Uri-Format
- GitHub TOTP Configuration: https://docs.github.com/authentication/securing-your-account-with-two-factor-authentication-2fa/configuring-two-factor-authentication
- MDN Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API

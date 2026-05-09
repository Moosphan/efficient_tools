# Efficient Tools — 一站式开发工具合集站点 架构设计文档

## Context

当前项目是一个单页 2FA 验证码工具（Vite + React + TS），需要改造为可扩展的开发工具合集平台。每个工具作为独立功能模块可插拔接入，共享统一的设计系统和基础设施。

---

## 一、架构设计

### 1.1 目录结构

```
src/
├── main.tsx                          # 入口
├── App.tsx                           # 路由 + 全局布局
├── app.css                           # 全局布局样式
│
├── shell/                            # 平台外壳（导航、布局、全局功能）
│   ├── Layout.tsx                    # 侧边栏 + 内容区布局
│   ├── Sidebar.tsx                   # 工具导航菜单
│   ├── ToolHeader.tsx                # 动态标题栏（工具名 + 描述）
│   └── HomePage.tsx                  # 首页：工具卡片网格
│
├── features/                         # 各工具独立模块（可插拔）
│   ├── totp/                         # 2FA 验证码
│   │   ├── index.tsx                 # 入口组件
│   │   ├── components/               # 工具内部组件
│   │   ├── hooks/                    # 工具内部 hooks
│   │   ├── crypto/                   # TOTP 算法
│   │   └── styles.css
│   │
│   ├── json-formatter/               # JSON 格式化
│   ├── regex-tester/                 # 正则验证器
│   ├── log-analyzer/                 # 日志格式化/分析
│   ├── color-converter/              # 颜色格式转换
│   ├── translator/                   # 快速翻译
│   ├── adb-tools/                    # ADB 自动化工具
│   ├── base64-codec/                 # Base64 编解码
│   ├── hash-generator/               # Hash 生成器
│   ├── timestamp-converter/          # 时间戳转换
│   ├── url-codec/                    # URL 编解码
│   ├── diff-viewer/                  # 文本 Diff 对比
│   ├── uuid-generator/               # UUID 生成器
│   ├── lorem-generator/              # 假数据生成器
│   ├── jwt-decoder/                  # JWT 解析器
│   ├── cron-parser/                  # Cron 表达式解析
│   ├── markdown-preview/             # Markdown 预览
│   ├── http-request-builder/         # HTTP 请求构造器
│   └── _template/                    # 新工具模板
│       ├── index.tsx
│       └── styles.css
│
├── shared/                           # 共享基础设施
│   ├── components/                   # 通用 UI 组件
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── TextArea.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Toggle.tsx
│   │   ├── Tabs.tsx
│   │   ├── CopyButton.tsx
│   │   ├── CodeEditor.tsx            # 代码编辑区（带语法高亮）
│   │   ├── ResultPanel.tsx           # 输出/结果展示面板
│   │   └── EmptyState.tsx            # 空状态占位
│   │
│   ├── hooks/
│   │   ├── useClipboard.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   └── useWorker.ts              # Web Worker 封装（重计算任务）
│   │
│   ├── context/
│   │   ├── ToastContext.tsx
│   │   └── ThemeContext.tsx           # 主题切换（未来）
│   │
│   ├── styles/
│   │   ├── variables.css             # 设计令牌（oklch 色彩系统）
│   │   ├── reset.css
│   │   ├── global.css
│   │   ├── layout.css                # shell 布局样式
│   │   └── components.css            # 共享组件样式
│   │
│   ├── utils/
│   │   ├── id.ts
│   │   ├── format.ts
│   │   └── clipboard.ts
│   │
│   └── types/
│       └── index.ts                  # 共享类型定义
│
└── registry.ts                       # 工具注册表（元数据 + 路由映射）
```

### 1.2 工具注册机制（可插拔核心）

每个工具通过 `registry.ts` 注册，新增工具只需：
1. 在 `features/` 下创建目录
2. 导出默认组件
3. 在 `registry.ts` 添加一条记录

```typescript
// src/registry.ts
export interface ToolMeta {
  id: string;              // 唯一标识，如 'totp'
  name: string;            // 显示名称，如 '2FA 验证码'
  description: string;     // 一行描述
  icon: string;            // emoji 或 SVG 路径
  category: ToolCategory;  // 分类
  path: string;            // 路由路径，如 '/totp'
  component: () => Promise<{ default: React.ComponentType }>;  // 懒加载
  keywords: string[];      // 搜索关键词
  version: string;         // 工具版本
}

export type ToolCategory =
  | '编码/解码'
  | '格式化/转换'
  | '安全/加密'
  | '文本处理'
  | '开发调试'
  | '系统工具';

export const tools: ToolMeta[] = [
  {
    id: 'totp',
    name: '2FA 验证码',
    description: '基于 TOTP 协议的一次性验证码生成器',
    icon: '🔐',
    category: '安全/加密',
    path: '/totp',
    component: () => import('./features/totp'),
    keywords: ['2fa', 'totp', 'otp', '验证码', 'authenticator'],
    version: '1.0.0',
  },
  {
    id: 'json-formatter',
    name: 'JSON 格式化',
    description: 'JSON 美化、压缩、校验、路径提取',
    icon: '{ }',
    category: '格式化/转换',
    path: '/json',
    component: () => import('./features/json-formatter'),
    keywords: ['json', 'format', 'beautify', '格式化', '美化'],
    version: '1.0.0',
  },
  // ... 更多工具
];
```

### 1.3 路由方案

使用 `react-router-dom` 的懒加载路由：

```typescript
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { tools } from './registry';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            {tools.map(tool => (
              <Route
                key={tool.id}
                path={tool.path}
                element={<LazyTool loader={tool.component} />}
              />
            ))}
          </Routes>
        </Layout>
      </BrowserRouter>
    </ToastProvider>
  );
}
```

### 1.4 布局方案

```
┌─────────────────────────────────────────────┐
│  Efficient Tools          [搜索] [设置]      │  ← 顶栏
├──────────┬──────────────────────────────────┤
│          │                                  │
│ 🔐 2FA   │  [工具名称]                      │  ← 工具标题
│ { } JSON │  [工具描述]                      │
│ .* Regex │                                  │
│ 📋 Log   │  ┌────────────────────────────┐  │
│ 🎨 Color │  │                            │  │  ← 工具内容区
│ 🌐 Trans │  │     工具功能区域             │  │    （各工具自定义）
│ 📱 ADB   │  │                            │  │
│ ...      │  └────────────────────────────┘  │
│          │                                  │
│          │  ── 本地运行 · 数据不出浏览器 ──  │  ← 安全提示
└──────────┴──────────────────────────────────┘
```

- **桌面端**：左侧固定侧边栏（200px）+ 右侧内容区
- **移动端**：侧边栏折叠为底部 Tab 栏或汉堡菜单
- **首页**：工具卡片网格，支持搜索和分类筛选

### 1.5 工具开发模板

每个工具遵循统一接口：

```typescript
// src/features/_template/index.tsx
export default function MyTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const process = () => {
    // 核心逻辑
  };

  return (
    <ToolShell
      title="工具名称"
      description="工具描述"
    >
      <div className="tool-workspace">
        <div className="tool-input">
          <TextArea value={input} onChange={setInput} placeholder="输入..." />
          <div className="tool-actions">
            <Button onClick={process}>执行</Button>
            <Button variant="ghost" onClick={() => { setInput(''); setOutput(''); }}>清空</Button>
          </div>
        </div>
        <div className="tool-output">
          <ResultPanel value={output} />
        </div>
      </div>
    </ToolShell>
  );
}
```

---

## 二、工具清单与优先级

### P0 — 第一批（核心高频工具）

| # | 工具 | 痛点 | 核心能力 | 工作量 |
|---|------|------|----------|--------|
| 1 | **JSON 格式化** | 日常最高频，复制粘贴 JSON 需要快速美化/压缩/校验 | 美化、压缩、校验、JSONPath 提取、树形折叠视图、大文件优化（Web Worker） | 3天 |
| 2 | **2FA 验证码** | ✅ 已实现 | TOTP 生成、二维码导入、隐私保护 | ✅ 完成 |
| 3 | **正则验证器** | 写正则需要反复测试，缺乏可视化匹配高亮 | 实时匹配高亮、捕获组展示、常用正则库、flags 切换、替换预览 | 3天 |
| 4 | **时间戳转换** | Unix 时间戳和日期互转是最常见的调试需求 | Unix ↔ 日期互转、毫秒/秒切换、多时区支持、相对时间显示、批量转换 | 1天 |
| 5 | **Base64 编解码** | API 调试和数据传输中频繁使用 | 文本编解码、文件编解码、URL-safe Base64、批量处理 | 1天 |
| 6 | **URL 编解码** | URL 参数调试、特殊字符处理 | 编码/解码、参数解析表格、嵌套编码处理 | 1天 |

### P1 — 第二批（开发调试工具）

| # | 工具 | 痛点 | 核心能力 | 工作量 |
|---|------|------|----------|--------|
| 7 | **文本 Diff 对比** | 代码审查、配置对比需要快速 diff | 行级/字符级 diff、并排/内联视图、语法高亮、忽略空白 | 3天 |
| 8 | **Hash 生成器** | 校验文件完整性、生成签名 | MD5/SHA-1/SHA-256/SHA-512、文件 Hash、HMAC、对比验证 | 2天 |
| 9 | **颜色格式转换** | UI 开发中 HEX/RGB/HSL 互转 | HEX ↔ RGB ↔ HSL ↔ oklch 互转、颜色选择器、调色板生成、对比度检查 | 2天 |
| 10 | **JWT 解析器** | 调试认证系统时需要解码 JWT | Header/Payload/Signature 解析、过期时间高亮、Base64 解码、签名验证提示 | 1天 |
| 11 | **Cron 表达式解析** | 定时任务配置容易写错 | Cron → 自然语言、最近 N 次执行时间、可视化时间线、语法校验 | 2天 |
| 12 | **Markdown 预览** | 编写文档需要实时预览 | 实时渲染、同步滚动、代码高亮、导出 HTML | 3天 |

### P2 — 第三批（进阶工具）

| # | 工具 | 痛点 | 核心能力 | 工作量 |
|---|------|------|----------|--------|
| 13 | **日志格式化/分析** | 服务器日志难以阅读和筛选 | 多格式解析（JSON/logfmt/正则）、字段高亮、条件过滤、时间范围筛选、统计聚合 | 5天 |
| 14 | **快速翻译** | 开发中频繁查单词/翻译报错信息 | 多引擎（浏览器原生翻译 API）、剪贴板监听、术语表 | 3天 |
| 15 | **UUID 生成器** | 需要快速生成各种格式的 UUID | v4/v5/v7、批量生成、自定义格式、无连字符选项 | 1天 |
| 16 | **假数据生成器** | 测试需要大量模拟数据 | 姓名/地址/邮箱/手机号/身份证、自定义模板、批量导出 | 3天 |
| 17 | **HTTP 请求构造器** | 简单 API 测试不想打开 Postman | 方法/URL/Headers/Body 构造、cURL 导入导出、响应展示 | 5天 |
| 18 | **ADB 工具** | Android 开发需要频繁输入 ADB 命令 | 常用命令快捷按钮、设备管理、截图/录屏、日志查看（WebUSB/终端集成） | 5天 |

---

## 三、各工具痛点与能力分析

### JSON 格式化
- **痛点**：每天处理大量 JSON 数据，手动格式化效率低；大文件卡顿；JSONPath 查询需记忆语法
- **能力分级**：
  - 基础：美化/压缩/校验
  - 进阶：树形折叠视图、JSONPath 提取、类型标注
  - 高级：大文件 Web Worker 处理、Schema 校验、JSON → TypeScript 类型生成

### 正则验证器
- **痛点**：正则写错难以调试，缺少实时反馈；不同语言正则语法差异
- **能力分级**：
  - 基础：输入正则 + 测试文本 → 匹配高亮
  - 进阶：捕获组展示、常用正则库（邮箱/手机/URL 等）
  - 高级：替换预览、多语言语法差异提示、正则性能分析

### 日志格式化
- **痛点**：原始日志缺乏结构化，难以快速定位问题；多行日志关联困难
- **能力分级**：
  - 基础：自动识别格式、字段着色
  - 进阶：条件过滤（grep）、时间范围筛选、字段提取
  - 高级：统计聚合（错误率/响应时间分布）、日志关联、导出报告

### 颜色格式转换
- **痛点**：HEX/RGB/HSL 手动转换易错；无障碍对比度检查需额外工具
- **能力分级**：
  - 基础：HEX ↔ RGB ↔ HSL 互转
  - 进阶：可视化颜色选择器、oklch 支持、调色板生成
  - 高级：WCAG 对比度检查、颜色盲模拟、渐变生成

---

## 四、性能评估

| 场景 | 风险 | 解决方案 |
|------|------|----------|
| 大 JSON 文件（>5MB） | 主线程阻塞、UI 卡顿 | Web Worker 处理解析/格式化，流式渲染 |
| 日志文件（>10MB） | 内存溢出 | 虚拟滚动 + 分块加载，Web Worker 预处理 |
| 正则回溯（灾难性回溯） | 页面冻结 | 设置执行超时（100ms），Worker 隔离 |
| 多工具同时运行 | 内存膨胀 | 路由级懒加载，离开工具时清理 interval/worker |
| 首屏加载 | Bundle 过大 | 路由懒加载，首屏只加载 shell + 首页 |

**Bundle 预估**：
- Shell（路由 + 首页 + 共享组件）：~80KB gzipped
- 每个工具：~5-30KB gzipped（按需加载）
- 总计（全部工具）：~400KB gzipped

---

## 五、工作量总评估

| 阶段 | 内容 | 工作量 |
|------|------|--------|
| **Phase 1：平台骨架** | 路由、布局、工具注册机制、首页、现有 2FA 工具迁移 | 3天 |
| **Phase 2：P0 工具** | JSON 格式化、正则验证器、时间戳、Base64、URL 编解码 | 8天 |
| **Phase 3：P1 工具** | Diff、Hash、颜色、JWT、Cron、Markdown | 13天 |
| **Phase 4：P2 工具** | 日志分析、翻译、UUID、假数据、HTTP、ADB | 22天 |
| **合计** | 18 个工具 + 平台基础设施 | **~46天** |

Phase 1 + Phase 2 可在 **~2周** 内交付首个可用版本。

---

## 六、实施路径

### Phase 1：平台骨架（3天）
1. 安装 `react-router-dom`
2. 创建 `registry.ts` 工具注册表
3. 创建 `shell/` 布局组件（Layout、Sidebar、HomePage）
4. 迁移现有 2FA 工具到 `features/totp/`
5. 路由懒加载配置
6. 拆分 `components.css` 为 `layout.css` + `components.css` + 各工具独立 CSS

### Phase 2：P0 工具（8天）
按优先级逐个实现，每个工具：
1. 创建 `features/<tool>/index.tsx`
2. 实现核心逻辑
3. 注册到 `registry.ts`
4. 测试 + 响应式适配

### 验证方式
- `npm run dev` → 首页显示工具卡片
- 点击卡片 → 路由跳转到对应工具
- 每个工具的核心功能可用
- `npm run build` → 无报错
- 移动端布局正常

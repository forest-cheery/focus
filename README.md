# Focus — 个人任务管理

> 一个轻量级 PWA 待办应用，数据通过 **GitHub Gist** 跨设备同步，无需服务器。

![PWA](https://img.shields.io/badge/PWA-✓-5B0BB5?logo=pwa)
![GitHub Gist](https://img.shields.io/badge/Sync-GitHub%20Gist-24292F?logo=github)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📖 目录

- [快速开始](#-快速开始)
- [核心功能](#-核心功能)
- [项目结构](#-项目结构)
- [实现方法](#-实现方法)
- [数据同步说明](#-数据同步说明)
- [部署指南](#-部署指南)
- [FAQ](#-faq)
- [开发建议](#-开发建议)

---

## 🚀 快速开始

### 在线使用

直接访问部署后的页面（GitHub Pages / Netlify / Vercel 等），或直接打开 `index.html`：

```bash
# 本地预览
# 直接用浏览器打开 index.html 即可
# 或用任意静态服务器
python -m http.server 8000
# 访问 http://localhost:8000
```

### 首次使用步骤

1. **打开页面** → 看到加载动画后自动进入任务列表
2. **连接 Gist 同步**（可选，但推荐）：
   - 点击右下角底部导航 →「设置」
   - 在「云同步」中输入 [GitHub Personal Access Token](#-如何生成-github-token)
   - 点击「连接并同步」→ 自动创建/关联 Gist
3. **添加任务** → 点右下角「+」按钮 → 填写名称 → 创建
4. **多端同步** → 在另一设备上同样配置 Token，数据自动下拉合并

> **无 Token 也能用**：所有数据保存于浏览器 localStorage，单机可正常使用全部功能。

---

## 🎯 核心功能

### 任务管理

| 功能 | 操作方式 |
|:----|:---------|
| **添加任务** | 点击右下角 `+` 按钮 → 弹窗填写名称、截止日期、优先级、描述、进度 |
| **标记完成** | 点击任务卡片左侧圆圈按钮 ✓ |
| **编辑任务** | 点击任务卡片右上角 ✏️ 图标 |
| **删除任务** | 编辑弹窗中点击「删除任务」按钮 |
| **添加备注** | 点击任务卡片展开详情 → 输入备注 → 添加 |
| **调整进度** | 展开任务详情后拖动进度条 |
| **快速添加日期** | 日历页中点击某日 → 点「+ 添加」直接创建该日任务 |

### 筛选与排序

- **顶部标签栏**：全部 / 进行中 / 已完成 / 已超期 / 今日到期
- **智能分组**：已超期 → 今天 → 本周 → 未来 → 无期限 → 已完成
- **各组可折叠**：点击分组标题收起/展开
- **优先级排序**：高 > 中 > 低，未完成优先于已完成

### 日历视图

- **月视图日历**：切换月份，每日以圆点显示任务密度
- **颜色圆点**：🔵 进行中 / 🟢 已完成 / 🟠 今日到期 / 🔴 已超期
- **选中日期**：下方列出该日全部任务，可点击编辑

### 每日总结

- **统计卡片**：进行中 / 已完成 / 已超期 / 今日到期 四项统计
- **今日任务预览**：列出今日到期的所有任务
- **日记功能**：按日期保存文本日记，可前后翻页，自动保存

### 通知提醒

| 提醒类型 | 说明 | 可配置项 |
|:---------|:-----|:---------|
| **到期提醒** | 任务截止前提前通知 | 提前 15分钟 / 1小时 / 1天 |
| **逾期警告** | 任务超过截止时间即推送 | 开关 |
| **每日早报** | 每天早上推送今日任务概览 | 开关 + 推送时间 |

### 数据管理

- **导出备份**：下载完整 JSON 文件
- **导入恢复**：从备份文件恢复数据（覆盖模式）
- **清除已完成**：一键删除所有完成的任务
- **重置数据**：清空全部任务和日记
- **云端同步**：通过 GitHub Gist 跨设备同步

---

## 📁 项目结构

```
focus/
├── index.html          ← 唯一源文件（~82KB，约 1425 行）
│                       ├── CSS     (~380行) 深色主题样式
│                       ├── HTML    (~320行) 页面结构
│                       └── JS      (~700行) 全部逻辑
│                           ├── localStorage 封装层
│                           ├── GitHub Gist API 客户端
│                           ├── 任务 CRUD + 渲染
│                           ├── 日历 + 日记模块
│                           ├── 通知调度系统
│                           └── PWA Manifest + Service Worker
├── README.md           ← 本文件
└── .git/               ← Git 仓库
```

> 之所以只有一个文件，是因为 PWA 要求所有资源在离线时可访问。单 HTML 部署零配置，一份文件即整个应用。

---

## ⚙️ 实现方法

### 数据持久化

```
用户操作 → JavaScript → localStorage (同步写入)
                        ↓
                  3 秒防抖 → GitHub API → Gist (异步)
```

- **本地**：`localStorage.setItem('focus_tasks', JSON.stringify(tasks))`
- **云端**：`PATCH /gists/{id}` 更新 Gist 中的 `focus-data.json`
- **启动**：`init()` → 先读取 localStorage 渲染 → 后台拉取 Gist 覆盖

### GitHub Gist 同步流程

```mermaid
flowchart TD
    A[输入 Token] --> B[POST /user 验证]
    B --> C[GET /gists?per_page=100 查找已有 Gist]
    C --> D{找到 focus-data.json?}
    D -->|是| E[pullFromGist 拉取到本地]
    D -->|否| F[pushToGist 创建新 Gist]
    E --> G[render 渲染]
    F --> G
    G --> H[每次数据变更]
    H --> I[3 秒防抖]
    I --> J[PATCH /gists/{id} 更新]
```

### Service Worker 离线策略

```
安装时 → self.skipWaiting() (立即激活)
激活时 → 清除旧缓存
请求时 → cache-first: 命中缓存直接返回
       → 未命中: 网络请求 (仅缓存 fonts.googleapis)
       → github.com: 跳过缓存 (始终走网络)
```

### 通知系统

```
scheduleAllNotifications() 遍历所有任务:
  ┌─ 到期前提醒: 计算 (截止时间 - 提前量) → setTimeout
  ├─ 逾期推送:   计算 截止时间 → setTimeout
  ├─ 每日早报:   计算 08:00 → setTimeout
  └─ 去重:     NOTIF.getFired() 记录已触发 ID

限制: 页面关闭后 setTimeout 丢失 (PWA 浏览器限制)
```

---

## ☁️ 数据同步说明

### 如何生成 GitHub Token

1. 登录 GitHub → [Settings → Developer settings → Personal access tokens → Tokens (classic)](https://github.com/settings/tokens)
2. 点击 **Generate new token (classic)**
3. 填写 Note（如 "Focus Sync"）
4. 勾选 scope：**`gist`**（只需这一个权限）
5. 点击生成，**复制 Token**（离开页面后不可见）
6. 在 Focus 设置页粘贴 Token →「连接并同步」

> Token 为 `ghp_` 开头（classic）或 `github_pat_` 开头（fine-grained）。
> Token **仅保存在你的浏览器 localStorage**，不上传任何第三方。

### 同步策略

| 操作 | 行为 |
|:----|:-----|
| **数据变更** | 3 秒防抖后自动推送到 Gist |
| **首次连接** | 查找已有 Gist → 拉取 → 若没有则创建并推送 |
| **手动同步** | 点击顶部同步按钮 → 推送当前数据 |
| **从云端恢复** | 设置页「从云端恢复」→ 用 Gist 数据**覆盖**本地 |
| **冲突处理** | 最后写入者获胜（last-write-wins），无合并逻辑 |

### 数据安全

- Token 仅存在于 **localStorage**，不会泄露给第三方
- Gist 设置为 **private**（`public: false`）
- 应用本身无后端，全部逻辑在浏览器中执行
- 可随时导出 JSON 备份

---

## 🌐 部署指南

### GitHub Pages（推荐）

```bash
# 1. 创建 GitHub 仓库
git init
git add index.html README.md
git commit -m "init"

# 2. 推送到 GitHub
git remote add origin https://github.com/你的用户名/focus.git
git push -u origin main

# 3. 启用 GitHub Pages
#    → 仓库 Settings → Pages → Source: main / root
#    → 访问 https://你的用户名.github.io/focus
```

### 其他平台

| 平台 | 方式 | 备注 |
|:----|:-----|:-----|
| **Netlify** | 拖拽 `index.html` 到 Netlify Drop | HTTPS + 自定义域名 |
| **Vercel** | 直接连接 GitHub 仓库 | 自动部署 |
| **Cloudflare Pages** | 连接 Git 仓库 | 全球 CDN |
| **本地** | 直接双击 `index.html` | 离线可用，但 SW 需 HTTPS |

---

## ❓ FAQ

**Q: 不配置 Token 能正常使用吗？**
A: 可以。所有功能正常使用，只是不会云端同步。数据保存在浏览器 localStorage。

**Q: 换手机/清缓存后数据会丢吗？**
A: 如果配置过 Token，在设置页重新输入 Token →「连接并同步」即可从 Gist 恢复。建议定期导出备份。

**Q: Token 安全吗？**
A: Token 只需要 `gist` 权限（仅能创建/修改 Gist），无法读写你的仓库或个人信息。它只保存在你的设备。

**Q: 通知为什么有时不触发？**
A: 通知依赖页面打开状态（`setTimeout` 在 JS 主线程）。如果关闭了标签页，`setTimeout` 会被浏览器暂停。这是 PWA 的普遍限制。

**Q: 支持在电脑/平板/手机上同时使用吗？**
A: 支持。PWA 本质是网页，任何有浏览器的设备都能使用。配置同一 Token 即可多端同步。

---

## 💡 开发建议

### 如需扩展功能

1. **搜索功能** — 在任务列表上方加一个搜索输入框，过滤 `t.name` / `t.desc`
2. **标签系统** — 为任务添加 tag，按 tag 筛选
3. **重复任务** — 增加 `repeat` 字段，每日/每周自动生成
4. **WebDAV 同步** — 作为 Gist 之外的另一种同步后端（适合自建 NAS）
5. **暗/亮主题切换** — 定义 `:root[data-theme="light"]` 变量集

### 代码拆分时机

当 `index.html` 超过 **200KB** 或 **2000 行**时，建议拆分为：

```
src/
├── index.html       ← 仅引用 CSS + JS
├── styles.css       ← 抽出所有 CSS
├── app.js           ← 主逻辑
├── gist.js          ← Gist API 客户端
├── render.js        ← 渲染函数
├── notifications.js ← 通知系统
└── service-worker.js ← 单独的 SW 文件
```

---

## 📜 技术栈

| 技术 | 用途 |
|:----|:------|
| **原生 HTML5** | 页面结构 |
| **CSS3 Custom Properties** | 主题变量系统（`--bg`, `--accent` 等） |
| **Vanilla JavaScript** | 全部业务逻辑，零依赖 |
| **localStorage** | 本地数据持久化 |
| **GitHub REST API v3** | 云端同步（Gist） |
| **Service Worker API** | 离线缓存 |
| **Notification API** | 桌面/移动推送 |
| **Canvas API** | 动态生成 PWA 图标 |

> 整个应用 **零外部依赖** —— 没有 React/Vue/jQuery/axios，纯原生实现。

---

## 📄 License

MIT

# Get Things Done

一个基于 GTD（Getting Things Done）思想的轻量级任务管理应用，采用前后端分离架构：
- 前端：React + TypeScript + Vite
- 后端：Express + lowdb（JSON 文件持久化）

## 1. 功能概览

应用包含 8 个模块：
- `In-Box`：收集临时想法和待处理事项
- `Calendar`：按日期管理日历事项
- `Next-Action-List`：下一步行动清单
- `Project-List`：项目清单（多步骤事项）
- `Someday/Maybe-List`：未来也许会做
- `Waiting-For-List`：等待他人/外部条件
- `Reference`：参考资料
- `Trash`：回收区

核心能力：
- 任务新增、编辑、完成/未完成切换、删除
- 任务在模块之间移动
- 从 `In-Box` 一键转换为项目
- 项目内动作（Project Action）管理
- 拖拽排序（普通任务、项目、项目动作）
- 项目动作可同步显示到 `Next/Someday/Waiting` 三个模块
- 日历月视图 + 指定日期事项管理

## 2. 项目结构

```text
get-things-done/
  client/   # React 前端
  server/   # Express 后端
```

前端关键文件：
- `client/src/App.tsx`：应用状态与业务编排中心
- `client/src/lib/api.ts`：后端 API 请求封装
- `client/src/pages/StandaloneModulePage.tsx`：In-Box/Next/Someday/Waiting/Reference/Trash 页面
- `client/src/pages/ProjectsPage.tsx`：项目列表页面
- `client/src/pages/CalendarPage.tsx`：日历页面
- `client/src/types.ts`：核心类型定义

后端关键文件：
- `server/app.js`：REST API 与数据维护逻辑
- `server/db.json`：数据文件（lowdb 持久化）

## 3. 本地运行

先分别安装前后端依赖：

```bash
cd server
npm install

cd ../client
npm install
```

启动后端（默认 `http://localhost:3000`）：

```bash
cd server
node app.js
```

启动前端（Vite 默认 `http://localhost:5173`）：

```bash
cd client
npm run dev
```

说明：前端 API 基地址写死在 `client/src/lib/api.ts` 为 `http://localhost:3000`。

## 4. 数据模型

### 4.1 standaloneActions（普通任务）
- `id: string`
- `title: string`
- `completed: boolean`
- `module: 'inbox' | 'next' | 'someday' | 'waiting' | 'reference' | 'trash'`
- `order: number`
- `createdAt: string`
- `updatedAt: string`

### 4.2 projects（项目）
- `id: string`
- `title: string`
- `status: 'active' | 'trash'`
- `order: number`
- `createdAt: string`
- `updatedAt: string`
- `actions: ProjectAction[]`

### 4.3 ProjectAction（项目动作）
- `id: string`
- `title: string`
- `completed: boolean`
- `order: number`
- `syncTargets: { next: boolean; someday: boolean; waiting: boolean }`
- `createdAt: string`
- `updatedAt: string`

### 4.4 calendarItems（日历事项）
- `id: string`
- `date: string`（`YYYY-MM-DD`）
- `title: string`
- `completed: boolean`
- `createdAt: string`
- `updatedAt: string`

## 5. 后端 API 摘要

### 5.1 通用
- `GET /api/data`：获取完整应用数据（服务端会按 `order` 排序后返回）

### 5.2 普通任务（standalone actions）
- `POST /api/actions`
- `PATCH /api/actions/:id`
- `POST /api/actions/reorder`
- `DELETE /api/actions/:id`

### 5.3 项目（projects）
- `POST /api/projects/from-action`：将 In-Box 任务转换为项目
- `POST /api/projects/reorder`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`

### 5.4 项目动作（project actions）
- `POST /api/projects/:projectId/actions`
- `POST /api/projects/:projectId/actions/reorder`
- `PATCH /api/projects/:projectId/actions/:actionId`
- `DELETE /api/projects/:projectId/actions/:actionId`

### 5.5 日历事项（calendar items）
- `POST /api/calendar-items`
- `PATCH /api/calendar-items/:id`
- `DELETE /api/calendar-items/:id`

## 6. 关键业务规则

- 服务端启动时会执行 `normalizeDb()`：
  - 缺失数组字段自动补齐
  - `order` 字段自动修复
  - 项目状态非法值自动纠正为 `active`
  - 项目动作 `syncTargets/completed/时间字段` 自动补齐
  - 日历事项 `completed/时间字段` 自动补齐
- 拖拽排序后会调用对应 `reorder` 接口持久化顺序
- 项目或任务删除后会重排同分组内 `order`
- 只有 `In-Box` 中的普通任务可以转为项目
- `Next/Someday/Waiting` 页面会额外显示来自项目动作的同步项（只读映射展示）

## 7. 前端交互说明

- `App.tsx` 维护全局状态与编辑态，页面组件只负责展示和交互触发
- 每次写操作后会执行 `refreshData(false)` 从后端重新拉取，确保前后端数据一致
- 拖拽依赖 `@dnd-kit`，日历依赖 `FullCalendar`

## 8. 当前已知实现特点

- 数据存储为本地 JSON 文件，适合单机/开发场景，不适合多实例并发写入
- 未实现用户体系与权限隔离
- 未内置自动化测试（`server` 和 `client` 当前均未配置业务测试）
- 页面底部包含调试数据面板，会直接展示完整 JSON 数据

---

如果后续需要，我可以继续补一份「接口入参/出参示例」或「部署说明（Docker/Nginx）」文档。

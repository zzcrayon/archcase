# ArchCase 建筑案例灵感管理系统

## 在线预览

访问地址：[https://archcase.vercel.app](https://archcase.vercel.app)

ArchCase 是一个使用 React + Vite 构建的建筑案例灵感管理系统，面向建筑学学生和设计学习者。它可以用来收藏建筑案例、整理设计参考、记录设计启发，并通过评分、标签和数据统计帮助使用者建立自己的案例库。

项目使用 React + Vite 构建，适合作为前端练习项目、建筑作品集辅助工具，也适合作为 GitHub、Vercel 或 Netlify 上的个人作品展示。

注意：当前版本使用 `localStorage` 保存数据，本地新增、编辑或上传的内容只会保存在当前浏览器中。换电脑、换浏览器或清理缓存后数据可能丢失，建议定期使用 JSON 导出功能备份。

## 项目主要功能

- 建筑案例展示：以建筑作品集风格展示案例卡片。
- 搜索功能：支持按建筑名称、建筑师、城市、国家、类型、标签、简介和设计启发搜索。
- 分类筛选：支持住宅、文化建筑、教育建筑、商业建筑、工业遗产、景观建筑等类型筛选。
- 新增案例：通过表单添加新的建筑案例。
- 编辑案例：修改已有案例内容、图片、标签和评分。
- 删除案例：删除不需要的案例。
- localStorage 本地保存：新增、编辑、删除后的数据会保存在当前浏览器。
- 详情弹窗：点击卡片查看完整案例信息和学习分析区块。
- 图片点击放大：详情页图片支持全屏预览。
- Esc 快捷关闭：支持用 Esc 关闭图片预览和详情弹窗。
- 建筑案例评分系统：从空间组织、材料表达、结构创新、场地回应、设计启发 5 个维度评分。
- 数据统计面板：统计案例总数、类型分布、平均评分、高频标签和高分案例。
- JSON 导入 / 导出：支持备份和恢复案例库数据。
- 本地图片上传：支持 jpg、jpeg、png、webp 图片上传，并保存到案例数据中。

## 技术栈

- React
- Vite
- JavaScript
- CSS
- localStorage
- FileReader

## 项目运行方法

第一次运行前安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

启动后，按照终端提示打开本地地址，通常是：

```bash
http://localhost:5173
```

## 项目打包方法

生成生产环境文件：

```bash
npm run build
```

打包后的文件会生成在 `dist/` 目录中。

本地预览打包结果：

```bash
npm run preview
```

## 项目结构

```text
ArchCase
├─ src
│  ├─ assets
│  │  └─ cases
│  ├─ components
│  │  ├─ CaseCard.jsx
│  │  ├─ CaseDetailModal.jsx
│  │  ├─ CaseModal.jsx
│  │  ├─ DataTools.jsx
│  │  └─ StatsPanel.jsx
│  ├─ data
│  │  └─ cases.js
│  ├─ utils
│  │  └─ ratings.js
│  ├─ App.jsx
│  ├─ main.jsx
│  └─ styles.css
├─ index.html
├─ package.json
├─ vite.config.js
└─ README.md
```

## 文件说明

- `src/App.jsx`：应用主组件，负责案例列表状态、搜索筛选、新增编辑删除、导入导出和弹窗控制。
- `src/main.jsx`：React 入口文件。
- `src/styles.css`：全局样式文件，包含页面布局、卡片、弹窗、表单和响应式样式。
- `src/data/cases.js`：默认建筑案例数据。
- `src/utils/ratings.js`：评分维度、默认评分、平均分和星级显示工具函数。
- `src/components/CaseCard.jsx`：单张建筑案例卡片。
- `src/components/CaseModal.jsx`：新增和编辑案例共用的表单弹窗。
- `src/components/CaseDetailModal.jsx`：案例详情弹窗和图片放大预览。
- `src/components/StatsPanel.jsx`：数据概览、类型分布、高频标签和高分案例统计。
- `src/components/DataTools.jsx`：JSON 数据导入和导出。

## 已完成功能列表

- 建筑案例展示
- 搜索功能
- 分类筛选
- 新增案例
- 编辑案例
- 删除案例
- localStorage 本地保存
- 详情弹窗
- 图片点击放大
- Esc 快捷关闭
- 建筑案例评分系统
- 数据统计面板
- JSON 导入 / 导出
- 本地图片上传

## 适合建筑学学生的使用场景

- 整理课程设计或竞赛前期调研案例。
- 收藏大师作品、当代建筑案例和自己感兴趣的空间参考。
- 通过标签记录案例关键词，例如光线、混凝土、庭院、场地、结构等。
- 用评分系统比较不同案例在空间、材料、结构、场地和启发性上的特点。
- 用数据统计面板观察自己的案例库是否过于偏向某一类型，帮助补全研究范围。
- 通过 JSON 导出功能备份自己的案例资料，方便换电脑或长期保存。

## localStorage 数据提醒

本项目的数据保存在浏览器的 `localStorage` 中。

需要注意：

- localStorage 数据只保存在当前浏览器。
- 换电脑、换浏览器、清理浏览器缓存后，数据可能丢失。
- 建议定期使用“导出数据”功能，把案例库备份为 `archcase-data.json`。
- 如果上传了本地图片，图片会以 base64 文本保存在数据中，JSON 文件可能变大，建议上传压缩后的图片。

## 后续可扩展方向

- 增加案例排序功能，例如按年份、评分或创建时间排序。
- 增加标签筛选功能。
- 增加暗色模式。
- 增加案例收藏或重点标记。
- 增加云端数据库，让数据可以跨设备同步。
- 增加登录系统，区分不同用户的案例库。
- 增加图片压缩功能，减少 localStorage 占用。
- 增加 Markdown 笔记区，用于记录更完整的案例分析。

## 部署建议

部署到 Vercel 或 Netlify 时，一般流程是：

1. 把项目上传到 GitHub。
2. 在 Vercel 或 Netlify 中导入这个 GitHub 仓库。
3. 构建命令填写 `npm run build`。
4. 输出目录填写 `dist`。

部署完成后，就可以得到一个公开访问的网址。

# ArchCase 后端服务

这是 ArchCase 的第一版本地后端服务，使用 Node.js + Express 搭建。

## 功能

- `GET /api/health`：检查后端是否运行
- `GET /api/cases`：获取全部案例
- `POST /api/cases`：新增案例
- `PUT /api/cases/:id`：编辑案例
- `DELETE /api/cases/:id`：删除案例
- `POST /api/upload`：上传图片，图片会保存到 `server/uploads`
- `POST /api/admin/login`：管理员登录

## 临时数据库

当前使用 `server/data/cases.json` 保存案例数据，适合本地开发阶段使用。

## 启动方法

先进入后端目录：

```bash
cd server
```

安装依赖：

```bash
npm install
```

复制环境变量示例文件，并设置自己的管理员密码：

```bash
copy .env.example .env
```

然后打开 `.env`，修改：

```bash
ADMIN_PASSWORD=你的管理员密码
```

启动后端：

```bash
npm run dev
```

后端默认运行在：

```bash
http://localhost:3001
```

## 测试健康检查接口

浏览器打开：

```bash
http://localhost:3001/api/health
```

如果看到 `status: "ok"`，说明后端已经启动成功。

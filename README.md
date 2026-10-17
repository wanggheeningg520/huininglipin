# 慧宁甄选礼品商城（一期）

微信小程序礼品商城一期工程，采用 pnpm workspace monorepo 结构。

## 工程结构

```
huining-gift-mall/
├── backend/          # NestJS 后端（模块化单体）
├── docker-compose.yml
├── .env.example
└── pnpm-workspace.yaml
```

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动本地依赖（MySQL + Redis）
docker-compose up -d mysql redis

# 启动后端开发服务
pnpm dev

# 构建
pnpm build
```

## 技术栈

- 后端：NestJS 10 + TypeORM + MySQL 8 + ioredis + Passport JWT + @nestjs/schedule + Swagger
- 鉴权：C 端 JWT（微信登录）/ 后台 JWT + RBAC
- 支付：微信支付 v3 RSA 验签
- 日志：winston + traceId 链路追踪
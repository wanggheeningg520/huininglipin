# ============================================================
# 慧宁甄选礼品商城 后端 Dockerfile（对应 design.md 2.6.1）
# 多阶段构建：构建层 + 运行层
# ============================================================

# ---- 构建层 ----
FROM node:20-alpine AS builder
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 拷贝 package.json 与 lockfile
COPY package.json ./
COPY pnpm-lock.yaml* ./

# 安装依赖（含 devDependencies 用于构建）
RUN pnpm install --frozen-lockfile || pnpm install

# 拷贝源码
COPY . .

# 构建
RUN pnpm build

# ---- 运行层 ----
FROM node:20-alpine AS runner
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 拷贝 package.json
COPY package.json ./

# 仅安装生产依赖
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

# 拷贝构建产物
COPY --from=builder /app/dist ./dist

# 拷贝建表 SQL（供迁移脚本使用）
COPY src/infrastructure/database/migrations ./src/infrastructure/database/migrations

# 时区
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

# 非特权用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs nestjs
USER nestjs

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/product/categories || exit 1

EXPOSE 3000

# 启动
CMD ["node", "dist/main"]
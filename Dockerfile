# --- 阶段 1: 构建阶段 ---
FROM node:18-alpine AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- 阶段 2: 生产运行阶段 ---
FROM nginx:stable-alpine
# 从构建阶段复制打包好的文件到 Nginx 默认目录
COPY --from=build-stage /app/dist /usr/share/nginx/html
# 暴露 Nginx 80 端口
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

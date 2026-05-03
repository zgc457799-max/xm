FROM node:18-slim

# 安装编译器和运行环境 (用于本地判题)
RUN apt-get update && apt-get install -y \
    python3 \
    gcc \
    g++ \
    default-jdk \
    curl \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# 安装 Docker CLI (用于在容器内调用宿主机 Docker)
RUN curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh

WORKDIR /app

# 复制依赖文件并安装
COPY package*.json ./
RUN npm install

# 复制源码
COPY . .

# 生产环境下执行 TypeScript 编译
RUN npm run build

# 暴露后端端口
EXPOSE 3001

# 生产环境启动命令
CMD ["npm", "start"]

# EduCode AI - Docker 镜像拉取脚本 (Windows)
# 运行此脚本以确保判题服务所需的所有环境都已就绪

Write-Host "正在检查并拉取判题所需 Docker 镜像..." -ForegroundColor Cyan

$images = @(
    "gcc:12",
    "python:3.8-alpine",
    "eclipse-temurin:11-jdk"
)

foreach ($image in $images) {
    Write-Host "正在处理: $image" -ForegroundColor Yellow
    docker pull $image
}

Write-Host "所有镜像处理完成！" -ForegroundColor Green
Write-Host "现在您可以尝试在系统中运行 C/C++/Python/Java 代码了。"

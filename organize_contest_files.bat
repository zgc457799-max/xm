@echo off
chcp 65001 > nul
echo 正在开始整理比赛文件...

set BASE_DIR=2026120110035-参赛总文件夹
set DIR1=%BASE_DIR%\2026120110035-01作品与答辩材料
set DIR2=%BASE_DIR%\2026120110035-02素材与源码
set DIR3=%BASE_DIR%\2026120110035-03设计与开发文档
set DIR4=%BASE_DIR%\2026120110035-04作品演示视频

echo 创建文件夹结构...
mkdir "%DIR1%" 2>nul
mkdir "%DIR2%" 2>nul
mkdir "%DIR3%" 2>nul
mkdir "%DIR4%" 2>nul

echo 创建 readme.txt 文件...
echo 简要说明本文件夹作用，以及对各文件的描述。 > "%DIR1%\readme.txt"
echo 作用：存放作品的安装部署文件及答辩相关材料。 >> "%DIR1%\readme.txt"
echo 包含文件： >> "%DIR1%\readme.txt"
echo - 答辩演示文档(PPT及PDF版本) 【待补充】 >> "%DIR1%\readme.txt"
echo - 答辩视频(MP4) 【待补充】 >> "%DIR1%\readme.txt"
echo - 运行网址或安装包/部署说明 【待补充】 >> "%DIR1%\readme.txt"

echo 简要说明本文件夹作用，以及对各文件的描述。 > "%DIR2%\readme.txt"
echo 作用：存放作品的全部源代码及代表性素材（压缩包）。 >> "%DIR2%\readme.txt"
echo 包含文件： >> "%DIR2%\readme.txt"
echo - 2026120110035-素材源码.zip（包含前后端代码及相关素材） 【由脚本自动生成】 >> "%DIR2%\readme.txt"

echo 简要说明本文件夹作用，以及对各文件的描述。 > "%DIR3%\readme.txt"
echo 作用：存放作品的设计、开发文档及AI使用说明。 >> "%DIR3%\readme.txt"
echo 包含文件： >> "%DIR3%\readme.txt"
echo - 作品信息概要(PDF) 【待补充】 >> "%DIR3%\readme.txt"
echo - 设计和开发文档(PDF) 【待补充】 >> "%DIR3%\readme.txt"
echo - AI工具使用说明(PDF) 【待补充】 >> "%DIR3%\readme.txt"
echo - AI佐证材料(如有) 【待补充】 >> "%DIR3%\readme.txt"

echo 简要说明本文件夹作用，以及对各文件的描述。 > "%DIR4%\readme.txt"
echo 作用：存放作品的实际运行演示视频。 >> "%DIR4%\readme.txt"
echo 包含文件： >> "%DIR4%\readme.txt"
echo - 作品演示视频(MP4) 【待补充】 >> "%DIR4%\readme.txt"

echo 清理冗余文件...
del /q /f background_blur_error_report.md 2>nul
del /q /f home_redirect_error_report.md 2>nul
del /q /f image_usage_analysis.md 2>nul
del /q /f login_blank_page_error_report.md 2>nul
del /q /f login_error_report.md 2>nul
del /q /f login_view_error_report.md 2>nul
del /q /f server\db_log.txt 2>nul
del /q /f server.rar 2>nul

echo 正在打包源码... (请确保已安装 tar，Windows 10/11 默认自带)
tar.exe -a -c -f "%DIR2%\2026120110035-素材源码.zip" --exclude="node_modules" --exclude=".git" --exclude="server/node_modules" --exclude="%BASE_DIR%" *

echo 整理完成！请检查 "%BASE_DIR%" 文件夹。
pause
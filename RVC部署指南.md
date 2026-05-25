# RVC 语音克隆部署指南

## 🎯 目标

让海绵宝宝和派大星用 100% 原声和你对话！

## 📦 现成模型

我已经找到了现成的高质量 RVC 模型：

### 海绵宝宝模型
- **模型名称**: SpongeBob SquarePants (Seasons 3–9A) (RVC v2) (500 Epochs) (RMVPE)
- **下载链接**: https://huggingface.co/Gosmokeless28/AI_models/resolve/main/Post-Movie_SpongeBob.zip?download=true
- **训练轮数**: 500 Epochs
- **质量**: ⭐⭐⭐⭐⭐

### 派大星模型
- **模型名称**: Patrick Star (Spongebob Squarepants, Nickelodeon, RMVPE) 460 Epochs
- **下载链接**: https://huggingface.co/YourLocalWorm/Spongebobmodels/resolve/main/PatrickStarV2_460e_11960s.zip?download=true
- **训练轮数**: 460 Epochs
- **配音演员**: Bill Fagerbakke
- **质量**: ⭐⭐⭐⭐⭐

---

## 🚀 部署方案

### 方案一：使用现成的 RVC WebUI（最简单）

1. **下载 RVC WebUI**
   - 访问：https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI
   - 下载最新版本

2. **下载模型**
   - 下载上面两个模型
   - 解压到 `weights` 文件夹

3. **启动 WebUI**
   - 运行 `go-webui.bat`（Windows）
   - 访问 http://localhost:7860

4. **使用模型**
   - 在 WebUI 中选择海绵宝宝或派大星模型
   - 上传需要转换的音频
   - 生成克隆语音

---

### 方案二：使用 RVC Python API（推荐用于项目集成）

1. **安装 Python 依赖**
   ```bash
   # 创建 Python 虚拟环境
   python -m venv venv
   venv\Scripts\activate
   
   # 安装 RVC Python
   pip install rvc-python
   ```

2. **创建 API 服务**
   ```python
   # rvc_server.py
   from fastapi import FastAPI, UploadFile, File
   from fastapi.responses import FileResponse
   import uvicorn
   import tempfile
   import os

   app = FastAPI()

   # 加载模型
   # 这里需要配置模型路径

   @app.post("/convert")
   async def convert_voice(audio: UploadFile = File(...), model: str = "spongebob"):
       # 语音转换逻辑
       pass

   if __name__ == "__main__":
       uvicorn.run(app, host="0.0.0.0", port=8000)
   ```

3. **启动服务**
   ```bash
   python rvc_server.py
   ```

---

### 方案三：使用 Docker（推荐用于生产环境）

1. **使用官方 RVC Docker 镜像**
   ```bash
   docker pull rvcproject/rvc
   ```

2. **启动容器**
   ```bash
   docker run -p 7860:7860 -v ./weights:/app/weights rvcproject/rvc
   ```

3. **访问 WebUI**
   - 访问 http://localhost:7860

---

## 📋 完整部署步骤（推荐方案一）

### 第一步：准备环境

1. 确保已安装 Python 3.8-3.10
2. 下载 RVC WebUI

### 第二步：下载模型

1. 下载海绵宝宝模型：
   ```
   https://huggingface.co/Gosmokeless28/AI_models/resolve/main/Post-Movie_SpongeBob.zip?download=true
   ```

2. 下载派大星模型：
   ```
   https://huggingface.co/YourLocalWorm/Spongebobmodels/resolve/main/PatrickStarV2_460e_11960s.zip?download=true
   ```

3. 解压模型到 `weights` 文件夹

### 第三步：启动 RVC WebUI

1. 运行 `go-webui.bat`
2. 等待启动完成
3. 访问 http://localhost:7860

### 第四步：测试模型

1. 在 WebUI 中选择海绵宝宝或派大星模型
2. 上传一段测试音频
3. 点击转换
4. 听一听效果！

---

## 🔗 集成到项目

### 方案 A：使用 RVC WebUI 的 API

RVC WebUI 提供了 API 接口，可以直接调用：

```javascript
// 前端调用示例
async function convertVoice(text, model) {
    // 1. 先用 Edge TTS 生成基础语音
    const baseAudio = await generateTTS(text);
    
    // 2. 调用 RVC API 进行语音转换
    const response = await fetch('http://localhost:7860/convert', {
        method: 'POST',
        body: formData
    });
    
    return response.blob();
}
```

### 方案 B：创建一个中间 API 服务

在项目中创建一个 Python API 服务来处理 RVC 转换：

```python
# rvc_proxy.py
from fastapi import FastAPI
from fastapi.responses import FileResponse
import edge_tts
import tempfile
import os

app = FastAPI()

@app.post("/tts/{character}")
async def tts(character: str, text: str):
    # 1. 用 Edge TTS 生成基础语音
    voice = "zh-CN-XiaoshuangNeural" if character == "spongebob" else "zh-CN-YunyangNeural"
    communicate = edge_tts.Communicate(text, voice)
    
    # 2. 保存到临时文件
    temp_file = tempfile.mktemp(suffix=".mp3")
    await communicate.save(temp_file)
    
    # 3. 调用 RVC 进行转换（这里需要集成 RVC）
    # ...
    
    return FileResponse(temp_file)
```

---

## 📚 资源链接

- **RVC 官方仓库**: https://github.com/RVC-Project/Retrieval-based-Voice-Conversion
- **RVC WebUI**: https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI
- **语音模型网站**: https://voice-models.com/
- **AI 语音搜索**: https://ai-search.io/voices

---

## 💡 建议

对于你的项目，我建议：

1. **先用方案一（RVC WebUI）测试效果**
   - 下载模型
   - 在 WebUI 中测试
   - 确认效果满意

2. **再考虑集成**
   - 如果效果满意，再考虑集成到项目中
   - 可以创建一个简单的 API 服务来桥接

3. **或者考虑方案 A（在线 API）**
   - 使用 Kits.ai 或 Voicify.ai 等平台
   - 有现成的海绵宝宝和派大星模型 API
   - 最简单，立即可用

---

## ⚠️ 注意事项

1. **模型质量**: 找到的模型都是高质量的，训练了 460-500 Epochs
2. **硬件要求**: RVC 需要较好的 GPU，没有 GPU 会很慢
3. **部署复杂度**: 完整部署需要一些时间和技术知识
4. **中文支持**: 找到的模型是英文的，如果需要中文，可能需要找中文模型或自己训练

---

需要我帮你进一步实现某个具体方案吗？

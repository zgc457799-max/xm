const { EdgeTTS } = require('edge-tts-universal');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../public/audio');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

async function generate(text, voice, filename) {
    console.log(`Generating ${filename}...`);
    const tts = new EdgeTTS(text, voice);
    const result = await tts.synthesize();
    const buffer = Buffer.from(await result.audio.arrayBuffer());
    fs.writeFileSync(path.join(outputDir, filename), buffer);
    console.log(`Saved ${filename}`);
}

async function main() {
    try {
        // 温馨海狸 (Yunxia)
        await generate('我准备好了！', 'zh-CN-YunxiaNeural', 'beaver_ready.mp3');
        await generate('哈哈，这太有趣了！', 'zh-CN-YunxiaNeural', 'beaver_laugh.mp3');

        // 桃光精灵 (Xiaoyi)
        await generate('我来帮忙啦！', 'zh-CN-XiaoyiNeural', 'fairy_ready.mp3');
        await generate('嘻嘻，真棒！', 'zh-CN-XiaoyiNeural', 'fairy_laugh.mp3');

        console.log("All audio generated successfully!");
    } catch (e) {
        console.error("Error:", e);
    }
}

main();

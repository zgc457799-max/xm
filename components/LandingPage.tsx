import React from 'react';
import { Monitor, Smartphone, Globe } from 'lucide-react';

interface LandingPageProps {
  onEnterWeb: () => void;
}

export default function LandingPage({ onEnterWeb }: LandingPageProps) {
  return (
    <div className="landing-page-container relative w-full h-screen overflow-hidden bg-[#02040f] font-sans text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Noto+Sans+SC:wght@400;700;900&display=swap');

        .landing-page-container {
          font-family: 'Noto Sans SC', sans-serif;
        }

        /* 宇宙背景渐变 & 光效 */
        .landing-bg-space {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at 70% 30%, rgba(98, 24, 184, 0.4) 0%, transparent 50%),
                        radial-gradient(circle at 20% 80%, rgba(14, 115, 230, 0.4) 0%, transparent 40%);
            z-index: 1;
        }

        /* 波浪形发光粒子线 (用背景图模拟) */
        .landing-bg-waves {
            position: absolute;
            inset: 0;
            background-image: 
                radial-gradient(1px 1px at 10% 20%, #0ff 100%, transparent),
                radial-gradient(2px 2px at 30% 50%, #f0f 100%, transparent),
                radial-gradient(1.5px 1.5px at 80% 40%, #0ff 100%, transparent),
                radial-gradient(2px 2px at 60% 80%, #f0f 100%, transparent);
            background-size: 150px 150px;
            opacity: 0.6;
            animation: moveStars 60s linear infinite;
            z-index: 2;
        }

        @keyframes moveStars {
            0% { background-position: 0 0; }
            100% { background-position: 1000px 1000px; }
        }

        /* 赛博朋克边框 */
        .landing-cyber-border {
            position: absolute;
            inset: 20px;
            border: 2px solid rgba(0, 255, 255, 0.2);
            border-radius: 20px;
            box-shadow: inset 0 0 50px rgba(0, 255, 255, 0.05);
            z-index: 5;
            pointer-events: none;
        }

        .landing-cyber-border::before, .landing-cyber-border::after {
            content: '';
            position: absolute;
            width: 100px;
            height: 100px;
            border: 4px solid #00f0ff;
        }
        .landing-cyber-border::before {
            top: -2px; left: -2px;
            border-right: none; border-bottom: none;
            border-top-left-radius: 20px;
            filter: drop-shadow(0 0 10px #00f0ff);
        }
        .landing-cyber-border::after {
            bottom: -2px; right: -2px;
            border-left: none; border-top: none;
            border-bottom-right-radius: 20px;
            filter: drop-shadow(0 0 10px #00f0ff);
        }

        /* 主体内容区 */
        .landing-content {
            position: relative;
            z-index: 10;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        /* 标题文字样式 */
        .landing-title-glow {
            font-size: clamp(3rem, 8vw, 6rem);
            font-weight: 900;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(0, 200, 255, 0.8);
            letter-spacing: 0.1em;
            margin-bottom: 0.5rem;
            background: linear-gradient(to bottom, #ffffff, #88ccff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-family: 'Orbitron', 'Noto Sans SC', sans-serif;
            text-align: center;
        }

        .landing-subtitle {
            font-size: clamp(1rem, 2.5vw, 1.5rem);
            color: #88ccff;
            letter-spacing: 0.3em;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 4rem;
            text-align: center;
        }

        .landing-subtitle::before, .landing-subtitle::after {
            content: '';
            height: 1px;
            width: 50px;
            background: #88ccff;
            box-shadow: 0 0 10px #88ccff;
        }

        @media (max-width: 640px) {
           .landing-subtitle::before, .landing-subtitle::after {
              display: none;
           }
        }

        /* 全息悬浮操作台 */
        .landing-hologram-pad {
            position: relative;
            width: 90%;
            max-width: 900px;
            padding: 40px;
            background: rgba(10, 20, 40, 0.6);
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 16px;
            backdrop-filter: blur(10px);
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 30px rgba(0, 255, 255, 0.1);
            transform: perspective(1000px) rotateX(10deg);
            display: flex;
            justify-content: center;
            gap: 30px;
            flex-wrap: wrap;
            animation: float 4s ease-in-out infinite;
        }

        /* 全息底座发光环 */
        .landing-hologram-base {
            position: absolute;
            bottom: -60px;
            left: 50%;
            transform: translateX(-50%) rotateX(70deg);
            width: 110%;
            height: 300px;
            border-radius: 50%;
            border: 2px solid rgba(0, 255, 255, 0.5);
            box-shadow: 0 0 50px rgba(0, 255, 255, 0.4), inset 0 0 50px rgba(0, 255, 255, 0.4);
            z-index: -1;
            pointer-events: none;
        }
        .landing-hologram-base::after {
            content: '';
            position: absolute;
            inset: 20px;
            border-radius: 50%;
            border: 1px dashed rgba(255, 0, 255, 0.6);
            animation: spin 10s linear infinite;
        }

        @keyframes float {
            0%, 100% { transform: perspective(1000px) rotateX(10deg) translateY(0); }
            50% { transform: perspective(1000px) rotateX(10deg) translateY(-20px); }
        }
        @keyframes spin {
            100% { transform: rotate(360deg); }
        }

        /* 下载按钮样式 */
        .landing-btn-cyber {
            position: relative;
            padding: 20px 30px;
            background: rgba(0, 10, 30, 0.8);
            border: 1px solid rgba(0, 255, 255, 0.5);
            color: #fff;
            text-transform: uppercase;
            font-size: 1.1rem;
            font-weight: bold;
            letter-spacing: 2px;
            cursor: pointer;
            overflow: hidden;
            transition: all 0.3s;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 240px;
            clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
            text-decoration: none;
        }

        .landing-btn-cyber.android {
            border-color: rgba(255, 0, 255, 0.5);
        }

        .landing-btn-cyber.web {
            border-color: rgba(255, 200, 0, 0.5);
        }

        .landing-btn-cyber:hover {
            background: rgba(0, 255, 255, 0.2);
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.6);
            transform: translateY(-5px);
        }
        .landing-btn-cyber.android:hover {
            background: rgba(255, 0, 255, 0.2);
            box-shadow: 0 0 30px rgba(255, 0, 255, 0.6);
        }
        .landing-btn-cyber.web:hover {
            background: rgba(255, 200, 0, 0.2);
            box-shadow: 0 0 30px rgba(255, 200, 0, 0.6);
        }

        .landing-btn-cyber::before {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 50%; height: 100%;
            background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
            transform: skewX(-20deg);
            transition: 0.5s;
        }
        .landing-btn-cyber:hover::before {
            left: 150%;
        }

        .landing-btn-cyber .icon-wrapper {
            color: #00f0ff;
        }
        .landing-btn-cyber.android .icon-wrapper {
            color: #f0f;
        }
        .landing-btn-cyber.web .icon-wrapper {
            color: #ffc800;
        }

        /* 浮动标签 */
        .landing-floating-label {
            position: absolute;
            padding: 8px 16px;
            border: 1px solid rgba(0, 255, 255, 0.5);
            border-radius: 20px;
            background: rgba(0, 20, 40, 0.6);
            color: #00f0ff;
            font-size: 0.9rem;
            box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
            backdrop-filter: blur(5px);
            z-index: 20;
            pointer-events: none;
        }
        .label-1 { top: 25%; right: 15%; animation: float 5s ease-in-out infinite 1s; }
        .label-2 { bottom: 15%; right: 20%; color: #f0f; border-color: rgba(255,0,255,0.5); animation: float 6s ease-in-out infinite 2s; }
        .label-3 { top: 35%; left: 10%; animation: float 4s ease-in-out infinite 0.5s; }

        @media (max-width: 1024px) {
           .landing-floating-label { display: none; }
        }
      `}</style>

      {/* 背景层 */}
      <div className="landing-bg-space"></div>
      <div className="landing-bg-waves"></div>
      
      {/* 边框层 */}
      <div className="landing-cyber-border hidden sm:block"></div>

      {/* 浮动标签 */}
      <div className="landing-floating-label label-1">全息互动实验室</div>
      <div className="landing-floating-label label-2">AI智能导师</div>
      <div className="landing-floating-label label-3">课程体系 / 学习社区</div>

      {/* 主体内容 */}
      <div className="landing-content">
        <h1 className="landing-title-glow">未来科技学院</h1>
        <div className="landing-subtitle">探索宇宙知识边界</div>

        <div className="landing-hologram-pad">
          {/* 底座发光环 */}
          <div className="landing-hologram-base hidden md:block"></div>

          {/* Windows 下载按钮 */}
          <a href="https://github.com/zgc457799-max/xm/releases/latest/download/EduCode_AI_Windows.zip" className="landing-btn-cyber">
            <div className="icon-wrapper">
              <Monitor size={48} strokeWidth={1.5} />
            </div>
            <span>Windows 下载</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.7, color: '#88ccff' }}>DESKTOP CLIENT</span>
          </a>

          {/* Android 下载按钮 */}
          <a href="https://github.com/zgc457799-max/xm/releases/latest/download/EduCode-AI-Android-APK.zip" className="landing-btn-cyber android">
            <div className="icon-wrapper">
              <Smartphone size={48} strokeWidth={1.5} />
            </div>
            <span>Android 下载</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.7, color: '#f0f' }}>MOBILE APP</span>
          </a>

          {/* 网页端直达按钮 */}
          <button onClick={onEnterWeb} className="landing-btn-cyber web">
             <div className="icon-wrapper">
              <Globe size={48} strokeWidth={1.5} />
            </div>
            <span>网页端直达</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.7, color: '#ffc800' }}>WEB PORTAL</span>
          </button>
        </div>
      </div>
    </div>
  );
}

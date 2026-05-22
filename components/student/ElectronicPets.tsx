import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Flame, Trophy, CheckCircle, Sparkles, BookOpen, Bot, ChevronRight, Minimize2, Maximize2, Cpu, Send, Mic, MicOff, Volume2, VolumeX, User } from 'lucide-react';
import { getStudentStats, getMyMastery, getMistakeBook, analyzeProblem } from '../../services/api';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

// ================= Canvas Holographic Waveform Component =================
const PetCanvasBackground = ({ petType, state }: { petType: 'spongebob' | 'patrick', state: 'idle' | 'thinking' | 'speaking' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      // Color scheme based on character
      const neonColor = petType === 'spongebob' ? 'rgba(34, 211, 238, ' : 'rgba(236, 72, 153, ';

      // Adjust wave parameters based on character state
      let numWaves = 3;
      let amplitude = 12;
      let frequency = 0.015;
      let speed = 0.04;

      if (state === 'thinking') {
        amplitude = 5;
        frequency = 0.035;
        speed = 0.12;
        numWaves = 4;
      } else if (state === 'speaking') {
        amplitude = 22;
        frequency = 0.022;
        speed = 0.08;
        numWaves = 5;
      } else { // idle
        amplitude = 10;
        frequency = 0.01;
        speed = 0.02;
        numWaves = 2;
      }

      ctx.lineWidth = 1.8;

      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath();
        const alpha = (0.2 + (0.35 * (numWaves - i) / numWaves)).toFixed(2);
        ctx.strokeStyle = `${neonColor}${alpha})`;
        
        ctx.shadowBlur = i === 0 ? 10 : 0;
        ctx.shadowColor = petType === 'spongebob' ? '#22d3ee' : '#ec4899';

        const offsetPhase = phase + i * (Math.PI / 4);

        for (let x = 0; x < width; x++) {
          const edgeScaler = Math.sin((x / width) * Math.PI); // Smooth fade at edges
          const y = centerY + Math.sin(x * frequency + offsetPhase) * amplitude * edgeScaler;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      phase += speed;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [petType, state]);

  return (
    <canvas
      ref={canvasRef}
      width={180}
      height={180}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-70 z-0"
    />
  );
};

// ================= SpongeBob Sci-Fi Robot 3D Model Component =================
const SpongeBobModel = ({
  isSpeaking,
  isThinking,
  mouseOffset,
  bounce
}: {
  isSpeaking: boolean;
  isThinking: boolean;
  mouseOffset: { x: number; y: number };
  bounce: boolean;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const characterRef = useRef<THREE.Mesh>(null);
  const jumpTimeRef = useRef<number | null>(null);

  // Load high-fidelity SpongeBob cyber pet texture
  const texture = useLoader(THREE.TextureLoader, '/spongebob_pet.png');

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // 1. Float and Jump Animations
    if (groupRef.current) {
      let floatY = Math.sin(t * 2) * 0.08;
      let floatRotZ = Math.sin(t * 1.5) * 0.02;

      if (bounce) {
        if (jumpTimeRef.current === null) {
          jumpTimeRef.current = t;
        }
        const elapsed = t - jumpTimeRef.current;
        const duration = 0.8; // 800ms
        if (elapsed < duration) {
          const progress = elapsed / duration;
          floatY += Math.sin(progress * Math.PI) * 0.8;
          groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            mouseOffset.x * 0.4 + Math.sin(progress * Math.PI) * 2 * Math.PI,
            0.1
          );
        } else {
          jumpTimeRef.current = null;
        }
      } else {
        jumpTimeRef.current = null;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouseOffset.x * 0.4, 0.1);
      }

      groupRef.current.position.y = floatY;
      groupRef.current.rotation.z = floatRotZ;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -mouseOffset.y * 0.3, 0.1);
    }

    // 2. Speak & Thinking Squash/Stretch Animations on the high-fidelity image plane
    if (characterRef.current) {
      if (isSpeaking) {
        characterRef.current.scale.y = 1.0 + Math.sin(t * 18) * 0.05;
        characterRef.current.scale.x = 1.0 - Math.sin(t * 18) * 0.03;
      } else if (isThinking) {
        characterRef.current.scale.y = 1.0 + Math.sin(t * 8) * 0.02;
        characterRef.current.scale.x = 1.0 + Math.sin(t * 8) * 0.02;
      } else {
        characterRef.current.scale.y = THREE.MathUtils.lerp(characterRef.current.scale.y, 1.0, 0.2);
        characterRef.current.scale.x = THREE.MathUtils.lerp(characterRef.current.scale.x, 1.0, 0.2);
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.05, 0]}>
      {/* 3D Sci-Fi Rounded Capsule Frame (Behind SpongeBob, from Image) */}
      <group position={[0, 0.1, -0.38]}>
        {/* Rounded Glass Back Panel */}
        <mesh>
          <boxGeometry args={[1.35, 2.1, 0.02]} />
          <meshStandardMaterial color="#00F0FF" transparent opacity={0.12} roughness={0.1} metalness={0.1} />
        </mesh>
        
        {/* Glowing Cyan Border */}
        <mesh position={[-0.67, 0, 0.015]}>
          <boxGeometry args={[0.015, 2.1, 0.015]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0.67, 0, 0.015]}>
          <boxGeometry args={[0.015, 2.1, 0.015]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0, 1.05, 0.015]}>
          <boxGeometry args={[1.35, 0.015, 0.015]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0, -1.05, 0.015]}>
          <boxGeometry args={[1.35, 0.015, 0.015]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.8} />
        </mesh>

        {/* Outer White Cyber brackets / clamps */}
        <group position={[-0.72, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.06, 1.2, 0.08]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />
            <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.5} />
          </mesh>
        </group>
        <group position={[0.72, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.06, 1.2, 0.08]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />
            <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.5} />
          </mesh>
        </group>
      </group>

      {/* Floating Holographic HUD Screen (In front of SpongeBob, tilted) */}
      <group position={[0.55, 0.15, 0.4]} rotation={[0.05, -0.4, 0]}>
        <mesh>
          <boxGeometry args={[0.62, 0.45, 0.008]} />
          <meshStandardMaterial color="#00F0FF" transparent opacity={0.25} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.62, 0.01, 0.01]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <boxGeometry args={[0.62, 0.01, 0.01]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0, 0, 0.005]} rotation={[0, 0, 0]}>
          <ringGeometry args={[0.1, 0.12, 32]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.8} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* High-fidelity transparent SpongeBob Model Plane */}
      <mesh ref={characterRef} position={[0, 0.1, 0]}>
        <planeGeometry args={[2.0, 2.0]} />
        <meshBasicMaterial map={texture} transparent={true} depthWrite={true} />
      </mesh>
    </group>
  );
};

// ================= Patrick Star Sci-Fi 3D Model (Texture Billboard) =================
const PatrickModel = ({
  isSpeaking,
  isThinking,
  mouseOffset,
  bounce
}: {
  isSpeaking: boolean;
  isThinking: boolean;
  mouseOffset: { x: number; y: number };
  bounce: boolean;
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const characterRef = useRef<THREE.Mesh>(null);
  const jumpTimeRef = useRef<number | null>(null);

  // Load high-fidelity Patrick cyber pet texture
  const texture = useLoader(THREE.TextureLoader, '/patrick_pet.png');

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // 1. Float and Jump Animations
    if (groupRef.current) {
      let floatY = Math.sin(t * 1.6 + 1.0) * 0.07; // slightly different phase/speed than SpongeBob
      let floatRotZ = Math.sin(t * 1.2 + 0.5) * 0.018;

      if (bounce) {
        if (jumpTimeRef.current === null) {
          jumpTimeRef.current = t;
        }
        const elapsed = t - jumpTimeRef.current;
        const duration = 0.8;
        if (elapsed < duration) {
          const progress = elapsed / duration;
          floatY += Math.sin(progress * Math.PI) * 0.8;
          groupRef.current.rotation.y = THREE.MathUtils.lerp(
            groupRef.current.rotation.y,
            mouseOffset.x * 0.4 + Math.sin(progress * Math.PI) * 2 * Math.PI,
            0.1
          );
        } else {
          jumpTimeRef.current = null;
        }
      } else {
        jumpTimeRef.current = null;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, mouseOffset.x * 0.4, 0.1);
      }

      groupRef.current.position.y = floatY;
      groupRef.current.rotation.z = floatRotZ;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -mouseOffset.y * 0.3, 0.1);
    }

    // 2. Speak & Thinking Squash/Stretch Animations
    if (characterRef.current) {
      if (isSpeaking) {
        characterRef.current.scale.y = 1.0 + Math.sin(t * 16) * 0.05;
        characterRef.current.scale.x = 1.0 - Math.sin(t * 16) * 0.03;
      } else if (isThinking) {
        characterRef.current.scale.y = 1.0 + Math.sin(t * 6) * 0.02;
        characterRef.current.scale.x = 1.0 + Math.sin(t * 6) * 0.02;
      } else {
        characterRef.current.scale.y = THREE.MathUtils.lerp(characterRef.current.scale.y, 1.0, 0.2);
        characterRef.current.scale.x = THREE.MathUtils.lerp(characterRef.current.scale.x, 1.0, 0.2);
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.05, 0]}>
      {/* 3D Sci-Fi Capsule Frame (Behind Patrick) - Pink Theme */}
      <group position={[0, 0.1, -0.38]}>
        {/* Glass Back Panel */}
        <mesh>
          <boxGeometry args={[1.35, 2.1, 0.02]} />
          <meshStandardMaterial color="#EC4899" transparent opacity={0.10} roughness={0.1} metalness={0.1} />
        </mesh>

        {/* Glowing Pink Border */}
        <mesh position={[-0.67, 0, 0.015]}>
          <boxGeometry args={[0.015, 2.1, 0.015]} />
          <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0.67, 0, 0.015]}>
          <boxGeometry args={[0.015, 2.1, 0.015]} />
          <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0, 1.05, 0.015]}>
          <boxGeometry args={[1.35, 0.015, 0.015]} />
          <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0, -1.05, 0.015]}>
          <boxGeometry args={[1.35, 0.015, 0.015]} />
          <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={1.8} />
        </mesh>

        {/* Outer White Cyber Clamps */}
        <group position={[-0.72, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.06, 1.2, 0.08]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />
            <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={1.5} />
          </mesh>
        </group>
        <group position={[0.72, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.06, 1.2, 0.08]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} metalness={0.2} />
          </mesh>
          <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.02, 16]} />
            <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={1.5} />
          </mesh>
        </group>
      </group>

      {/* Floating Holographic HUD Screen - Pink Theme, on left side for Patrick */}
      <group position={[-0.55, 0.15, 0.4]} rotation={[0.05, 0.4, 0]}>
        <mesh>
          <boxGeometry args={[0.62, 0.45, 0.008]} />
          <meshStandardMaterial color="#EC4899" transparent opacity={0.22} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.62, 0.01, 0.01]} />
          <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <boxGeometry args={[0.62, 0.01, 0.01]} />
          <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={1.8} />
        </mesh>
        {/* HUD circle radar */}
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[0.1, 0.12, 32]} />
          <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={1.8} side={THREE.DoubleSide} />
        </mesh>
        {/* HUD data lines */}
        <mesh position={[0.18, 0.1, 0.005]}>
          <boxGeometry args={[0.12, 0.01, 0.002]} />
          <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[-0.18, -0.1, 0.005]}>
          <boxGeometry args={[0.12, 0.01, 0.002]} />
          <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={1.5} />
        </mesh>
      </group>

      {/* High-fidelity transparent Patrick Model Plane */}
      <mesh ref={characterRef} position={[0, 0.1, 0]}>
        <planeGeometry args={[2.0, 2.0]} />
        <meshBasicMaterial map={texture} transparent={true} depthWrite={true} />
      </mesh>
    </group>
  );
};

// ================= Reusable 3D Canvas Renderer Component =================
interface Pet3DCanvasProps {
  petType: 'spongebob' | 'patrick';
  isSpeaking: boolean;
  isThinking: boolean;
  mouseOffset: { x: number; y: number };
  bounce: boolean;
  className?: string;
}

const Pet3DCanvas = ({
  petType,
  isSpeaking,
  isThinking,
  mouseOffset,
  bounce,
  className = ''
}: Pet3DCanvasProps) => {
  return (
    <div className={`w-full h-full relative ${className}`}>
      <Canvas
        {...({
          camera: { position: [0, 0, 3.6], fov: 40 },
          gl: { alpha: true, antialias: true },
          style: { background: 'transparent', width: '100%', height: '100%' }
        } as any)}
      >
        <ambientLight intensity={1.2} />
        <directionalLight position={[5, 5, 5]} intensity={1.8} />
        <pointLight position={[-5, 5, -2]} intensity={0.5} />
        <pointLight position={[0, -5, 2]} intensity={0.8} />
        <React.Suspense fallback={null}>
          {petType === 'spongebob' ? (
            <SpongeBobModel
              isSpeaking={isSpeaking}
              isThinking={isThinking}
              mouseOffset={mouseOffset}
              bounce={bounce}
            />
          ) : (
            <PatrickModel
              isSpeaking={isSpeaking}
              isThinking={isThinking}
              mouseOffset={mouseOffset}
              bounce={bounce}
            />
          )}
        </React.Suspense>
      </Canvas>
    </div>
  );
};

// ================= Primary Draggable 3D & Voice Pet Component =================
export const ElectronicPets = ({
  onNavigate,
  currentView
}: {
  onNavigate: (view: string) => void;
  currentView: string;
}) => {
  // Positional State (Coordinates)
  const [sbPos, setSbPos] = useState({ x: 40, y: 220 });
  const [patPos, setPatPos] = useState({ x: window.innerWidth - 240, y: 220 });

  // Minimize State
  const [sbMin, setSbMin] = useState(false);
  const [patMin, setPatMin] = useState(false);

  // Dragging Refs
  const sbRef = useRef<HTMLDivElement>(null);
  const patRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0, time: 0 });

  // Dragging state (just for visual styles)
  const [isDraggingSb, setIsDraggingSb] = useState(false);
  const [isDraggingPat, setIsDraggingPat] = useState(false);

  // Click Animation State (micro-bounce)
  const [sbBounce, setSbBounce] = useState(false);
  const [patBounce, setPatBounce] = useState(false);

  // Dialogue Bubbles
  const [sbBubble, setSbBubble] = useState('');
  const [patBubble, setPatBubble] = useState('');
  const [sbBubbleShow, setSbBubbleShow] = useState(false);
  const [patBubbleShow, setPatBubbleShow] = useState(false);

  // Interactive Analysis Cabin Modal
  const [isCabinOpen, setIsCabinOpen] = useState(false);
  const [activePet, setActivePet] = useState<'spongebob' | 'patrick'>('spongebob');
  
  // Real Database Metrics State
  const [stats, setStats] = useState<any>({ streak_days: 0, solved_count: 0, accuracy_rate: 0, rank: 99 });
  const [mistakeCount, setMistakeCount] = useState(0);
  const [masteries, setMasteries] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // --- Voice Synthesis (TTS) & Recognition (STT) State ---
  const [isRecording, setIsRecording] = useState(false);
  const [isNarratorEnabled, setIsNarratorEnabled] = useState(true);
  const [sbSpeaking, setSbSpeaking] = useState(false);
  const [patSpeaking, setPatSpeaking] = useState(false);
  
  // --- Flexible Chat Room State ---
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'pet'; text: string; petType?: 'spongebob' | 'patrick' }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- 3D Mouse Parallax Coordinates ---
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Audio references for SpongeBob and Patrick Star
  const sbLaughRef = useRef<HTMLAudioElement | null>(null);
  const sbReadyRef = useRef<HTMLAudioElement | null>(null);
  const patLaughRef = useRef<HTMLAudioElement | null>(null);
  const patVoiceRef = useRef<HTMLAudioElement | null>(null);
  const speakTimeoutRef = useRef<any>(null);

  useEffect(() => {
    sbLaughRef.current = new Audio('/audio/spongebob_laugh.wav');
    sbReadyRef.current = new Audio('/audio/spongebob_ready.mp3');
    patLaughRef.current = new Audio('/audio/patrick_laugh.mp3');
    patVoiceRef.current = new Audio('/audio/patrick_voice.mp3');

    return () => {
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
      }
    };
  }, []);

  const stopAllAudios = () => {
    [sbLaughRef, sbReadyRef, patLaughRef, patVoiceRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
  };

  const playAudio = (audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => {
        console.warn('Audio play blocked or failed:', e);
      });
    }
  };

  // Listen globally to mouse movement to drive 3D holographic tilt
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      // Convert positions to range of -1 to 1
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      setMouseOffset({ x: dx, y: dy });
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, []);

  // Fetch MySQL stats on mount and navigation updates
  const fetchDbMetrics = async () => {
    try {
      setLoadingData(true);
      const [statsData, mistakesData, masteryData] = await Promise.all([
        getStudentStats().catch(() => null),
        getMistakeBook().catch(() => ({ mistakes: [] })),
        getMyMastery().catch(() => [])
      ]);

      if (statsData) {
        setStats(statsData);
      }
      if (mistakesData?.mistakes) {
        setMistakeCount(mistakesData.mistakes.length);
      }
      if (Array.isArray(masteryData)) {
        setMasteries(masteryData);
      }
    } catch (e) {
      console.error('Failed to fetch electronic pet stats', e);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDbMetrics();
  }, [currentView]);

  // Adjust patrick position when viewport resizes
  useEffect(() => {
    const handleResize = () => {
      setPatPos(prev => ({
        x: Math.min(window.innerWidth - 210, prev.x),
        y: Math.min(window.innerHeight - 270, prev.y)
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loadingAi]);

  // Handle Voice Output via TTS
  const speakText = (text: string, pet: 'spongebob' | 'patrick') => {
    if (!isNarratorEnabled) return;

    // Terminate any running speech and reset audio clips
    window.speechSynthesis.cancel();
    stopAllAudios();
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }

    // Strip Markdown code tags and stars for cleaner output
    const cleanText = text
      .replace(/[*#_`~>\[\]()-]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-CN';

    if (pet === 'spongebob') {
      playAudio(sbReadyRef);
      setSbSpeaking(true);
      utterance.pitch = 1.35; // Bright high pitch
      utterance.rate = 1.15;  // Energetic speed
      utterance.onstart = () => setSbSpeaking(true);
      utterance.onend = () => setSbSpeaking(false);
      utterance.onerror = () => setSbSpeaking(false);

      speakTimeoutRef.current = setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 1000);
    } else {
      playAudio(patVoiceRef);
      setPatSpeaking(true);
      utterance.pitch = 0.72; // Deep slow voice
      utterance.rate = 0.85;  // Slow pace
      utterance.onstart = () => setPatSpeaking(true);
      utterance.onend = () => setPatSpeaking(false);
      utterance.onerror = () => setPatSpeaking(false);

      speakTimeoutRef.current = setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 1200);
    }
  };

  // Drag-and-Drop Handler
  const startDrag = (e: React.MouseEvent, pet: 'spongebob' | 'patrick') => {
    // Prevent default drag behaviors, but allow button clicks to bubble if they are not drag events
    e.preventDefault();
    const pos = pet === 'spongebob' ? sbPos : patPos;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      px: pos.x,
      py: pos.y,
      time: Date.now()
    };

    if (pet === 'spongebob') setIsDraggingSb(true);
    else setIsDraggingPat(true);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStart.current.x;
      const dy = moveEvent.clientY - dragStart.current.y;
      
      const newX = Math.max(10, Math.min(window.innerWidth - 210, dragStart.current.px + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 270, dragStart.current.py + dy));

      if (pet === 'spongebob') {
        setSbPos({ x: newX, y: newY });
      } else {
        setPatPos({ x: newX, y: newY });
      }
    };

    const onMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (pet === 'spongebob') setIsDraggingSb(false);
      else setIsDraggingPat(false);

      const dx = upEvent.clientX - dragStart.current.x;
      const dy = upEvent.clientY - dragStart.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const duration = Date.now() - dragStart.current.time;

      // Click Trigger (moved < 5px and took < 300ms)
      if (dist < 5 && duration < 300) {
        handlePetClick(pet);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Click Feedback & Dialogue Modal Trigger
  const handlePetClick = (pet: 'spongebob' | 'patrick') => {
    setActivePet(pet);
    
    // Trigger bounce micro-animation and play corresponding click sound
    if (pet === 'spongebob') {
      setSbBounce(true);
      setTimeout(() => setSbBounce(false), 800);
      playAudio(sbLaughRef);
    } else {
      setPatBounce(true);
      setTimeout(() => setPatBounce(false), 800);
      playAudio(patLaughRef);
    }

    // Initialize custom conversational chat list with in-character greeting if empty
    setChatHistory(prev => {
      if (prev.length > 0) return prev;
      return [{
        sender: 'pet',
        text: pet === 'spongebob'
          ? '我准备好了！我准备好了！嗨！伙伴，我是海绵宝宝！今天学编程遇到什么困难了吗？尽管和我说，我和派大星随时为你提供能量！'
          : '嗯……嗨，我是派大星！你是来邀请我一起去捉水母的吗？还是需要我这个编程天才来给你一点人生启发？哈哈！',
        petType: pet
      }];
    });

    // Open Cabin Control panel
    setIsCabinOpen(true);
  };

  // Trigger speech on initial modal open or pet change
  useEffect(() => {
    if (isCabinOpen && chatHistory.length > 0) {
      // Narrate latest message if it belongs to the active pet
      const latest = chatHistory[chatHistory.length - 1];
      if (latest && latest.sender === 'pet' && latest.petType === activePet) {
        speakText(latest.text, activePet);
      }
    }
  }, [isCabinOpen, activePet]);

  // Periodic active bubble engine
  useEffect(() => {
    const speakRandomly = () => {
      const isSpongebobActive = Math.random() > 0.5;

      const spongebobLines = [
        '我准备好了！我准备好了！今天也要写出完美的代码！',
        `嘿伙伴！你今天连续打卡 ${stats.streak_days} 天啦！太酷了！`,
        mistakeCount > 0 
          ? `哇！错题本积攒了 ${mistakeCount} 个水母，我们快去消灭它们！`
          : '你的错题本空空如也，简直比蟹堡王的秘方还要完美！',
        '派大星！你今天练习双指针了吗？',
        '写代码就像做蟹黄堡，每一步细节都决定了美味程度！',
        '双击我们可以把我们收纳起来哦，不过我更喜欢陪着你！'
      ];

      const patrickLines = [
        '嗯……写代码虽然难，但是吃块蟹黄堡就简单多了！',
        `全站排名第 #${stats.rank} 吗？我觉得你已经是比奇堡最聪明的人了！`,
        '海绵宝宝，我的电脑好像塞满了美味 Graves汉堡包……',
        '如果你觉得累了，我们就去捉水母吧！',
        '知识掌握度评分？那是我的肚皮饱满度吗？',
        '嘿，今天想不想去我的石头屋底下写代码？'
      ];

      if (isSpongebobActive) {
        const line = spongebobLines[Math.floor(Math.random() * spongebobLines.length)];
        setSbBubble(line);
        setSbBubbleShow(true);
        setTimeout(() => setSbBubbleShow(false), 6000);
      } else {
        const line = patrickLines[Math.floor(Math.random() * patrickLines.length)];
        setPatBubble(line);
        setPatBubbleShow(true);
        setTimeout(() => setPatBubbleShow(false), 6000);
      }
    };

    const firstTimer = setTimeout(speakRandomly, 8000);
    const interval = setInterval(speakRandomly, 30000);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [stats, mistakeCount]);

  // Voice Input (STT) via Browser webkitSpeechRecognition
  const handleVoiceInput = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('您的浏览器暂不支持 Web Speech 语音听写输入，推荐使用最新版 Chrome 或 Edge 浏览器！');
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = 'zh-CN';
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = () => {
      setIsRecording(true);
    };

    rec.onresult = (event: any) => {
      const voiceText = event.results[0][0].transcript;
      if (voiceText) {
        setChatInput(voiceText);
        handleSendChatMessage(voiceText);
      }
    };

    rec.onerror = (e: any) => {
      console.error('STT error', e);
      setIsRecording(false);
    };

    rec.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  // Submit chat dialogue and trigger AI response roleplay
  const handleSendChatMessage = async (overrideInput?: string) => {
    const rawContent = (overrideInput || chatInput).trim();
    if (!rawContent) return;

    setChatInput('');
    
    // Add user question to dialogue list
    setChatHistory(prev => [...prev, { sender: 'user', text: rawContent }]);
    setLoadingAi(true);

    try {
      const masteryDetails = masteries.map((m: any) => `${m.node_name || m.subject || '算法'}(掌握度:${m.mastery_score || m.value || 50}%)`).join(', ');
      
      // Keep last 4 messages as short dialog context
      const chatContext = chatHistory.slice(-4).map(m => `${m.sender === 'user' ? '学生' : activePet === 'spongebob' ? '海绵宝宝' : '派大星'}: ${m.text}`).join('\n');
      
      const roleplaySystemPrompt = activePet === 'spongebob'
        ? `你是比奇堡里最热情快乐的“海绵宝宝”！请扮演它为学生解答各种学习、编程或者闲聊提问。
           【性格声线】：极其积极主动、阳光乐观、充满激情、乐于助人。经典台词或口头禅（“我准备好了！”、“太棒了伙伴！”、“蟹堡王秘方！”）。
           【当前学生 MySQL 数据库数据】：打卡 ${stats.streak_days}天，已做题 ${stats.solved_count}道，错题 ${mistakeCount}道，掌握度：${masteryDetails || '初涉算法世界'}。
           【多轮对话历史】：
           ${chatContext}
           学生提问：${rawContent}

           请严格以“海绵宝宝”幽默有生气的说话语气回答学生，如果是询问关于编程、学习或者代码问题，结合你做汉堡或捉水母的性格给出比喻（比如把写Bug比作痞老板偷秘方）。直接输出回答，无需 any 前缀、解释、角色代入说明。`
        : `你是比奇堡里最可爱的“派大星”！请扮演它为学生解答各种学习、编程或者闲聊提问。
           【性格声线】：极其悠闲、憨厚呆萌、爱吃蟹黄堡、热爱捉水母、常在不经意间说出带点哲理的有趣大实话。
           【当前学生 MySQL 数据库数据】：打卡 ${stats.streak_days}天，已做题 ${stats.solved_count}道，错题 ${mistakeCount}道，掌握度：${masteryDetails || '快乐做题中'}。
           【多轮对话历史】：
           ${chatContext}
           学生提问：${rawContent}

           请严格以“派大星”慵懒、可爱、呆萌的口吻直接回答。如果是高深复杂的编程题，你可以诚实地表现出你不懂，但会安慰他“去吃个汉堡”或“去捉水母放松一下”，引导他一步步前行。直接输出回答内容，不要带有 any 系统开场白或解释。`;

      const reply = await analyzeProblem(roleplaySystemPrompt, 'markdown');
      const cleanReply = reply || '我感觉比奇堡被海水淹没了，信号有些迟钝...';

      setChatHistory(prev => [...prev, { sender: 'pet', text: cleanReply, petType: activePet }]);
      
      // Auto speech synthesis speak
      speakText(cleanReply, activePet);
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { sender: 'pet', text: '噢！派大星把天线当咸鱼吃掉了，我们等下再聊吧！', petType: activePet }]);
    } finally {
      setLoadingAi(false);
    }
  };

  // Preset Dialogue Chips clicks
  const triggerQuickPrompt = (promptText: string) => {
    handleSendChatMessage(promptText);
  };

  // Nav actions
  const navigateToMistakes = () => {
    setIsCabinOpen(false);
    window.speechSynthesis.cancel();
    stopAllAudios();
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    onNavigate('mistakes');
  };

  const navigateToProblems = () => {
    setIsCabinOpen(false);
    window.speechSynthesis.cancel();
    stopAllAudios();
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
    onNavigate('problems');
  };

  const handleCloseCabin = () => {
    setIsCabinOpen(false);
    window.speechSynthesis.cancel();
    stopAllAudios();
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
  };

  // Compute 3D parallax transformation style
  const get3DTransformStyle = (pet: 'spongebob' | 'patrick') => {
    const isDragging = pet === 'spongebob' ? isDraggingSb : isDraggingPat;
    const pos = pet === 'spongebob' ? sbPos : patPos;

    if (isDragging) {
      return {
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        zIndex: 50
      };
    }

    // Limit extreme tilt degree to max 15 deg
    const rx = mouseOffset.y * -15;
    const ry = mouseOffset.x * 15;

    return {
      left: `${pos.x}px`,
      top: `${pos.y}px`,
      transform: `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg)`,
      '--glare-x': `${(mouseOffset.x + 1) * 50}%`,
      '--glare-y': `${(mouseOffset.y + 1) * 50}%`
    } as React.CSSProperties;
  };

  if (currentView === 'playground') return null;

  return (
    <>
      {/* ================= SPONGEBOB PET ================= */}
      <div
        ref={sbRef}
        onMouseDown={(e) => startDrag(e, 'spongebob')}
        onDoubleClick={() => setSbMin(!sbMin)}
        style={get3DTransformStyle('spongebob')}
        className={`fixed z-40 select-none cursor-grab active:cursor-grabbing group perspective-stage
          ${sbMin ? 'w-12 h-12' : 'w-48 h-64'}
          ${isDraggingSb ? 'scale-105 opacity-90' : 'cyber-3d-card'}
        `}
      >
        {/* Dialogue Bubble */}
        {sbBubbleShow && !sbMin && (
          <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 w-48 p-3 rounded-2xl text-xs text-blue-100 cyber-bubble pointer-events-none select-none z-50">
            <div className="font-bold text-cyan-400 mb-1 flex items-center gap-1">
              <Sparkles size={12} className="animate-spin" /> 海绵宝宝
            </div>
            {sbBubble}
          </div>
        )}

        {/* Minimize Hover Indicator */}
        <div className="absolute top-0 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 rounded-full p-1 cursor-pointer z-50 border border-white/20"
             onClick={(e) => { e.stopPropagation(); setSbMin(!sbMin); }}>
          {sbMin ? <Maximize2 size={12} className="text-cyan-300" /> : <Minimize2 size={12} className="text-cyan-300" />}
        </div>

        {/* Pet Visual Body */}
        {sbMin ? (
          <div className="w-10 h-10 rounded-full bg-cyan-500/20 border-2 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)] animate-pulse flex items-center justify-center">
            <span className="text-[9px] font-black text-cyan-300 font-mono">SB</span>
          </div>
        ) : (
          <div className={`w-full h-full relative flex items-center justify-center transition-all duration-300
            ${sbBounce ? 'animate-pet-bounce' : ''}
            ${sbSpeaking ? 'scale-115 rotate-2 border-2 border-cyan-400/30 rounded-[32px] p-0.5 bg-cyan-400/5' : 'hover:scale-105'}
          `}>
            {/* Holographic glowing rings & interactive neon background beneath */}
            <div className="absolute -inset-1 rounded-[32px] border border-cyan-500/20 bg-cyan-500/5 blur-xs z-0 depth-element-back"></div>
            
            {/* Realtime Canvas Audio energy Wave */}
            <div className="absolute inset-x-2 inset-y-4 rounded-[28px] overflow-hidden pointer-events-none z-0">
              <PetCanvasBackground petType="spongebob" state={sbSpeaking ? 'speaking' : loadingAi ? 'thinking' : 'idle'} />
            </div>

            {/* Custom 3D Glare effect */}
            <div className="cyber-glare"></div>

            {/* Interactive Procedural 3D SpongeBob Character */}
            <Pet3DCanvas
              petType="spongebob"
              isSpeaking={sbSpeaking}
              isThinking={loadingAi && activePet === 'spongebob'}
              mouseOffset={mouseOffset}
              bounce={sbBounce}
              className="w-full h-full z-10 depth-element"
            />
          </div>
        )}
      </div>

      {/* ================= PATRICK STAR PET ================= */}
      <div
        ref={patRef}
        onMouseDown={(e) => startDrag(e, 'patrick')}
        onDoubleClick={() => setPatMin(!patMin)}
        className={`fixed z-40 select-none cursor-grab active:cursor-grabbing group perspective-stage
          ${patMin ? 'w-12 h-12' : 'w-48 h-64'}
          ${isDraggingPat ? 'scale-105 opacity-90' : 'cyber-3d-card'}
        `}
        style={get3DTransformStyle('patrick')}
      >
        {/* Dialogue Bubble */}
        {patBubbleShow && !patMin && (
          <div className="absolute bottom-[105%] left-1/2 -translate-x-1/2 w-48 p-3 rounded-2xl text-xs text-pink-100 cyber-bubble pointer-events-none select-none z-50 !border-pink-500/40">
            <div className="font-bold text-pink-400 mb-1 flex items-center gap-1">
              <Sparkles size={12} className="animate-bounce" /> 派大星
            </div>
            {patBubble}
          </div>
        )}

        {/* Minimize Hover Indicator */}
        <div className="absolute top-0 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 rounded-full p-1 cursor-pointer z-50 border border-white/20"
             onClick={(e) => { e.stopPropagation(); setPatMin(!patMin); }}>
          {patMin ? <Maximize2 size={12} className="text-pink-300" /> : <Minimize2 size={12} className="text-pink-300" />}
        </div>

        {/* Pet Visual Body */}
        {patMin ? (
          <div className="w-10 h-10 rounded-full bg-pink-500/20 border-2 border-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.6)] animate-pulse flex items-center justify-center">
            <span className="text-[9px] font-black text-pink-300 font-mono">PAT</span>
          </div>
        ) : (
          <div className={`w-full h-full relative flex items-center justify-center transition-all duration-300
            ${patBounce ? 'animate-pet-bounce' : ''}
            ${patSpeaking ? 'scale-115 -rotate-2 border-2 border-pink-400/30 rounded-[32px] p-0.5 bg-pink-400/5' : 'hover:scale-105'}
          `}>
            {/* Holographic glowing rings & interactive neon background beneath */}
            <div className="absolute -inset-1 rounded-[32px] border border-pink-500/20 bg-pink-500/5 blur-xs z-0 depth-element-back"></div>
            
            {/* Realtime Canvas Audio energy Wave */}
            <div className="absolute inset-x-2 inset-y-4 rounded-[28px] overflow-hidden pointer-events-none z-0">
              <PetCanvasBackground petType="patrick" state={patSpeaking ? 'speaking' : loadingAi ? 'thinking' : 'idle'} />
            </div>

            {/* Custom 3D Glare effect */}
            <div className="cyber-glare"></div>

            {/* Interactive Procedural 3D Patrick Character */}
            <Pet3DCanvas
              petType="patrick"
              isSpeaking={patSpeaking}
              isThinking={loadingAi && activePet === 'patrick'}
              mouseOffset={mouseOffset}
              bounce={patBounce}
              className="w-full h-full z-10 depth-element"
            />
          </div>
        )}
      </div>

      {/* ================= INTERACTIVE ANALYSIS & VOICE CHAT MODAL ================= */}
      {isCabinOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md"
          onClick={handleCloseCabin}
        >
          <div
            className="w-full max-w-4xl h-[85vh] bg-[#060a18] border border-cyan-500/30 rounded-[32px] overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.2)] flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Holographic cyber grid top panel */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
            
            {/* Cyber Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg tracking-wider flex items-center gap-2">
                    比奇堡 3D 智能声控对话与诊断舱
                    <span className="px-2 py-0.5 rounded text-[8px] bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 font-black tracking-widest uppercase">
                      MySQL 智能语音联动
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-bold uppercase tracking-widest">
                    3D Holographic Dialogue Terminal powered by STT, TTS and MySQL records
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Narrator switch */}
                <button
                  onClick={() => {
                    const nextVal = !isNarratorEnabled;
                    setIsNarratorEnabled(nextVal);
                    if (!nextVal) {
                      window.speechSynthesis.cancel();
                      stopAllAudios();
                      if (speakTimeoutRef.current) {
                        clearTimeout(speakTimeoutRef.current);
                        speakTimeoutRef.current = null;
                      }
                      setSbSpeaking(false);
                      setPatSpeaking(false);
                    }
                  }}
                  className={`p-2 rounded-xl border transition-all flex items-center gap-2 text-xs font-black tracking-wider uppercase
                    ${isNarratorEnabled ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20' : 'bg-slate-900 text-slate-500 border-white/5 hover:text-slate-400'}
                  `}
                  title={isNarratorEnabled ? '开启朗读声线' : '已静音'}
                >
                  {isNarratorEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                  <span>{isNarratorEnabled ? '朗读开启' : '静音模式'}</span>
                </button>

                <button
                  onClick={handleCloseCabin}
                  className="p-2 bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors border border-white/5 animate-hover"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Main Split Layout */}
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Left Column: Real Database Metrics */}
              <div className="w-full lg:w-80 border-r border-white/10 bg-slate-950/50 p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar shrink-0">
                
                {/* Pet Switch Headers */}
                <div className="flex gap-4 p-1.5 bg-white/5 rounded-2xl border border-white/10">
                  <button
                    onClick={() => {
                      setActivePet('spongebob');
                      setChatHistory([{
                        sender: 'pet',
                        text: '我准备好了！我准备好了！嗨！伙伴，我是海绵宝宝！今天学编程遇到什么困难了吗？尽管和我说，我和派大星随时为你提供能量！',
                        petType: 'spongebob'
                      }]);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2
                      ${activePet === 'spongebob' ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/30' : 'text-slate-400 hover:text-white'}
                    `}
                  >
                    海绵宝宝
                  </button>
                  <button
                    onClick={() => {
                      setActivePet('patrick');
                      setChatHistory([{
                        sender: 'pet',
                        text: '嗯……嗨，我是派大星！你是来邀请我一起去捉水母的吗？还是需要我这个编程天才来给你一点人生启发？哈哈！',
                        petType: 'patrick'
                      }]);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2
                      ${activePet === 'patrick' ? 'bg-pink-500 text-white font-black shadow-lg shadow-pink-500/30' : 'text-slate-400 hover:text-white'}
                    `}
                  >
                    派大星
                  </button>
                </div>

                {/* Pet Animated Viewport */}
                <div className="h-40 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)"></div>
                  
                  {/* Neon waves */}
                  <PetCanvasBackground petType={activePet} state={(activePet === 'spongebob' ? sbSpeaking : patSpeaking) ? 'speaking' : loadingAi ? 'thinking' : 'idle'} />

                  {/* Active 3D character */}
                  <Pet3DCanvas
                    petType={activePet}
                    isSpeaking={activePet === 'spongebob' ? sbSpeaking : patSpeaking}
                    isThinking={loadingAi}
                    mouseOffset={mouseOffset}
                    bounce={activePet === 'spongebob' ? sbBounce : patBounce}
                    className="w-full h-full z-10"
                  />
                  <div className="absolute bottom-2.5 text-[9px] font-black text-cyan-400 bg-slate-950/80 border border-cyan-400/20 px-3 py-0.5 rounded-full uppercase tracking-widest">
                    {activePet === 'spongebob' ? '海绵宝宝 (SpongeBob)' : '派大星 (Patrick Star)'}
                  </div>
                </div>

                {/* MySQL Real Metrics Grid */}
                <div className="space-y-3">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">比奇堡体能数据指标</div>
                  
                  {/* Streak Card */}
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                        <Flame size={14} className="fill-orange-400/20" />
                      </div>
                      <div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">打卡连击</div>
                        <div className="text-[10px] font-black text-white">Strike</div>
                      </div>
                    </div>
                    <div className="text-lg font-black font-mono text-orange-400">{stats.streak_days} 天</div>
                  </div>

                  {/* Solved Card */}
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <CheckCircle size={14} />
                      </div>
                      <div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">刷题成就</div>
                        <div className="text-[10px] font-black text-white">Solved</div>
                      </div>
                    </div>
                    <div className="text-lg font-black font-mono text-emerald-400">{stats.solved_count} 题</div>
                  </div>

                  {/* Rank Card */}
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <Trophy size={14} />
                      </div>
                      <div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">全站排名</div>
                        <div className="text-[10px] font-black text-white">Ranking</div>
                      </div>
                    </div>
                    <div className="text-lg font-black font-mono text-indigo-400">#{stats.rank}</div>
                  </div>

                  {/* Mistakes Card */}
                  <div className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
                        <BookOpen size={14} />
                      </div>
                      <div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">积压错题</div>
                        <div className="text-[10px] font-black text-white">Mistakes</div>
                      </div>
                    </div>
                    <div className="text-lg font-black font-mono text-rose-400">{mistakeCount} 题</div>
                  </div>
                </div>

              </div>

              {/* Right Column: Conversational Voice Chat Panel */}
              <div className="flex-1 p-6 flex flex-col overflow-hidden bg-slate-950/20 relative">
                
                {/* Chat Message Lists */}
                <div className="flex-1 bg-black/40 border border-white/5 rounded-[24px] p-5 overflow-y-auto custom-scrollbar flex flex-col gap-4">
                  {chatHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border shrink-0
                        ${msg.sender === 'user'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : msg.petType === 'spongebob'
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                            : 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                        }
                      `}>
                        {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                      </div>

                      {/* Msg bubble text */}
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed text-slate-200 relative
                        ${msg.sender === 'user'
                          ? 'bg-cyan-600/15 border border-cyan-500/30 rounded-tr-none'
                          : msg.petType === 'spongebob'
                            ? 'bg-yellow-600/10 border border-yellow-500/20 rounded-tl-none'
                            : 'bg-pink-600/10 border border-pink-500/20 rounded-tl-none'
                        }
                      `}>
                        {/* Audio speaker trigger inside bubble */}
                        {msg.sender === 'pet' && (
                          <button
                            onClick={() => speakText(msg.text, msg.petType || 'spongebob')}
                            className="absolute top-2 right-2 p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                            title="重新播放语音"
                          >
                            <Volume2 size={12} />
                          </button>
                        )}
                        <div className="pr-4 whitespace-pre-wrap font-medium select-text">{msg.text}</div>
                      </div>
                    </div>
                  ))}

                  {/* AI Loading Message */}
                  {loadingAi && (
                    <div className="flex gap-3 self-start max-w-[80%]">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border animate-spin
                        ${activePet === 'spongebob' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-pink-500/10 border-pink-500/30 text-pink-400'}
                      `}>
                        <Cpu size={14} />
                      </div>
                      <div className="p-3 bg-white/5 border border-white/5 rounded-2xl rounded-tl-none flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>

                {/* Preset Prompt chips */}
                <div className="mt-4 flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => triggerQuickPrompt('海绵宝宝派大星，帮我深度分析一下我的 MySQL 掌握度现状！')}
                    className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-[10px] font-black text-cyan-400 tracking-wider transition-all"
                  >
                    📊 实力深度诊断
                  </button>
                  <button
                    onClick={() => triggerQuickPrompt(`讲一个关于程序员和捉水母的笑话吧！`)}
                    className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-[10px] font-black text-cyan-400 tracking-wider transition-all"
                  >
                    🎭 比奇堡冷笑话
                  </button>
                  <button
                    onClick={() => triggerQuickPrompt('我今天应该怎么消灭我的错题本？有什么战术？')}
                    className="py-1 px-2.5 rounded-lg bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 text-[10px] font-black text-cyan-400 tracking-wider transition-all"
                  >
                    💡 错题消灭战术
                  </button>
                </div>

                {/* Cyber Input & Voice triggers */}
                <div className="mt-4 flex gap-3 items-center shrink-0">
                  {/* STT Microphone Trigger */}
                  <button
                    onClick={handleVoiceInput}
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center border transition-all shrink-0 relative
                      ${isRecording
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-sound-wave'
                        : 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-white/10 hover:border-white/20'
                      }
                    `}
                    title={isRecording ? '正在收音，点击结束' : '点击进行语音输入'}
                  >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                    {isRecording && (
                      <span className="absolute inset-0 rounded-2xl border-2 border-rose-500 animate-ping opacity-60"></span>
                    )}
                  </button>

                  {/* Text Input Panel */}
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                      placeholder={isRecording ? '比奇堡信号接收中，请说出中文...' : `向 ${activePet === 'spongebob' ? '海绵宝宝' : '派大星'} 发送提问...`}
                      disabled={loadingAi}
                      className="w-full h-11 bg-white/5 border border-white/10 hover:border-white/20 focus:border-cyan-500/40 rounded-2xl px-4 pr-12 text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    />
                    <button
                      onClick={() => handleSendChatMessage()}
                      disabled={loadingAi || !chatInput.trim()}
                      className={`absolute right-2 p-1.5 rounded-xl transition-all
                        ${chatInput.trim() && !loadingAi
                          ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                          : 'text-slate-600 hover:text-slate-500'
                        }
                      `}
                    >
                      <Send size={14} />
                    </button>
                  </div>

                  {/* Nav redirects */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={navigateToProblems}
                      className="h-11 px-4 rounded-2xl bg-white !text-slate-950 hover:bg-slate-100 transition font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-white/5"
                    >
                      挑战题库 <ChevronRight size={12} />
                    </button>
                    {mistakeCount > 0 && (
                      <button
                        onClick={navigateToMistakes}
                        className="h-11 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5"
                      >
                        消灭错题 <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

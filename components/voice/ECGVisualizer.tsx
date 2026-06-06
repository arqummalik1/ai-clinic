"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, CheckCircle, AlertCircle, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

type VisualizerStep = "idle" | "recording" | "transcribing" | "generating" | "done" | "error";

interface ECGVisualizerProps {
  step: VisualizerStep;
  stream: MediaStream | null;
  duration: number;
  errorMsg?: string | null;
}

export function ECGVisualizer({ step, stream, duration, errorMsg }: ECGVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Audio analysis refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const volumeRef = useRef<number>(0);

  // Layout states
  const [dimensions, setDimensions] = useState({ width: 600, height: 160 });

  const cleanupAudio = () => {
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    volumeRef.current = 0;
  };

  // Web Audio Setup
  useEffect(() => {
    if (!stream) {
      cleanupAudio();
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;

    } catch (err) {
      console.warn("[AudioVisualizer] Failed to initialize AudioContext:", err);
    }

    return () => {
      cleanupAudio();
    };
  }, [stream]);

  // Resize listener
  useEffect(() => {
    if (!containerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Keep a fixed internal coordinate space mapped to CSS
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 140)
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Main Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    
    // Sweep visualizer states
    let sweepX = 0;
    const sweepSpeed = 2.5; // Pixels per frame
    const yHistory: number[] = new Array(dimensions.width).fill(0);
    
    // Heartbeat waveform generator configuration
    let heartbeatTimer = 0;
    const heartbeatPeriod = 80; // frames between heartbeats (~75 BPM at 60 FPS)
    let heartbeatPhase = 0; // 0 = idle, 1 = P, 2 = QRS, 3 = T
    let heartbeatProgress = 0;

    // AI Wave configurations (floating sine waves)
    let aiPhase1 = 0;
    let aiPhase2 = 0;
    let aiPhase3 = 0;

    // Success animation states
    let successCirclePulse = 0;
    let successWaveState = 0;

    // Grid rendering parameters
    const gridSize = 20;

    // Smooth volume interpolation
    let smoothedVolume = 0;

    const render = () => {
      const { width, height } = dimensions;
      const centerY = height / 2;

      // 1. Read Audio Volume
      let instantVolume = 0;
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        instantVolume = Math.min(rms * 8, 1.2); // scale for visual dynamics
      }
      // Lerp volume for smoother visual transitions
      smoothedVolume += (instantVolume - smoothedVolume) * 0.25;
      volumeRef.current = smoothedVolume;

      // 2. Clear canvas with very light slate background
      ctx.fillStyle = "#f8fafc"; // modern slate-50
      ctx.fillRect(0, 0, width, height);

      // 3. Draw Medical Monitor Grid Lines (subtle blue/slate grid)
      ctx.strokeStyle = "rgba(99, 102, 241, 0.08)"; // very faint indigo-blue grid
      ctx.lineWidth = 1;
      
      // Vertical grid lines
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      // Horizontal grid lines
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw secondary grid lines (even lighter, split in middle)
      ctx.strokeStyle = "rgba(99, 102, 241, 0.03)";
      for (let x = gridSize / 2; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // 4. State-Based Animations
      if (step === "recording") {
        // --- RECORDING STATE (ECG SWEEP MONITOR) ---
        
        // Progress heartbeat cycle
        heartbeatTimer++;
        
        // Dynamically adjust heart rate based on volume (speaking increases BPM slightly)
        const currentPeriod = Math.max(heartbeatPeriod - Math.floor(smoothedVolume * 25), 45);

        if (heartbeatTimer >= currentPeriod && heartbeatPhase === 0) {
          heartbeatTimer = 0;
          heartbeatPhase = 1;
          heartbeatProgress = 0;
        }

        let ecgY = 0; // Displacement from centerY

        if (heartbeatPhase > 0) {
          heartbeatProgress++;
          
          if (heartbeatProgress <= 8) {
            // P Wave (atrial depolarization - small soft bump)
            const angle = (heartbeatProgress / 8) * Math.PI;
            ecgY = -Math.sin(angle) * 6;
          } else if (heartbeatProgress <= 12) {
            // Flat PR segment
            ecgY = 0;
          } else if (heartbeatProgress <= 14) {
            // Q Wave (short downward spike)
            ecgY = 4;
          } else if (heartbeatProgress <= 18) {
            // R Wave (tall upward spike - ventricular depolarization)
            const progressRatio = (heartbeatProgress - 14) / 4; // 0 to 1
            ecgY = -4 + (progressRatio * -40); // spikes up to -44px
          } else if (heartbeatProgress <= 21) {
            // S Wave (sharp downward rebound)
            const progressRatio = (heartbeatProgress - 18) / 3; // 0 to 1
            ecgY = -44 + (progressRatio * 56); // rebounds down to +12px
          } else if (heartbeatProgress <= 24) {
            // ST segment return to baseline
            const progressRatio = (heartbeatProgress - 21) / 3;
            ecgY = 12 - (progressRatio * 12);
          } else if (heartbeatProgress <= 36) {
            // T Wave (ventricular repolarization - medium bump)
            const angle = ((heartbeatProgress - 24) / 12) * Math.PI;
            ecgY = -Math.sin(angle) * 11;
          } else {
            // End of heartbeat cycle
            heartbeatPhase = 0;
            ecgY = 0;
          }
        }

        // Superimpose voice volume frequency jitter on top of the ECG line
        let voiceJitter = 0;
        if (smoothedVolume > 0.02) {
          // Generate active sound ripples
          voiceJitter = (Math.random() - 0.5) * (smoothedVolume * 45);
          // Also generate a secondary medium-freq sine wave for voice structure
          voiceJitter += Math.sin(Date.now() * 0.05) * (smoothedVolume * 15);
        }

        // Final Y point
        const targetY = ecgY + voiceJitter;

        // Draw data ahead: We update history circular buffer
        const xIndex = Math.floor(sweepX);
        if (xIndex < width) {
          yHistory[xIndex] = targetY;
        }

        // Draw the ECG line
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#2563eb"; // Vibrant medical blue
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(37, 99, 235, 0.25)"; // Soft blue glow
        
        ctx.beginPath();
        let isDrawing = false;
        
        const gapSize = 35; // Eraser gap size in pixels
        
        for (let i = 0; i < width; i++) {
          // Skip drawing in the eraser gap region ahead of the sweep line
          const distanceToSweep = (i - sweepX + width) % width;
          if (distanceToSweep < gapSize) {
            isDrawing = false;
            continue;
          }
          
          const drawY = centerY + yHistory[i];
          if (!isDrawing) {
            ctx.moveTo(i, drawY);
            isDrawing = true;
          } else {
            ctx.lineTo(i, drawY);
          }
        }
        ctx.stroke();

        // Draw sweeping light dot (CRT monitor beam head)
        ctx.beginPath();
        ctx.arc(sweepX, centerY + targetY, 4.5, 0, 2 * Math.PI);
        ctx.fillStyle = "#2563eb";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(37, 99, 235, 0.45)";
        ctx.fill();

        // Increment sweep coordinate
        sweepX += sweepSpeed;
        if (sweepX >= width) {
          sweepX = 0;
        }

      } else if (step === "transcribing" || step === "generating") {
        // --- PROCESSING STATE (AI FLOATING SINE WAVES) ---
        // Draw elegant overlapping translucent waves (teal, indigo, violet)
        ctx.shadowBlur = 0; // disable heavy shadows for multiple waves performance
        
        const waveColors = [
          "rgba(6, 182, 212, 0.45)", // Teal
          "rgba(139, 92, 246, 0.45)", // Violet/Purple
          "rgba(59, 130, 246, 0.3)"    // Bright Blue
        ];
        
        const waveHeights = [18, 14, 10];
        const waveFrequencies = [0.012, 0.018, 0.008];
        const phases = [aiPhase1, aiPhase2, aiPhase3];

        // Draw multiple waves
        for (let w = 0; w < 3; w++) {
          ctx.beginPath();
          ctx.lineWidth = w === 0 ? 3 : 2;
          ctx.strokeStyle = waveColors[w];
          
          // Outer glow for the primary wave
          if (w === 0) {
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(6, 182, 212, 0.35)";
          } else {
            ctx.shadowBlur = 0;
          }

          for (let x = 0; x < width; x++) {
            // Dampen waves near edges (smooth fade in/out on sides)
            const edgeDamping = Math.sin((x / width) * Math.PI);
            const y = centerY + Math.sin(x * waveFrequencies[w] + phases[w]) * waveHeights[w] * edgeDamping;
            
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }

        // Increment phases to create active flow animation
        aiPhase1 += 0.04;
        aiPhase2 -= 0.03;
        aiPhase3 += 0.02;

      } else if (step === "done") {
        // --- COMPLETED SUCCESS STATE ---
        // Pulse clean resting green line
        successCirclePulse += 0.05;
        successWaveState += 0.02;

        const pulseScale = Math.sin(successCirclePulse) * 4;
        
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#10b981"; // success emerald-mint
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(16, 185, 129, 0.25)";

        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const edgeDamping = Math.sin((x / width) * Math.PI);
          // A slow breathing wave
          const y = centerY + Math.sin(x * 0.01 + successWaveState) * (3 + pulseScale) * edgeDamping;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

      } else {
        // --- IDLE / ERROR / BASE STATE (CALM RESTING PULSE) ---
        // A very slow, quiet standard ECG line or straight line
        ctx.lineWidth = 2;
        ctx.strokeStyle = step === "error" ? "#ef4444" : "rgba(148, 163, 184, 0.25)";
        ctx.shadowBlur = step === "error" ? 6 : 0;
        ctx.shadowColor = "rgba(239, 68, 68, 0.3)";

        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions, step]);

  // CSS mappings for processing state tags
  const showTimer = step === "recording";

  return (
    <div className="w-full flex flex-col items-center select-none" ref={containerRef}>
      {/* Visual Monitor Canvas Wrapper */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-50/50">
        
        {/* Canvas Render target */}
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-40 block"
        />
 
        {/* Live Top HUD Panel (Inside Monitor) */}
        <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[10px] font-mono tracking-wider text-slate-400 uppercase z-20">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "h-1.5 w-1.5 rounded-full",
              step === "recording" ? "bg-rose-500 animate-ping" : 
              (step === "transcribing" || step === "generating") ? "bg-indigo-500 animate-pulse" :
              step === "done" ? "bg-emerald-500" : "bg-slate-400"
            )} />
            <span className={cn(
              "font-bold",
              step === "recording" ? "text-rose-600" :
              (step === "transcribing" || step === "generating") ? "text-indigo-600" :
              step === "done" ? "text-emerald-600" : "text-slate-500"
            )}>
              {step === "recording" ? "LEAD II - REC ACTIVE" :
               step === "transcribing" ? "TRANSCRIPTION PIPELINE" :
               step === "generating" ? "STRUCTURING REPORT" :
               step === "done" ? "SYSTEM SAVED" : "MONITOR READY"}
            </span>
          </div>
 
          {showTimer && (
            <div className="flex items-center gap-1.5 font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
              <Mic className="h-3 w-3 animate-pulse text-rose-600" />
              <span>
                {Math.floor(duration / 60).toString().padStart(2, "0")}:
                {(duration % 60).toString().padStart(2, "0")}
              </span>
            </div>
          )}
          
          {!showTimer && (
            <div className="text-slate-400 font-bold">
              {step === "done" ? "SUCCESS" : "STANDBY"}
            </div>
          )}
        </div>
 
        {/* Inner Monitor Overlay Alert Messages */}
        {step === "idle" && (
          <div className="absolute inset-0 bg-slate-50/10 flex flex-col items-center justify-center gap-3 z-30">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-450 shadow-sm">
              <Mic className="h-5 w-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xs font-semibold tracking-wider text-slate-600 font-mono">
                READY TO RECORD
              </h3>
              <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">
                Microphone Standby · Press Start Below
              </p>
            </div>
          </div>
        )}
 
        {(step === "transcribing" || step === "generating") && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[1.5px] flex flex-col items-center justify-center gap-3 z-30 transition-all duration-300">
            <div className="flex items-center justify-center p-3 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-650 animate-[spin_3s_linear_infinite] shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-xs font-semibold tracking-wider text-indigo-700 font-mono">
                {step === "transcribing" ? "TRANSCRIBING CONSULTATION..." : "GENERATING PRESCRIPTION..."}
              </h3>
              <p className="text-[9px] text-indigo-500/70 font-mono uppercase tracking-widest">
                AI Pipeline Processing Audio Stream
              </p>
            </div>
          </div>
        )}
 
        {step === "done" && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 z-30 animate-fade-in">
            <div className="flex items-center justify-center p-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm animate-pulse">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="text-center space-y-0.5">
              <h3 className="text-xs font-bold tracking-wider text-emerald-700 font-mono">
                GENERATION COMPLETE
              </h3>
              <p className="text-[9px] text-emerald-600/70 font-mono uppercase tracking-widest">
                Prescription parsed successfully
              </p>
            </div>
          </div>
        )}
 
        {step === "error" && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center gap-2 z-30">
            <div className="flex items-center justify-center p-2 rounded-full bg-rose-50 border border-rose-100 text-rose-600 shadow-sm animate-pulse">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="text-center space-y-0.5 px-4">
              <h3 className="text-xs font-bold tracking-wider text-rose-700 font-mono">
                PIPELINE ERROR
              </h3>
              <p className="text-[10px] text-rose-600/80 font-mono max-w-xs truncate">
                {errorMsg ?? "Something went wrong during dictation"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

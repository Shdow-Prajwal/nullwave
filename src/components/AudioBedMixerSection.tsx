import React, { useState, useEffect, useRef } from 'react';
import { Sliders, Volume2, VolumeX } from 'lucide-react';

export const AudioBedMixerSection: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mixer layers
  const [rain, setRain] = useState<number>(62);
  const [drone, setDrone] = useState<number>(48);
  const [machine, setMachine] = useState<number>(30);

  // Draw 3 live interactive waveform layers exactly matching the provided design script
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      const w = (canvas.width = canvas.parentElement?.clientWidth || 360);
      const h = (canvas.height = 110);

      // Dark background
      ctx.fillStyle = '#0C0E12';
      ctx.fillRect(0, 0, w, h);

      const layers = [
        { v: rain / 100, col: 'rgba(244,245,246,0.9)', f: 0.02, sp: 1.4 },
        { v: drone / 100, col: 'rgba(139,144,153,0.85)', f: 0.008, sp: 0.7 },
        { v: machine / 100, col: 'rgba(255,107,107,0.8)', f: 0.045, sp: 2.1 },
      ];

      layers.forEach((L, k) => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y =
            h / 2 +
            Math.sin(x * L.f + t * L.sp + k) * (h * 0.34 * L.v) +
            Math.sin(x * L.f * 2.7 + t * L.sp * 1.7) * (h * 0.1 * L.v);
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = L.col;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      });

      t += 0.018;
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [rain, drone, machine]);

  return (
    <section id="mixer" className="py-8 border-t border-[#232733]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left Copy */}
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#FF6B6B]">
            Acoustic Sub-layers
          </span>
          <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase tracking-tight text-white mt-1 mb-3">
            Build Your Own Bed
          </h2>
          <p className="font-mono text-xs text-neutral-400 leading-relaxed max-w-md">
            Every broadcast channel rests upon three foundational ambient sub-layers: textured rain,
            resonant sub drones, and modular machine hum. Adjust their levels below to reshape the
            ambient sonic bed.
          </p>
        </div>

        {/* Right Desk & Waveform Canvas */}
        <div className="p-6 rounded-3xl bg-[#12141A] border border-[#232733] shadow-xl space-y-4">
          {/* Waveform Canvas */}
          <div className="rounded-2xl overflow-hidden border border-[#232733]">
            <canvas ref={canvasRef} className="w-full h-28 block bg-[#0C0E12]" />
          </div>

          {/* Slider Channels */}
          <div className="space-y-3 font-mono text-xs pt-2">
            {/* Rain */}
            <div className="flex items-center gap-4">
              <label className="w-20 uppercase tracking-wider text-neutral-400 font-semibold">
                Rain
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={rain}
                onChange={(e) => setRain(Number(e.target.value))}
                className="flex-1 accent-neutral-200 h-1.5 bg-[#232733] rounded-lg cursor-pointer"
              />
              <span className="w-8 text-right text-neutral-300 font-bold">{rain}</span>
            </div>

            {/* Drone */}
            <div className="flex items-center gap-4">
              <label className="w-20 uppercase tracking-wider text-neutral-400 font-semibold">
                Drone
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={drone}
                onChange={(e) => setDrone(Number(e.target.value))}
                className="flex-1 accent-[#8B9099] h-1.5 bg-[#232733] rounded-lg cursor-pointer"
              />
              <span className="w-8 text-right text-neutral-300 font-bold">{drone}</span>
            </div>

            {/* Machine */}
            <div className="flex items-center gap-4">
              <label className="w-20 uppercase tracking-wider text-[#FF6B6B] font-semibold">
                Machine
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={machine}
                onChange={(e) => setMachine(Number(e.target.value))}
                className="flex-1 accent-[#FF6B6B] h-1.5 bg-[#232733] rounded-lg cursor-pointer"
              />
              <span className="w-8 text-right text-[#FF6B6B] font-bold">{machine}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { Brain, Zap, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Key, RotateCcw } from 'lucide-react';
import { FlashcardContent } from '../../../types/study';

interface FlashcardItemProps {
    content: FlashcardContent;
    flipped: boolean;
    onFlip: () => void;
    onContinue?: () => void;
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({ content, flipped, onFlip, onContinue }) => {
    const carDOMRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Game state stored in refs for 60fps performance without React re-renders
    const carState = useRef({ x: 50, y: 85, angle: 0, speed: 0 });
    const keys = useRef({ Up: false, Down: false, Left: false, Right: false });

    // Reset the car position when the card flips back to the front
    useEffect(() => {
        if (!flipped) {
            carState.current = { x: 50, y: 85, angle: 0, speed: 0 };
            setIsPlaying(false);
            if (carDOMRef.current) {
                carDOMRef.current.style.transform = `translate(-50%, -50%) rotate(0deg)`;
                carDOMRef.current.style.left = `50%`;
                carDOMRef.current.style.top = `85%`;
            }
        }
    }, [flipped]);

    // --- True Driving Physics Engine ---
    useEffect(() => {
        let frameId: number;

        // Physics Constants
        const MAX_SPEED = 0.8;
        const MAX_REVERSE = 0.4;
        const ACCEL = 0.03;
        const FRICTION = 0.015;
        const TURN_SPEED = 3.5;

        const gameLoop = () => {
            // Pause loop if card is flipped or game hasn't started
            if (flipped || !isPlaying) {
                frameId = requestAnimationFrame(gameLoop);
                return;
            }

            let { x, y, angle, speed } = carState.current;

            // 1. Acceleration & Braking
            if (keys.current.Up) speed += ACCEL;
            if (keys.current.Down) speed -= ACCEL;

            // 2. Friction / Drag
            if (!keys.current.Up && !keys.current.Down) {
                if (speed > 0) speed = Math.max(0, speed - FRICTION);
                if (speed < 0) speed = Math.min(0, speed + FRICTION);
            }

            // Cap speeds
            speed = Math.max(-MAX_REVERSE, Math.min(MAX_SPEED, speed));

            // 3. Steering
            if (Math.abs(speed) > 0.05) {
                const turnDir = speed > 0 ? 1 : -1;
                if (keys.current.Left) angle -= TURN_SPEED * turnDir;
                if (keys.current.Right) angle += TURN_SPEED * turnDir;
            }

            // 4. Calculate new position
            const rad = (angle - 90) * (Math.PI / 180);
            x += Math.cos(rad) * speed;
            y += Math.sin(rad) * speed;

            // 5. Wall Collisions
            if (x < 4) { x = 4; speed *= -0.5; }
            if (x > 96) { x = 96; speed *= -0.5; }
            if (y < 4) { y = 4; speed *= -0.5; }
            if (y > 96) { y = 96; speed *= -0.5; }

            // 6. Check Win/Answer Condition (Crashing into the target node at top center)
            // Target is roughly at x: 50, y: 25. Radius of ~15
            if (Math.abs(x - 50) < 18 && Math.abs(y - 25) < 18) {
                setIsPlaying(false);
                onFlip(); // Trigger the 3D flip!
                return;
            }

            // Update State Ref
            carState.current = { x, y, angle, speed };

            // Update DOM directly for smooth 60fps
            if (carDOMRef.current) {
                carDOMRef.current.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
                carDOMRef.current.style.left = `${x}%`;
                carDOMRef.current.style.top = `${y}%`;
            }

            frameId = requestAnimationFrame(gameLoop);
        };

        frameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(frameId);
    }, [isPlaying, flipped, onFlip]);

    // Keyboard Listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPlaying || flipped) return;
            if (['ArrowUp', 'w', 'W'].includes(e.key)) { keys.current.Up = true; e.preventDefault(); }
            if (['ArrowDown', 's', 'S'].includes(e.key)) { keys.current.Down = true; e.preventDefault(); }
            if (['ArrowLeft', 'a', 'A'].includes(e.key)) { keys.current.Left = true; e.preventDefault(); }
            if (['ArrowRight', 'd', 'D'].includes(e.key)) { keys.current.Right = true; e.preventDefault(); }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (['ArrowUp', 'w', 'W'].includes(e.key)) keys.current.Up = false;
            if (['ArrowDown', 's', 'S'].includes(e.key)) keys.current.Down = false;
            if (['ArrowLeft', 'a', 'A'].includes(e.key)) keys.current.Left = false;
            if (['ArrowRight', 'd', 'D'].includes(e.key)) keys.current.Right = false;
        };

        window.addEventListener('keydown', handleKeyDown, { passive: false });
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isPlaying, flipped]);

    const bindControl = (dir: keyof typeof keys.current) => ({
        onPointerDown: (e: React.PointerEvent) => { keys.current[dir] = true; },
        onPointerUp: (e: React.PointerEvent) => { keys.current[dir] = false; },
        onPointerLeave: () => { keys.current[dir] = false; }
    });

    return (
        <div className="w-full flex flex-col items-center">

            {/* HUD Bar */}
            <div className="w-full bg-slate-950 border-x-4 border-t-4 border-slate-700 rounded-t-3xl p-4 flex justify-between items-center z-10 shadow-lg">
                <div className="flex items-center gap-2 text-indigo-400">
                    <Brain size={20} className={!flipped ? "animate-pulse" : ""} />
                    <span className="font-black uppercase tracking-widest text-sm">
            {!flipped ? "Memory Node Locked" : "Memory Decrypted"}
          </span>
                </div>
            </div>

            {/* 3D Flipping Container */}
            <div className="relative w-full h-[500px] sm:h-[650px] perspective-1000 group z-0">
                <div className={`relative w-full h-full transition-transform duration-700 preserve-3d shadow-2xl rounded-b-3xl ${flipped ? 'rotate-y-180' : ''}`}>

                    {/* =======================
              FRONT (The Driving Game)
              ======================= */}
                    <div className="absolute inset-0 backface-hidden bg-slate-900 border-x-4 border-b-4 border-slate-700 rounded-b-3xl flex flex-col items-center select-none">

                        {/* Grid Texture */}
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0yMCAyMGgtdjIwSDB6IiBmaWxsPSIjMWUyOTNiIiBmaWxsLW9wYWNpdHk9IjAuNCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-50 z-0"></div>

                        {/* Start Overlay */}
                        {!isPlaying && !flipped && (
                            <div
                                onClick={() => setIsPlaying(true)}
                                className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer group rounded-b-3xl"
                            >
                                <button className="bg-indigo-600 text-white font-black text-xl px-8 py-4 rounded-full shadow-[0_0_30px_rgba(79,70,229,0.6)] group-hover:scale-105 active:scale-95 transition-transform flex items-center gap-3 animate-pulse border-2 border-indigo-400">
                                    <Key size={24} /> START ROVER
                                </button>
                                <p className="text-indigo-300 mt-4 font-bold text-sm tracking-widest uppercase">Drive into the memory to flip!</p>
                            </div>
                        )}

                        {/* Target Node (The Flashcard Front Text) */}
                        <div
                            onClick={onFlip} // Fallback click-to-flip
                            className="absolute top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] max-w-sm z-10 cursor-pointer"
                        >
                            <div className="bg-slate-800/80 backdrop-blur-md border-2 border-indigo-500 rounded-2xl p-4 sm:p-6 text-center shadow-[0_0_30px_rgba(79,70,229,0.4)] relative overflow-hidden group">
                                {/* Scanner effect line */}
                                <div className="absolute inset-0 h-1 bg-indigo-400/50 shadow-[0_0_10px_rgba(129,140,248,1)] animate-[scan_2s_ease-in-out_infinite]"></div>

                                <Zap className="h-6 w-6 text-indigo-400 mx-auto mb-2 animate-pulse" />
                                <h2 className="text-lg sm:text-xl font-bold text-indigo-100 leading-tight">
                                    {content.front}
                                </h2>
                                {content.image_url && (
                                    <img src={content.image_url} alt="" className="mt-4 max-h-24 mx-auto object-contain rounded-lg border border-indigo-500/30" />
                                )}
                            </div>
                        </div>

                        {/* The Player's Rover */}
                        <div
                            ref={carDOMRef}
                            className="absolute z-30 pointer-events-none drop-shadow-2xl origin-center"
                            style={{ left: '50%', top: '85%', transform: 'translate(-50%, -50%) rotate(0deg)' }}
                        >
                            <div className="relative w-8 h-12 sm:w-10 sm:h-14">
                                {/* Main Car Body */}
                                <div className="absolute inset-0 rounded-xl shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] border border-slate-900 z-10 bg-indigo-500">
                                    {/* Racing Stripe */}
                                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-slate-900 opacity-50"></div>
                                    {/* Cockpit */}
                                    <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[80%] h-[35%] bg-slate-900 rounded-md border-2 border-slate-800"></div>
                                    {/* Headlights */}
                                    <div className="absolute top-0 left-1 w-2.5 h-1.5 rounded-b-full bg-white opacity-80 shadow-[0_-15px_25px_rgba(255,255,255,0.9)]"></div>
                                    <div className="absolute top-0 right-1 w-2.5 h-1.5 rounded-b-full bg-white opacity-80 shadow-[0_-15px_25px_rgba(255,255,255,0.9)]"></div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* =======================
              BACK (The Decrypted Info)
              ======================= */}
                    <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-900 to-slate-900 border-x-4 border-b-4 border-indigo-500 rounded-b-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center shadow-[inset_0_0_50px_rgba(79,70,229,0.3)] rotate-y-180 overflow-y-auto">

                        <div className="bg-indigo-950/50 p-6 rounded-2xl border border-indigo-500/30 backdrop-blur-sm w-full max-w-lg shadow-xl">
                            <p className="text-xl sm:text-2xl font-black text-white mb-4 leading-relaxed tracking-wide">
                                {content.back}
                            </p>

                            {content.explanation && (
                                <div className="mt-4 p-4 bg-slate-900/80 rounded-xl border border-indigo-500/20 text-sm sm:text-base text-indigo-200 italic shadow-inner">
                                    {content.explanation}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                            <button
                                onClick={onFlip}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-indigo-400 border-2 border-indigo-500/30 rounded-full font-black tracking-widest uppercase transition-all active:scale-95"
                            >
                                <RotateCcw size={20} /> Flip Back
                            </button>

                            {onContinue && (
                                <button
                                    onClick={onContinue}
                                    className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-black tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(79,70,229,0.5)] active:scale-95 animate-in slide-in-from-right-4"
                                >
                                    <span>Continue</span>
                                    <ChevronRight size={20} />
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Pro Mobile Controls (Only visible on front face) */}
            <div className={`w-full bg-slate-950 p-4 border-x-4 border-b-4 border-slate-800 rounded-b-3xl select-none transition-all duration-300 ${flipped ? 'opacity-0 h-0 p-0 border-0 overflow-hidden' : 'opacity-100'}`}>
                <div className="flex justify-between items-center gap-4 lg:hidden">

                    {/* Steering */}
                    <div className="flex gap-2">
                        <button {...bindControl('Left')} className="w-16 h-16 bg-slate-800 active:bg-indigo-600 rounded-2xl flex items-center justify-center text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all shadow-md">
                            <ChevronLeft size={36} strokeWidth={3} />
                        </button>
                        <button {...bindControl('Right')} className="w-16 h-16 bg-slate-800 active:bg-indigo-600 rounded-2xl flex items-center justify-center text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all shadow-md">
                            <ChevronRight size={36} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Pedals */}
                    <div className="flex gap-2">
                        <button {...bindControl('Down')} className="w-16 h-16 bg-slate-800 active:bg-red-600 rounded-2xl flex items-center justify-center text-red-400 active:text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all shadow-md">
                            <ArrowDown size={30} strokeWidth={3} />
                        </button>
                        <button {...bindControl('Up')} className="w-16 h-16 bg-slate-800 active:bg-green-500 rounded-2xl flex items-center justify-center text-green-400 active:text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all shadow-md">
                            <ArrowUp size={36} strokeWidth={4} />
                        </button>
                    </div>

                </div>
                {/* Helper text for desktop */}
                <p className="hidden lg:block text-center text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">
                    Use WASD or Arrow Keys to Drive
                </p>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}} />
        </div>
    );
};

export default FlashcardItem;
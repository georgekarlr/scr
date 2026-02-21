import React, { useState, useEffect, useRef } from 'react';
import { ListOrdered, Key, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ShieldAlert, ClipboardList, X, ChevronsUp, ChevronsDown, HardDriveUpload } from 'lucide-react';
import { OrderSequenceContent } from '../../../types/study';

interface OrderSequenceItemProps {
    content: OrderSequenceContent;
    orderedItems: string[];
    isAnswered: boolean;
    onMove: (idx: number, direction: 'up' | 'down') => void;
    onCheck: () => void;
}

const OrderSequenceItem: React.FC<OrderSequenceItemProps> = ({
                                                                 content,
                                                                 orderedItems,
                                                                 isAnswered,
                                                                 onMove,
                                                                 onCheck
                                                             }) => {
    const carDOMRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isOverlayOpen, setIsOverlayOpen] = useState(true); // Start with overlay open

    // High-performance state stored in refs (bypasses React renders for 60fps)
    const carState = useRef({ x: 50, y: 10, angle: 180, speed: 0 }); // Start near the top, facing down
    const keys = useRef({ Up: false, Down: false, Left: false, Right: false });
    const hitCooldown = useRef(0);

    // Sync callbacks to refs so the game loop always has the latest without restarting
    const actionsRef = useRef({ onMove, onCheck });
    useEffect(() => { actionsRef.current = { onMove, onCheck }; }, [onMove, onCheck]);

    // Auto-open overlay to show results when answered
    useEffect(() => {
        if (isAnswered) {
            setIsPlaying(false);
            setIsOverlayOpen(true);
        }
    }, [isAnswered]);

    const numItems = orderedItems.length;
    // Calculate vertical positions for the items dynamically
    const getItemY = (index: number) => {
        if (numItems <= 1) return 50;
        // Distribute from Y=25 to Y=75
        return 25 + (index * (50 / (numItems - 1)));
    };

    // --- Physics & Driving Engine ---
    useEffect(() => {
        let frameId: number;
        const MAX_SPEED = 0.7;
        const MAX_REVERSE = 0.35;
        const ACCEL = 0.025;
        const FRICTION = 0.015;
        const TURN_SPEED = 3.8;

        const gameLoop = () => {
            if (isAnswered || isOverlayOpen || !isPlaying) {
                frameId = requestAnimationFrame(gameLoop);
                return;
            }

            let { x, y, angle, speed } = carState.current;

            // 1. Acceleration & Friction
            if (keys.current.Up) speed += ACCEL;
            if (keys.current.Down) speed -= ACCEL;
            if (!keys.current.Up && !keys.current.Down) {
                if (speed > 0) speed = Math.max(0, speed - FRICTION);
                if (speed < 0) speed = Math.min(0, speed + FRICTION);
            }
            speed = Math.max(-MAX_REVERSE, Math.min(MAX_SPEED, speed));

            // 2. Steering
            if (Math.abs(speed) > 0.05) {
                const turnDir = speed > 0 ? 1 : -1;
                if (keys.current.Left) angle -= TURN_SPEED * turnDir;
                if (keys.current.Right) angle += TURN_SPEED * turnDir;
            }

            // 3. Move
            const rad = (angle - 90) * (Math.PI / 180);
            x += Math.cos(rad) * speed;
            y += Math.sin(rad) * speed;

            // 4. Wall Collisions
            if (x < 2) { x = 2; speed *= -0.5; }
            if (x > 98) { x = 98; speed *= -0.5; }
            if (y < 2) { y = 2; speed *= -0.5; }
            if (y > 98) { y = 98; speed *= -0.5; }

            // 5. Factory Collisions (Bump Pads & Submit Zone)
            if (hitCooldown.current > 0) {
                hitCooldown.current--;
            } else {
                // A. Check Submit Zone (Bottom Center)
                if (y > 88 && Math.abs(x - 50) < 20) {
                    actionsRef.current.onCheck();
                    hitCooldown.current = 60;
                    speed *= -1;
                }

                // B. Check Up/Down Bump Pads
                for (let i = 0; i < numItems; i++) {
                    const itemY = getItemY(i);

                    // UP Pad (Left Side: x=18)
                    if (i > 0 && Math.abs(x - 18) < 8 && Math.abs(y - itemY) < 8) {
                        actionsRef.current.onMove(i, 'up');
                        hitCooldown.current = 25;
                        speed = -speed * 1.5; // Bounce
                        x += Math.cos(rad) * speed * 2; // Pop out
                        y += Math.sin(rad) * speed * 2;
                        break;
                    }

                    // DOWN Pad (Right Side: x=82)
                    if (i < numItems - 1 && Math.abs(x - 82) < 8 && Math.abs(y - itemY) < 8) {
                        actionsRef.current.onMove(i, 'down');
                        hitCooldown.current = 25;
                        speed = -speed * 1.5; // Bounce
                        x += Math.cos(rad) * speed * 2; // Pop out
                        y += Math.sin(rad) * speed * 2;
                        break;
                    }

                    // Center Block Collision (Just bounce off the item itself)
                    if (Math.abs(x - 50) < 25 && Math.abs(y - itemY) < 6) {
                        hitCooldown.current = 10;
                        speed *= -1;
                        x += Math.cos(rad) * speed * 2;
                        y += Math.sin(rad) * speed * 2;
                    }
                }
            }

            // 6. Update State & DOM
            carState.current = { x, y, angle, speed };

            if (carDOMRef.current) {
                carDOMRef.current.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
                carDOMRef.current.style.left = `${x}%`;
                carDOMRef.current.style.top = `${y}%`;
            }

            frameId = requestAnimationFrame(gameLoop);
        };

        frameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(frameId);
    }, [isPlaying, isAnswered, isOverlayOpen, numItems]);

    // Keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isPlaying || isAnswered || isOverlayOpen) return;
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
    }, [isPlaying, isAnswered, isOverlayOpen]);

    const bindControl = (dir: keyof typeof keys.current) => ({
        onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); keys.current[dir] = true; },
        onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); keys.current[dir] = false; },
        onPointerLeave: () => { keys.current[dir] = false; }
    });

    const startGame = () => {
        setIsPlaying(true);
        setIsOverlayOpen(false);
    };

    return (
        <div className="w-full bg-slate-900 border-4 border-slate-700 rounded-3xl shadow-2xl overflow-hidden font-sans select-none flex flex-col relative">

            {/* Title Bar */}
            <div className="bg-slate-950 border-b-2 border-slate-800 p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-2 text-cyan-400">
                    <ListOrdered size={20} />
                    <span className="font-black uppercase tracking-widest text-sm">Assembly Line</span>
                </div>
                {/* HUD Button to open overlay */}
                {isPlaying && !isAnswered && (
                    <button
                        onClick={() => setIsOverlayOpen(true)}
                        className="flex items-center gap-2 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(8,145,178,0.4)]"
                    >
                        <ClipboardList size={16} /> View Sequence
                    </button>
                )}
            </div>

            {/* The Driving Arena */}
            <div className="relative w-full h-[650px] sm:h-[750px] bg-slate-900 overflow-hidden touch-none">

                {/* Factory Floor Grid */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0yMCAyMGgtdjIwSDB6IiBmaWxsPSIjMWUyOTNiIiBmaWxsLW9wYWNpdHk9IjAuNSIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-40"></div>
                {/* Central Conveyor Belt Line */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-16 bg-slate-800/50 border-x-4 border-dashed border-slate-700/50"></div>

                {/* Dynamic Sequence Items (Server Blades) & Bump Pads */}
                {orderedItems.map((text, idx) => {
                    const yPos = getItemY(idx);
                    const isCorrectPosition = isAnswered && text === content.items[idx].text;

                    let blockColor = "border-slate-600 bg-slate-800 text-slate-200";
                    if (isAnswered) {
                        blockColor = isCorrectPosition ? 'border-green-500 bg-green-900/60 text-green-300' : 'border-red-500 bg-red-900/60 text-red-300';
                    }

                    return (
                        <React.Fragment key={text}>
                            {/* UP Bump Pad (Left side) */}
                            {idx > 0 && !isAnswered && (
                                <div
                                    className="absolute w-12 h-12 bg-cyan-500/20 border-2 border-cyan-400 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.4)] animate-pulse z-10"
                                    style={{ left: '18%', top: `${yPos}%`, transform: 'translate(-50%, -50%)' }}
                                >
                                    <ChevronsUp className="text-cyan-300" size={24} />
                                </div>
                            )}

                            {/* DOWN Bump Pad (Right side) */}
                            {idx < numItems - 1 && !isAnswered && (
                                <div
                                    className="absolute w-12 h-12 bg-pink-500/20 border-2 border-pink-400 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(244,114,182,0.4)] animate-pulse z-10"
                                    style={{ left: '82%', top: `${yPos}%`, transform: 'translate(-50%, -50%)' }}
                                >
                                    <ChevronsDown className="text-pink-300" size={24} />
                                </div>
                            )}

                            {/* The Item Block (Server Blade) */}
                            <div
                                className={`absolute w-[45%] p-3 rounded-xl border-2 flex items-center shadow-2xl transition-all duration-500 ease-in-out z-20 ${blockColor}`}
                                style={{ left: '50%', top: `${yPos}%`, transform: 'translate(-50%, -50%)' }}
                            >
                                <div className={`w-8 h-8 rounded-md flex items-center justify-center font-black text-sm shrink-0 mr-3 ${
                                    isAnswered ? (isCorrectPosition ? 'bg-green-500 text-slate-900' : 'bg-red-500 text-white') : 'bg-slate-700 text-cyan-400'
                                }`}>
                                    {idx + 1}
                                </div>
                                <span className="text-xs sm:text-sm font-bold truncate tracking-wide">{text}</span>
                            </div>
                        </React.Fragment>
                    );
                })}

                {/* SUBMIT SEQUENCE DOCK (Bottom Center) */}
                <div
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-20 border-t-8 border-x-8 rounded-t-2xl flex flex-col items-center justify-center z-10 transition-colors duration-300 ${
                        isAnswered ? 'border-slate-700 bg-slate-800/50' : 'border-cyan-500 bg-cyan-900/40 shadow-[0_0_30px_rgba(34,211,238,0.3)]'
                    }`}
                >
                    {/* Warning stripes */}
                    <div className="absolute inset-0 rounded-t-xl opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]"></div>
                    <HardDriveUpload className={`mb-1 ${isAnswered ? 'text-slate-500' : 'text-cyan-400 animate-bounce'}`} size={28} />
                    <span className={`font-black tracking-widest uppercase text-xs sm:text-sm ${isAnswered ? 'text-slate-500' : 'text-cyan-300'}`}>
            {isAnswered ? 'Sequence Locked' : 'Drive Here to Submit'}
          </span>
                </div>

                {/* The Player's Factory Rover */}
                <div
                    ref={carDOMRef}
                    className={`absolute z-30 pointer-events-none transition-opacity duration-500 ${isAnswered ? 'opacity-0' : 'opacity-100'}`}
                    style={{ left: '50%', top: '10%', transform: 'translate(-50%, -50%) rotate(180deg)' }}
                >
                    <div className="relative w-8 h-12 sm:w-10 sm:h-14">
                        {/* Rover Body */}
                        <div className="absolute inset-0 rounded-lg border-2 border-slate-900 z-10 bg-yellow-400 shadow-xl flex flex-col items-center justify-between py-1">
                            <div className="w-6 h-2 bg-slate-800 rounded-sm"></div> {/* Grill */}
                            <div className="w-5 h-4 bg-slate-900 rounded-sm border border-slate-700"></div> {/* Cockpit */}
                            <div className="w-4 h-2 bg-slate-800 rounded-sm"></div> {/* Back */}
                        </div>
                        {/* Warning Beacons */}
                        <div className="absolute top-1/2 -left-1 w-1.5 h-3 bg-red-500 rounded-full animate-ping shadow-[0_0_10px_rgba(239,68,68,1)] z-20"></div>
                        <div className="absolute top-1/2 -right-1 w-1.5 h-3 bg-red-500 rounded-full animate-ping shadow-[0_0_10px_rgba(239,68,68,1)] z-20"></div>
                    </div>
                </div>

                {/* =========================================
            IN-GAME OVERLAY MODAL (Standard UI)
            ========================================= */}
                {isOverlayOpen && (
                    <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="w-full max-w-2xl flex justify-between items-start mb-6 border-b-2 border-slate-800 pb-4">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 text-cyan-400 mb-2">
                                    <ClipboardList size={18} />
                                    <span className="font-bold uppercase tracking-widest text-xs">Sequence Instructions</span>
                                </div>
                                {content.question && (
                                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                                        {content.question}
                                    </h2>
                                )}
                            </div>

                            {!isAnswered && (
                                <button
                                    onClick={startGame}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-full shadow-lg transition-transform active:scale-90 flex-shrink-0"
                                >
                                    <X size={24} />
                                </button>
                            )}
                        </div>

                        {/* Classic Sequence List UI (Fallback) */}
                        <div className="w-full max-w-2xl space-y-3 pb-24">
                            {orderedItems.map((text, idx) => {
                                const isCorrectPosition = isAnswered && text === content.items[idx].text;
                                return (
                                    <div
                                        key={`modal-${idx}`}
                                        className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border-2 transition-all ${
                                            isAnswered
                                                ? (isCorrectPosition ? 'border-green-500 bg-green-900/40 text-green-300' : 'border-red-500 bg-red-900/40 text-red-300')
                                                : 'border-slate-700 bg-slate-800 text-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                                            <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${
                                                isAnswered ? (isCorrectPosition ? 'bg-green-600 text-slate-900' : 'bg-red-600 text-white') : 'bg-slate-600 text-cyan-400'
                                            }`}>
                                                {idx + 1}
                                            </div>
                                            <span className="font-medium text-sm sm:text-base truncate">{text}</span>
                                        </div>

                                        {/* Fallback Move Buttons */}
                                        {!isAnswered && (
                                            <div className="flex flex-col space-y-1">
                                                <button
                                                    onClick={() => onMove(idx, 'up')}
                                                    disabled={idx === 0}
                                                    className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg disabled:opacity-30 transition-colors"
                                                >
                                                    <ChevronLeft className="h-5 w-5 rotate-90" />
                                                </button>
                                                <button
                                                    onClick={() => onMove(idx, 'down')}
                                                    disabled={idx === orderedItems.length - 1}
                                                    className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg disabled:opacity-30 transition-colors"
                                                >
                                                    <ChevronRight className="h-5 w-5 rotate-90" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Check/Resume Button pinned to bottom */}
                        {!isAnswered && (
                            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center gap-3 pointer-events-none px-4">
                                <button
                                    onClick={onCheck}
                                    className="w-full max-w-sm pointer-events-auto py-3 bg-cyan-600 text-white font-black rounded-full shadow-[0_0_20px_rgba(8,145,178,0.5)] hover:bg-cyan-500 active:scale-95 transition-all text-sm uppercase tracking-widest"
                                >
                                    Submit Sequence
                                </button>
                                <button
                                    onClick={startGame}
                                    className="pointer-events-auto flex items-center gap-2 text-cyan-400 font-bold text-xs hover:text-cyan-300 uppercase tracking-widest"
                                >
                                    <Key size={14} /> Resume Driving
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Pro Mobile Controls (Hidden when game is over or modal is open) */}
            <div className="bg-slate-950 p-4 border-t-2 border-slate-800 touch-none select-none relative z-10">
                <div className={`flex justify-between items-center gap-4 lg:hidden transition-opacity ${isOverlayOpen || isAnswered ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>

                    {/* Steering */}
                    <div className="flex gap-2">
                        <button {...bindControl('Left')} className="w-14 h-14 bg-slate-800 active:bg-cyan-600 rounded-xl flex items-center justify-center text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all shadow-md">
                            <ChevronLeft size={32} strokeWidth={3} />
                        </button>
                        <button {...bindControl('Right')} className="w-14 h-14 bg-slate-800 active:bg-cyan-600 rounded-xl flex items-center justify-center text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all shadow-md">
                            <ChevronRight size={32} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Pedals */}
                    <div className="flex gap-2">
                        <button {...bindControl('Down')} className="w-14 h-14 bg-slate-800 active:bg-red-600 rounded-xl flex items-center justify-center text-red-400 active:text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all shadow-md">
                            <ArrowDown size={28} strokeWidth={3} />
                        </button>
                        <button {...bindControl('Up')} className="w-14 h-14 bg-slate-800 active:bg-green-500 rounded-xl flex items-center justify-center text-green-400 active:text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all shadow-md">
                            <ArrowUp size={32} strokeWidth={4} />
                        </button>
                    </div>

                </div>
            </div>

            {/* Post-Game Explanations */}
            {isAnswered && content.explanation && (
                <div className="bg-slate-900 p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-500 relative z-10">
                    <div className="bg-slate-800 border-l-8 border-cyan-500 p-4 sm:p-6 rounded-r-2xl shadow-xl flex items-start gap-4">
                        <div className="bg-cyan-500/20 p-2.5 rounded-full text-cyan-400 shrink-0">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-cyan-400 uppercase tracking-widest text-sm mb-2">
                                Factory Supervisor Notes
                            </h4>
                            <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed">
                                {content.explanation}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderSequenceItem;
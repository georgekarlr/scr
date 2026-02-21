import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare as CheckSquareIcon, Key, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ShieldAlert, ClipboardList, X, UploadCloud } from 'lucide-react';
import { CheckboxQuestionContent, CheckboxOption } from '../../../types/study';

interface CheckboxItemProps {
    content: CheckboxQuestionContent;
    shuffledOptions: CheckboxOption[];
    selectedOptionIds: number[];
    isAnswered: boolean;
    onToggle: (optionId: number) => void;
    onCheck: () => void;
}

const CheckboxItem: React.FC<CheckboxItemProps> = ({
                                                       content,
                                                       shuffledOptions,
                                                       selectedOptionIds,
                                                       isAnswered,
                                                       onToggle,
                                                       onCheck
                                                   }) => {
    const carDOMRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isOverlayOpen, setIsOverlayOpen] = useState(true); // Start with overlay open

    // High-performance state stored in refs (bypasses React renders for 60fps)
    const carState = useRef({ x: 50, y: 12, angle: 180, speed: 0 }); // Start top-center, facing down
    const keys = useRef({ Up: false, Down: false, Left: false, Right: false });
    const hitCooldown = useRef(0);

    // Sync React state to a ref so the game loop has the latest data
    const gameState = useRef({ selectedIds: selectedOptionIds, onToggle, onCheck });
    useEffect(() => {
        gameState.current = { selectedIds: selectedOptionIds, onToggle, onCheck };
    }, [selectedOptionIds, onToggle, onCheck]);

    // Auto-open overlay to show results when answered
    useEffect(() => {
        if (isAnswered) {
            setIsPlaying(false);
            setIsOverlayOpen(true);
        }
    }, [isAnswered]);

    // Map out box positions dynamically based on length (2 columns)
    const getBoxPosition = (index: number, total: number) => {
        const col = index % 2; // 0 for left, 1 for right
        const row = Math.floor(index / 2);
        const totalRows = Math.ceil(total / 2);

        const x = col === 0 ? 25 : 75;
        // Spread Y evenly between 30% and 75%
        const y = totalRows <= 1 ? 50 : 30 + (row * (45 / (totalRows - 1)));
        return { x, y };
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

            // 5. Box & Upload Zone Collisions
            if (hitCooldown.current > 0) {
                hitCooldown.current--;
            } else {
                // A. Check Options (Data Caches)
                for (let i = 0; i < shuffledOptions.length; i++) {
                    const opt = shuffledOptions[i];
                    const pos = getBoxPosition(i, shuffledOptions.length);

                    if (Math.abs(x - pos.x) < 18 && Math.abs(y - pos.y) < 8) {
                        gameState.current.onToggle(opt.id);
                        hitCooldown.current = 30; // 0.5 sec cooldown so it doesn't double-toggle
                        speed *= -1.2; // Bounce off the box
                        x += Math.cos(rad) * speed * 2;
                        y += Math.sin(rad) * speed * 2;
                        break;
                    }
                }

                // B. Check Submit/Upload Zone (Bottom Center)
                if (y > 88 && Math.abs(x - 50) < 25) {
                    if (gameState.current.selectedIds.length > 0) {
                        gameState.current.onCheck();
                    } else {
                        // Bounce if 0 items selected
                        hitCooldown.current = 30;
                        speed *= -1.5;
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
    }, [isPlaying, isAnswered, isOverlayOpen, shuffledOptions]);

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
        onPointerDown: (e: React.PointerEvent) => { keys.current[dir] = true; },
        onPointerUp: (e: React.PointerEvent) => { keys.current[dir] = false; },
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
                <div className="flex items-center gap-2 text-indigo-400">
                    <CheckSquareIcon size={20} />
                    <span className="font-black uppercase tracking-widest text-sm">Data Collector</span>
                </div>
                {/* HUD Button to open overlay */}
                {isPlaying && !isAnswered && (
                    <button
                        onClick={() => setIsOverlayOpen(true)}
                        className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                    >
                        <ClipboardList size={16} /> View Briefing
                    </button>
                )}
            </div>

            {/* The Driving Arena */}
            <div className="relative w-full h-[650px] sm:h-[750px] bg-slate-900">

                {/* Arena Grid Background */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0yMCAyMGgtdjIwSDB6IiBmaWxsPSIjMWUyOTNiIiBmaWxsLW9wYWNpdHk9IjAuNCIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-50"></div>

                {/* Option Boxes (Data Caches) */}
                {shuffledOptions.map((opt, i) => {
                    const pos = getBoxPosition(i, shuffledOptions.length);
                    const isSelected = selectedOptionIds.includes(opt.id);
                    const isCorrect = content.correct_option_ids.includes(opt.id);

                    let boxClass = "border-slate-600 bg-slate-800 text-slate-300";
                    if (isAnswered) {
                        if (isCorrect) boxClass = "border-green-500 bg-green-900/60 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.4)]";
                        else if (isSelected) boxClass = "border-red-500 bg-red-900/60 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.4)]";
                        else boxClass = "border-slate-700 bg-slate-800/50 text-slate-500 opacity-50";
                    } else if (isSelected) {
                        boxClass = "border-indigo-400 bg-indigo-900 text-indigo-100 shadow-[0_0_25px_rgba(99,102,241,0.6)] scale-105";
                    }

                    return (
                        <div
                            key={opt.id}
                            onClick={() => !isAnswered && onToggle(opt.id)} // Fallback tap
                            className={`absolute w-[40%] p-3 rounded-xl border-2 flex items-center shadow-lg transition-all duration-300 ease-in-out cursor-pointer z-10 ${boxClass}`}
                            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                        >
                            <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md flex items-center justify-center shrink-0 mr-3 border-2 transition-colors ${
                                isAnswered && isCorrect ? 'border-green-400 bg-green-500 text-white' :
                                    isAnswered && isSelected && !isCorrect ? 'border-red-400 bg-red-500 text-white' :
                                        !isAnswered && isSelected ? 'border-indigo-300 bg-indigo-500 text-white' :
                                            'border-slate-500 bg-slate-700 text-transparent'
                            }`}>
                                <CheckSquareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <span className="text-xs sm:text-sm font-bold truncate">{opt.text}</span>
                        </div>
                    );
                })}

                {/* UPLOAD ZONE (Submit Pad at Bottom) */}
                <div
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[12%] border-t-4 border-x-4 rounded-t-3xl flex flex-col items-center justify-center z-10 transition-colors duration-300 ${
                        isAnswered ? 'border-slate-700 bg-slate-800/50' :
                            selectedOptionIds.length > 0 ? 'border-indigo-400 bg-indigo-900/60 shadow-[0_0_40px_rgba(99,102,241,0.5)]' : 'border-slate-600 bg-slate-800/80 opacity-60'
                    }`}
                >
                    <div className="absolute inset-0 rounded-t-2xl opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:10px_10px]"></div>
                    <UploadCloud className={`mb-1 ${isAnswered ? 'text-slate-500' : selectedOptionIds.length > 0 ? 'text-indigo-300 animate-pulse' : 'text-slate-500'}`} size={28} />
                    <span className={`font-black tracking-widest uppercase text-xs sm:text-sm ${isAnswered ? 'text-slate-500' : selectedOptionIds.length > 0 ? 'text-indigo-200' : 'text-slate-400'}`}>
            {isAnswered ? 'Data Uploaded' : selectedOptionIds.length > 0 ? 'Drive Here to Upload' : 'Select Data First'}
          </span>
                </div>

                {/* The Player's Rover */}
                <div
                    ref={carDOMRef}
                    className={`absolute z-30 pointer-events-none transition-opacity duration-500 ${isAnswered ? 'opacity-0' : 'opacity-100'}`}
                    style={{ left: '50%', top: '12%', transform: 'translate(-50%, -50%) rotate(180deg)' }}
                >
                    <div className="relative w-8 h-12 sm:w-10 sm:h-14">
                        {/* Rover Body */}
                        <div className="absolute inset-0 rounded-lg border-2 border-slate-900 z-10 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] flex flex-col items-center justify-between py-1">
                            <div className="w-5 h-2 bg-slate-800 rounded-sm"></div> {/* Grill */}
                            <div className="w-6 h-5 bg-slate-900 rounded-sm border border-slate-700 flex items-center justify-center">
                                <div className="w-3 h-2 bg-indigo-300/30 rounded-sm"></div>
                            </div> {/* Cockpit */}
                            <div className="w-4 h-2 bg-slate-800 rounded-sm"></div> {/* Back Engine */}
                        </div>
                        {/* Headlights */}
                        <div className="absolute -bottom-1 left-1 w-2 h-2 rounded-full bg-white shadow-[0_5px_10px_rgba(255,255,255,0.8)] z-20"></div>
                        <div className="absolute -bottom-1 right-1 w-2 h-2 rounded-full bg-white shadow-[0_5px_10px_rgba(255,255,255,0.8)] z-20"></div>
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
                                <div className="flex items-center gap-2 text-indigo-400 mb-2">
                                    <ClipboardList size={18} />
                                    <span className="font-bold uppercase tracking-widest text-xs">Mission Briefing</span>
                                </div>
                                {content.question && (
                                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                                        {content.question}
                                    </h2>
                                )}
                                <p className="text-slate-400 text-sm mt-2 italic">Select all that apply.</p>
                            </div>

                            {!isAnswered && (
                                <button
                                    onClick={startGame}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-full shadow-lg transition-transform active:scale-90 flex-shrink-0"
                                >
                                    <X size={24} />
                                </button>
                            )}
                        </div>

                        {/* Classic Checkbox List UI (Fallback) */}
                        <div className="w-full max-w-2xl space-y-3 pb-24">
                            {shuffledOptions.map((opt) => {
                                const isSelected = selectedOptionIds.includes(opt.id);
                                const isCorrect = content.correct_option_ids.includes(opt.id);

                                let buttonClass = "w-full text-left p-3 sm:p-4 rounded-2xl border-2 transition-all text-sm sm:text-base font-medium flex items-center justify-between group ";

                                if (isAnswered) {
                                    if (isCorrect) buttonClass += "border-green-500 bg-green-900/40 text-green-300";
                                    else if (isSelected) buttonClass += "border-red-500 bg-red-900/40 text-red-300";
                                    else buttonClass += "border-slate-700 bg-slate-800/50 text-slate-500 opacity-60";
                                } else {
                                    buttonClass += isSelected
                                        ? "border-indigo-500 bg-indigo-900/60 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                                        : "border-slate-700 bg-slate-800 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-700";
                                }

                                return (
                                    <button
                                        key={`modal-${opt.id}`}
                                        disabled={isAnswered}
                                        onClick={() => onToggle(opt.id)}
                                        className={buttonClass}
                                    >
                                        <span className="min-w-0 flex-1 mr-4">{opt.text}</span>
                                        <div className={`h-6 w-6 sm:h-7 sm:w-7 rounded-lg border-2 transition-colors flex-shrink-0 flex items-center justify-center ${
                                            isAnswered && isCorrect ? 'border-green-500 bg-green-500' :
                                                isAnswered && isSelected && !isCorrect ? 'border-red-500 bg-red-500' :
                                                    !isAnswered && isSelected ? 'border-indigo-500 bg-indigo-500' :
                                                        'border-slate-600 bg-slate-700 group-hover:border-indigo-400'
                                        }`}>
                                            {(isSelected || (isAnswered && isCorrect)) && (
                                                <CheckSquareIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Check/Resume Button pinned to bottom */}
                        {!isAnswered && (
                            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center justify-center gap-3 pointer-events-none px-4">
                                <button
                                    onClick={onCheck}
                                    disabled={selectedOptionIds.length === 0}
                                    className="w-full max-w-sm pointer-events-auto py-3 bg-indigo-600 text-white font-black rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:bg-indigo-500 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 text-sm uppercase tracking-widest"
                                >
                                    Upload Answers
                                </button>
                                <button
                                    onClick={startGame}
                                    className="pointer-events-auto flex items-center gap-2 text-indigo-400 font-bold text-xs hover:text-indigo-300 uppercase tracking-widest"
                                >
                                    <Key size={14} /> Resume Driving
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Pro Mobile Controls (Hidden when game is over or modal is open) */}
            <div className="bg-slate-950 p-4 border-t-2 border-slate-800 select-none relative z-10">
                <div className={`flex justify-between items-center gap-4 lg:hidden transition-opacity ${isOverlayOpen || isAnswered ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>

                    {/* Steering */}
                    <div className="flex gap-2">
                        <button {...bindControl('Left')} className="w-14 h-14 bg-slate-800 active:bg-indigo-600 rounded-xl flex items-center justify-center text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all shadow-md">
                            <ChevronLeft size={32} strokeWidth={3} />
                        </button>
                        <button {...bindControl('Right')} className="w-14 h-14 bg-slate-800 active:bg-indigo-600 rounded-xl flex items-center justify-center text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all shadow-md">
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
                    <div className="bg-slate-800 border-l-8 border-indigo-500 p-4 sm:p-6 rounded-r-2xl shadow-xl flex items-start gap-4">
                        <div className="bg-indigo-500/20 p-2.5 rounded-full text-indigo-400 shrink-0">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-indigo-400 uppercase tracking-widest text-sm mb-2">
                                System Review
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

export default CheckboxItem;
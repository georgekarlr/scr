import React, { useState, useEffect, useRef } from 'react';
import { Flag, ShieldAlert, CheckCircle2, AlertTriangle, Key, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Map, ClipboardList, X } from 'lucide-react';
import { QuizQuestionContent, QuizQuestionOption } from '../../../types/study';

interface QuizItemProps {
    content: QuizQuestionContent;
    shuffledOptions: QuizQuestionOption[];
    selectedOptionId: number | null;
    isAnswered: boolean;
    onAnswer: (optionId: number, isCorrect: boolean) => void;
}

const LANE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const QuizItem: React.FC<QuizItemProps> = ({
                                               content,
                                               shuffledOptions,
                                               selectedOptionId,
                                               isAnswered,
                                               onAnswer
                                           }) => {
    const arenaRef = useRef<HTMLDivElement>(null);
    const carDOMRef = useRef<HTMLDivElement>(null);
    const brakeLightsRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isOverlayOpen, setIsOverlayOpen] = useState(true); // Start with overlay open
    const hasAnsweredRef = useRef(false);

    // Game state stored in refs for 60fps performance without React re-renders
    const carState = useRef({ x: 50, y: 85, angle: 0, speed: 0 });
    const keys = useRef({ Up: false, Down: false, Left: false, Right: false });

    const isPlayerCorrect = isAnswered && selectedOptionId === content.correct_option_id;
    const numLanes = shuffledOptions.length;
    const laneWidth = 100 / numLanes;

    // Auto-open overlay when answered to show results
    useEffect(() => {
        if (isAnswered) {
            setIsPlaying(false);
            setIsOverlayOpen(true);
        }
    }, [isAnswered]);

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
            // Pause loop if overlay is open or game is over
            if (hasAnsweredRef.current || isOverlayOpen || !isPlaying || isAnswered) {
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
            if (y > 92) { y = 92; speed *= -0.5; }

            // 6. Check Win/Answer Condition (Crossing the finish line)
            if (y <= 25) {
                hasAnsweredRef.current = true;
                setIsPlaying(false);
                const laneIndex = Math.min(numLanes - 1, Math.floor(x / laneWidth));
                const chosenOpt = shuffledOptions[laneIndex];
                const isCorrect = chosenOpt.id === content.correct_option_id;
                onAnswer(chosenOpt.id, isCorrect);
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

            if (brakeLightsRef.current) {
                brakeLightsRef.current.style.opacity = keys.current.Down ? '1' : '0.3';
            }

            frameId = requestAnimationFrame(gameLoop);
        };

        frameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(frameId);
    }, [isPlaying, isAnswered, isOverlayOpen, numLanes, laneWidth, shuffledOptions, content.correct_option_id, onAnswer]);

    // Keyboard Listeners
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

    const handleOptionClick = (optId: number, isCorrect: boolean) => {
        if (!isAnswered) {
            onAnswer(optId, isCorrect);
        }
    };

    return (
        <div className="w-full bg-slate-900 border-4 border-slate-700 rounded-3xl shadow-2xl overflow-hidden font-sans select-none flex flex-col relative">

            {/* Title Bar & HUD */}
            <div className="bg-slate-950 border-b-2 border-slate-800 p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-2 text-blue-400">
                    <Flag size={20} />
                    <span className="font-black uppercase tracking-widest text-sm">Trivia Racer</span>
                </div>

                {/* HUD Button to open overlay while playing */}
                {isPlaying && !isAnswered && (
                    <button
                        onClick={() => setIsOverlayOpen(true)}
                        className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    >
                        <ClipboardList size={16} /> View Route
                    </button>
                )}
            </div>

            {/* The Driving Arena */}
            <div
                ref={arenaRef}
                className="relative w-full h-[450px] sm:h-[600px] bg-slate-900"
            >
                {/* Road Texture */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiMzMzMiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjNDQ0Ii8+PC9zdmc+')] opacity-50 mix-blend-overlay"></div>

                {/* Finish Line (Lane Targets painted on the road) */}
                <div className="absolute top-0 left-0 w-full h-[25%] flex border-b-4 border-dashed border-white/40">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] opacity-40 z-0"></div>

                    {shuffledOptions.map((opt, index) => {
                        const isSelected = selectedOptionId === opt.id;
                        const isCorrect = opt.id === content.correct_option_id;

                        let laneStyle = "border-x-2 border-white/20 bg-slate-900/60";
                        let textStyle = "text-white/20";

                        if (isAnswered) {
                            if (isCorrect) {
                                laneStyle = "border-x-4 border-b-4 border-green-500 bg-green-900/60 shadow-[inset_0_0_50px_rgba(34,197,94,0.4)] z-10";
                                textStyle = "text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]";
                            } else if (isSelected) {
                                laneStyle = "border-x-4 border-b-4 border-red-500 bg-red-900/60 shadow-[inset_0_0_50px_rgba(239,68,68,0.4)] z-10";
                                textStyle = "text-red-400 opacity-80 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]";
                            } else {
                                laneStyle = "border-x-2 border-white/5 opacity-30 grayscale";
                            }
                        } else if (isPlaying) {
                            laneStyle = "border-x-2 border-yellow-500/20 border-dashed bg-slate-800/40";
                            textStyle = "text-white/50";
                        }

                        return (
                            <div
                                key={opt.id}
                                style={{ width: `${laneWidth}%` }}
                                className={`relative h-full flex items-center justify-center p-2 text-center transition-all duration-300 ${laneStyle}`}
                            >
                                <div className="absolute top-0 w-full h-2 bg-slate-950 shadow-inner"></div>
                                {/* Large Letter Painted on Road */}
                                <span className={`relative z-10 font-black text-5xl sm:text-7xl tracking-wide transition-colors ${textStyle}`}>
                  {LANE_LABELS[index]}
                </span>
                            </div>
                        );
                    })}
                </div>

                {/* The Player's Car Element */}
                <div
                    ref={carDOMRef}
                    className="absolute z-30 pointer-events-none drop-shadow-2xl origin-center"
                    style={{
                        left: '50%',
                        top: '85%',
                        transform: 'translate(-50%, -50%) rotate(0deg)',
                        // Auto-park animation when answered
                        ...(isAnswered && {
                            transition: 'all 1s cubic-bezier(0.25, 1, 0.5, 1)',
                            left: `${selectedOptionId ? (shuffledOptions.findIndex(o => o.id === selectedOptionId) * laneWidth) + (laneWidth / 2) : 50}%`,
                            top: isPlayerCorrect ? '12%' : '18%',
                            transform: `translate(-50%, -50%) ${isPlayerCorrect ? 'rotate(0deg)' : `rotate(${carState.current.angle + 720}deg) scale(0.9)`}`,
                        })
                    }}
                >
                    {/* Main Car Body container */}
                    <div className="relative w-8 h-14 sm:w-10 sm:h-16">

                        {/* Crash Smoke Effect */}
                        {isAnswered && !isPlayerCorrect && (
                            <div className="absolute inset-0 -m-8 bg-slate-500/40 rounded-full blur-xl animate-pulse delay-500 z-0"></div>
                        )}

                        {/* The Vehicle Design */}
                        <div className={`absolute inset-0 rounded-xl shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] border border-slate-900 z-10 transition-colors duration-500 ${isAnswered && !isPlayerCorrect ? 'bg-slate-700' : 'bg-yellow-400'}`}>

                            {/* Racing Stripe */}
                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-slate-900 opacity-50"></div>

                            {/* Cockpit / Roof */}
                            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[85%] h-[35%] bg-slate-900 rounded-md border-2 border-slate-800">
                                <div className="absolute inset-0 bg-white/10 rounded-sm"></div>
                            </div>

                            {/* Headlights */}
                            <div className={`absolute top-0 left-1 w-2.5 h-1.5 rounded-b-full bg-white ${isPlaying ? 'shadow-[0_-15px_25px_rgba(255,255,255,0.9)]' : 'opacity-60'}`}></div>
                            <div className={`absolute top-0 right-1 w-2.5 h-1.5 rounded-b-full bg-white ${isPlaying ? 'shadow-[0_-15px_25px_rgba(255,255,255,0.9)]' : 'opacity-60'}`}></div>

                            {/* Brake Lights Container */}
                            <div ref={brakeLightsRef} className="absolute bottom-0 w-full h-1.5 flex justify-between px-1 opacity-30 transition-opacity">
                                <div className="w-2.5 h-1.5 bg-red-500 rounded-t-full shadow-[0_5px_15px_rgba(239,68,68,1)]"></div>
                                <div className="w-2.5 h-1.5 bg-red-500 rounded-t-full shadow-[0_5px_15px_rgba(239,68,68,1)]"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =========================================
            IN-GAME OVERLAY MODAL (Question & GPS)
            ========================================= */}
                {isOverlayOpen && (
                    <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="w-full max-w-4xl flex justify-between items-start mb-6 border-b-2 border-slate-800 pb-4">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 text-blue-400 mb-2">
                                    <Map size={18} />
                                    <span className="font-bold uppercase tracking-widest text-xs">GPS Route Instructions</span>
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                                    {content.question}
                                </h2>
                            </div>

                            {/* Close Button / Resume Button */}
                            {!isAnswered && (
                                <button
                                    onClick={startGame}
                                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg transition-transform active:scale-90 flex-shrink-0"
                                >
                                    <X size={24} />
                                </button>
                            )}
                        </div>

                        {/* Win / Loss Banner inside Modal */}
                        {isAnswered && (
                            <div className={`w-full max-w-4xl mb-6 px-6 py-4 rounded-2xl border-4 font-black text-xl sm:text-2xl uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 ${
                                isPlayerCorrect ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-red-600/20 border-red-500 text-red-400'
                            }`}>
                                {isPlayerCorrect ? <><CheckCircle2 size={32} /> Perfect Park!</> : <><AlertTriangle size={32} /> Crash!</>}
                            </div>
                        )}

                        {/* Options List (Clickable inside the modal as a fallback!) */}
                        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-3 pb-20">
                            {shuffledOptions.map((opt, index) => {
                                const isSelected = selectedOptionId === opt.id;
                                const isCorrect = opt.id === content.correct_option_id;

                                let legendStyle = "bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500/50 cursor-pointer";
                                let letterStyle = "bg-slate-700 text-slate-400";

                                if (isAnswered) {
                                    if (isCorrect) {
                                        legendStyle = "bg-green-900/40 border-green-500 text-green-100 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
                                        letterStyle = "bg-green-500 text-white";
                                    } else if (isSelected) {
                                        legendStyle = "bg-red-900/40 border-red-500 text-red-200 opacity-80 line-through decoration-red-500/50";
                                        letterStyle = "bg-red-600 text-white";
                                    } else {
                                        legendStyle = "bg-slate-800/50 border-slate-700 text-slate-500 opacity-50";
                                        letterStyle = "bg-slate-700 text-slate-400";
                                    }
                                }

                                return (
                                    <button
                                        key={opt.id}
                                        disabled={isAnswered}
                                        onClick={() => handleOptionClick(opt.id, isCorrect)}
                                        className={`flex items-stretch gap-3 p-3 rounded-xl border-2 transition-all duration-300 text-left ${legendStyle}`}
                                    >
                                        <div className={`flex items-center justify-center w-10 sm:w-12 rounded-lg font-black text-lg shrink-0 transition-colors duration-300 ${letterStyle}`}>
                                            {LANE_LABELS[index]}
                                        </div>
                                        <div className="flex items-center text-sm sm:text-base font-medium leading-snug py-1">
                                            {opt.text}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Start / Resume Button pinned to bottom of modal */}
                        {!isAnswered && (
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                                <button
                                    onClick={startGame}
                                    className="pointer-events-auto bg-blue-600 text-white font-black px-8 py-4 rounded-full shadow-[0_0_40px_rgba(37,99,235,0.6)] hover:scale-105 active:scale-95 transition-transform flex items-center gap-3 border-2 border-blue-400 uppercase tracking-widest"
                                >
                                    <Key size={20} /> {isPlaying ? 'Resume Driving' : 'Start Engine'}
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
                        <button {...bindControl('Left')} className="w-16 h-16 bg-slate-800 active:bg-blue-600 rounded-2xl flex items-center justify-center text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all shadow-md">
                            <ChevronLeft size={36} strokeWidth={3} />
                        </button>
                        <button {...bindControl('Right')} className="w-16 h-16 bg-slate-800 active:bg-blue-600 rounded-2xl flex items-center justify-center text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all shadow-md">
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
            </div>

            {/* Post-Game Explanations */}
            {isAnswered && content.explanation && (
                <div className="bg-slate-900 p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-500 relative z-10">
                    <div className="bg-slate-800 border-l-8 border-blue-500 p-4 sm:p-6 rounded-r-2xl shadow-xl flex items-start gap-4">
                        <div className="bg-blue-500/20 p-2.5 rounded-full text-blue-400 shrink-0">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-blue-400 uppercase tracking-widest text-sm mb-2">
                                Instructor's Review
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

export default QuizItem;
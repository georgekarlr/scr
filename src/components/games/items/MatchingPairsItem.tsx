import React, { useState, useEffect, useRef } from 'react';
import { GitMerge, Key, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ShieldAlert, ClipboardList, X } from 'lucide-react';
import { MatchingPairsContent } from '../../../types/study';

interface MatchingPairsItemProps {
    content: MatchingPairsContent;
    shuffledLeft: string[];
    shuffledRight: string[];
    matchingMatches: Record<string, string>;
    matchingSelected: { side: 'left' | 'right', text: string } | null;
    isAnswered: boolean;
    onSelect: (side: 'left' | 'right', text: string) => void;
    onReset: () => void;
    onCheck: () => void;
}

const MatchingPairsItem: React.FC<MatchingPairsItemProps> = ({
                                                                 content,
                                                                 shuffledLeft,
                                                                 shuffledRight,
                                                                 matchingMatches,
                                                                 matchingSelected,
                                                                 isAnswered,
                                                                 onSelect,
                                                                 onReset,
                                                                 onCheck
                                                             }) => {
    const arenaRef = useRef<HTMLDivElement>(null);
    const carDOMRef = useRef<HTMLDivElement>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isOverlayOpen, setIsOverlayOpen] = useState(true); // Start with the overlay open to read the question

    // High-performance state stored in refs (bypasses React renders for 60fps)
    const carState = useRef({ x: 50, y: 50, angle: 0, speed: 0 });
    const keys = useRef({ Up: false, Down: false, Left: false, Right: false });
    const hitCooldown = useRef(0);

    // Sync React state to a ref so the game loop can read the latest selections
    const gameState = useRef({ selected: matchingSelected, matches: matchingMatches });
    useEffect(() => {
        gameState.current = { selected: matchingSelected, matches: matchingMatches };
    }, [matchingSelected, matchingMatches]);

    const leftOptions = shuffledLeft.length > 0 ? shuffledLeft : content.pairs.map(p => p.left);
    const rightOptions = shuffledRight.length > 0 ? shuffledRight : content.pairs.map(p => p.right);

    // Auto-open overlay to show results when answered
    useEffect(() => {
        if (isAnswered) {
            setIsPlaying(false);
            setIsOverlayOpen(true);
        }
    }, [isAnswered]);

    // --- Physics & Driving Engine ---
    useEffect(() => {
        let frameId: number;
        const MAX_SPEED = 0.6;
        const MAX_REVERSE = 0.3;
        const ACCEL = 0.02;
        const FRICTION = 0.015;
        const TURN_SPEED = 3.5;

        // Calculate Y positions for boxes so the car can collide with them
        const getBoxY = (index: number, total: number) => ((index + 1) * 100) / (total + 1);

        const gameLoop = () => {
            // Pause loop if overlay is open or game is over
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

            // 5. Box Collisions (Picking up items)
            if (hitCooldown.current > 0) {
                hitCooldown.current--;
            } else {
                const checkCollision = (side: 'left'|'right', text: string, boxX: number, boxY: number) => {
                    if (Math.abs(x - boxX) < 15 && Math.abs(y - boxY) < 8) {
                        const isMatched = side === 'left'
                            ? !!gameState.current.matches[text]
                            : !!Object.values(gameState.current.matches).includes(text);

                        if (!isMatched) {
                            onSelect(side, text);
                            hitCooldown.current = 60; // 1 second cooldown
                            speed *= -1.5; // Bounce back visually
                            x += Math.cos(rad) * speed * 2;
                            y += Math.sin(rad) * speed * 2;
                        }
                    }
                };

                leftOptions.forEach((text, i) => checkCollision('left', text, 20, getBoxY(i, leftOptions.length)));
                rightOptions.forEach((text, i) => checkCollision('right', text, 80, getBoxY(i, rightOptions.length)));
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
    }, [isPlaying, isAnswered, isOverlayOpen, leftOptions, rightOptions, onSelect]);

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

    const getMatchedColor = (text: string, side: 'left'|'right') => {
        const matchedLeft = side === 'left' ? text : Object.keys(matchingMatches).find(k => matchingMatches[k] === text);
        if (!matchedLeft) return null;
        const index = leftOptions.indexOf(matchedLeft);
        const colors = ['bg-pink-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500'];
        return colors[index % colors.length];
    };

    const startGame = () => {
        setIsPlaying(true);
        setIsOverlayOpen(false);
    };

    return (
        <div className="w-full bg-slate-900 border-4 border-slate-700 rounded-3xl shadow-2xl overflow-hidden font-sans select-none flex flex-col relative">

            {/* Title Bar */}
            <div className="bg-slate-950 border-b-2 border-slate-800 p-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-2 text-purple-400">
                    <GitMerge size={20} />
                    <span className="font-black uppercase tracking-widest text-sm">Rover Expedition</span>
                </div>
                {/* HUD Button to open overlay */}
                {isPlaying && !isAnswered && (
                    <button
                        onClick={() => setIsOverlayOpen(true)}
                        className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    >
                        <ClipboardList size={16} /> View Tasks
                    </button>
                )}
            </div>

            {/* The Driving Arena */}
            <div
                ref={arenaRef}
                className="relative w-full h-[600px] sm:h-[750px] bg-slate-900"
            >
                {/* Visible Floor Grid */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0yMCAyMGgtdjIwSDB6IiBmaWxsPSIjMWUyOTNiIiBmaWxsLW9wYWNpdHk9IjAuNSIgZmlsbC1ydWxlPSJldmVub2RkIi8+PC9zdmc+')] opacity-50"></div>

                {/* Interactive Boxes (Terms/Definitions rendered on the floor) */}
                {leftOptions.map((text, i) => {
                    const yPos = ((i + 1) * 100) / (leftOptions.length + 1);
                    const isSelected = matchingSelected?.side === 'left' && matchingSelected.text === text;
                    const isMatched = !!matchingMatches[text];
                    return (
                        <div
                            key={`box-l-${i}`}
                            onClick={() => onSelect('left', text)} // Fallback tap
                            className={`absolute w-[30%] sm:w-[25%] p-3 rounded-xl border-2 shadow-lg flex items-center justify-center text-center cursor-pointer transition-all duration-300 z-10 
                ${isSelected ? 'border-purple-400 bg-purple-900 text-white scale-110 shadow-[0_0_20px_rgba(168,85,247,0.6)]'
                                : isMatched ? 'border-slate-700 bg-slate-800/80 text-slate-500 opacity-50'
                                    : 'border-slate-600 bg-slate-800 text-slate-200 shadow-xl'}`}
                            style={{ left: '20%', top: `${yPos}%`, transform: 'translate(-50%, -50%)' }}
                        >
                            <span className="text-xs sm:text-sm font-bold pointer-events-none line-clamp-3">{text}</span>
                        </div>
                    );
                })}

                {rightOptions.map((text, i) => {
                    const yPos = ((i + 1) * 100) / (rightOptions.length + 1);
                    const isSelected = matchingSelected?.side === 'right' && matchingSelected.text === text;
                    const isMatched = !!Object.values(matchingMatches).includes(text);
                    return (
                        <div
                            key={`box-r-${i}`}
                            onClick={() => onSelect('right', text)} // Fallback tap
                            className={`absolute w-[30%] sm:w-[25%] p-3 rounded-xl border-2 shadow-lg flex items-center justify-center text-center cursor-pointer transition-all duration-300 z-10 
                ${isSelected ? 'border-purple-400 bg-purple-900 text-white scale-110 shadow-[0_0_20px_rgba(168,85,247,0.6)]'
                                : isMatched ? 'border-slate-700 bg-slate-800/80 text-slate-500 opacity-50'
                                    : 'border-slate-600 bg-slate-800 text-slate-200 shadow-xl'}`}
                            style={{ left: '80%', top: `${yPos}%`, transform: 'translate(-50%, -50%)' }}
                        >
                            <span className="text-xs sm:text-sm font-bold pointer-events-none line-clamp-3">{text}</span>
                        </div>
                    );
                })}

                {/* The Player's Explorer Rover */}
                <div
                    ref={carDOMRef}
                    className={`absolute z-30 pointer-events-none transition-opacity duration-500 ${isAnswered ? 'opacity-0' : 'opacity-100'}`}
                    style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%) rotate(0deg)' }}
                >
                    <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                        {/* Rover Body */}
                        <div className={`absolute inset-0 rounded-md border-2 border-slate-900 z-10 flex items-center justify-center transition-colors shadow-lg
              ${matchingSelected ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]' : 'bg-amber-400'}`}>

                            {/* Cargo Indicator */}
                            {matchingSelected && (
                                <div className="absolute -top-6 w-max px-2 py-0.5 bg-purple-900 border border-purple-400 text-purple-200 text-[10px] font-black rounded uppercase tracking-widest shadow-[0_0_10px_rgba(168,85,247,0.8)]">
                                    Cargo Secured
                                </div>
                            )}
                        </div>
                        {/* Headlights (Now just visual details, no dark mask required) */}
                        <div className="absolute -top-1 left-1 w-2 h-2 rounded-full bg-yellow-100 shadow-[0_-5px_10px_rgba(253,224,71,0.5)] z-20"></div>
                        <div className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-yellow-100 shadow-[0_-5px_10px_rgba(253,224,71,0.5)] z-20"></div>
                    </div>
                </div>

                {/* =========================================
            IN-GAME OVERLAY MODAL (Questions & Tasks)
            ========================================= */}
                {isOverlayOpen && (
                    <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-start p-4 sm:p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="w-full max-w-4xl flex justify-between items-start mb-6 border-b-2 border-slate-800 pb-4">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 text-purple-400 mb-2">
                                    <ClipboardList size={18} />
                                    <span className="font-bold uppercase tracking-widest text-xs">Mission Briefing</span>
                                </div>
                                {content.question && (
                                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                                        {content.question}
                                    </h2>
                                )}
                            </div>

                            {/* Close Button / Resume Button */}
                            {!isAnswered && (
                                <button
                                    onClick={startGame}
                                    className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-full shadow-lg transition-transform active:scale-90 flex-shrink-0"
                                >
                                    <X size={24} />
                                </button>
                            )}
                        </div>

                        {/* List of Pairs (Clickable inside the modal as a fallback!) */}
                        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pb-20">

                            {/* Left Column (Terms) */}
                            <div className="space-y-2">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Terms</p>
                                {leftOptions.map((text) => {
                                    const isSelected = matchingSelected?.side === 'left' && matchingSelected.text === text;
                                    const isMatched = !!matchingMatches[text];
                                    const isCorrect = isAnswered && matchingMatches[text] === content.pairs.find(p => p.left === text)?.right;
                                    const matchColor = getMatchedColor(text, 'left');

                                    return (
                                        <button
                                            key={`modal-l-${text}`}
                                            onClick={() => onSelect('left', text)}
                                            disabled={isAnswered || isMatched}
                                            className={`w-full p-3.5 rounded-xl border-2 transition-all text-sm font-medium text-left flex justify-between items-center ${
                                                isAnswered ? (isCorrect ? 'border-green-500 bg-green-900/40 text-green-300' : 'border-red-500 bg-red-900/40 text-red-300')
                                                    : isSelected ? 'border-purple-400 bg-purple-900/60 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                                        : isMatched ? 'border-slate-800 bg-slate-900/50 text-slate-600'
                                                            : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-purple-500/50'
                                            }`}
                                        >
                                            <span>{text}</span>
                                            {isMatched && <div className={`w-3 h-3 rounded-full ${matchColor}`}></div>}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Right Column (Definitions) */}
                            <div className="space-y-2">
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Definitions</p>
                                {rightOptions.map((text) => {
                                    const isSelected = matchingSelected?.side === 'right' && matchingSelected.text === text;
                                    const isMatched = !!Object.values(matchingMatches).includes(text);
                                    const matchedLeft = Object.keys(matchingMatches).find(key => matchingMatches[key] === text);
                                    const isCorrect = isAnswered && matchedLeft && content.pairs.find(p => p.left === matchedLeft)?.right === text;
                                    const matchColor = getMatchedColor(text, 'right');

                                    return (
                                        <button
                                            key={`modal-r-${text}`}
                                            onClick={() => onSelect('right', text)}
                                            disabled={isAnswered || isMatched}
                                            className={`w-full p-3.5 rounded-xl border-2 transition-all text-sm font-medium text-left flex gap-3 items-center ${
                                                isAnswered ? (isCorrect ? 'border-green-500 bg-green-900/40 text-green-300' : 'border-red-500 bg-red-900/40 text-red-300')
                                                    : isSelected ? 'border-purple-400 bg-purple-900/60 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                                                        : isMatched ? 'border-slate-800 bg-slate-900/50 text-slate-600'
                                                            : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-purple-500/50'
                                            }`}
                                        >
                                            {isMatched && <div className={`w-3 h-3 rounded-full shrink-0 ${matchColor}`}></div>}
                                            <span>{text}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Resume Button pinned to bottom of modal */}
                        {!isAnswered && (
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                                <button
                                    onClick={startGame}
                                    className="pointer-events-auto bg-purple-600 text-white font-black px-8 py-4 rounded-full shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:scale-105 active:scale-95 transition-transform flex items-center gap-3 border-2 border-purple-400 uppercase tracking-widest"
                                >
                                    <Key size={10} /> {isPlaying ? 'Resume Driving' : 'Start Expedition'}
                                </button>
                            </div>
                        )}

                    </div>
                )}
            </div>

            {/* Pro Mobile Controls & Action Buttons */}
            <div className="bg-slate-950 p-4 border-t-2 border-slate-800 select-none relative z-10">

                {/* Driving Controls (Hidden if game is over or modal is open) */}
                {!isAnswered && (
                    <div className={`flex justify-between items-center gap-4 lg:hidden mb-4 transition-opacity ${isOverlayOpen ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                        <div className="flex gap-2">
                            <button {...bindControl('Left')} className="w-14 h-14 bg-slate-800 active:bg-purple-600 rounded-xl flex items-center justify-center text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all">
                                <ChevronLeft size={32} />
                            </button>
                            <button {...bindControl('Right')} className="w-14 h-14 bg-slate-800 active:bg-purple-600 rounded-xl flex items-center justify-center text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all">
                                <ChevronRight size={32} />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            <button {...bindControl('Down')} className="w-14 h-14 bg-slate-800 active:bg-red-600 rounded-xl flex items-center justify-center text-red-400 active:text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all">
                                <ArrowDown size={28} />
                            </button>
                            <button {...bindControl('Up')} className="w-14 h-14 bg-slate-800 active:bg-green-500 rounded-xl flex items-center justify-center text-green-400 active:text-white border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 transition-all">
                                <ArrowUp size={32} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Submission Buttons */}
                {!isAnswered && (
                    <div className="flex space-x-3 w-full max-w-lg mx-auto">
                        <button
                            onClick={onReset}
                            className="flex-1 py-3 sm:py-4 border-2 border-slate-700 text-slate-300 font-black tracking-widest uppercase rounded-2xl hover:bg-slate-800 active:scale-95 transition-all text-xs sm:text-sm"
                        >
                            Reset Cargo
                        </button>
                        <button
                            onClick={onCheck}
                            disabled={Object.keys(matchingMatches).length < content.pairs.length}
                            className="flex-[2] py-3 sm:py-4 bg-purple-600 text-white font-black tracking-widest uppercase rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:bg-purple-500 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 text-xs sm:text-sm"
                        >
                            Submit Pairs
                        </button>
                    </div>
                )}
            </div>

            {/* Post-Game Explanations */}
            {isAnswered && content.explanation && (
                <div className="bg-slate-900 p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-500 relative z-10">
                    <div className="bg-slate-800 border-l-8 border-purple-500 p-4 sm:p-6 rounded-r-2xl shadow-xl flex items-start gap-4">
                        <div className="bg-purple-500/20 p-2.5 rounded-full text-purple-400 shrink-0">
                            <ShieldAlert size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-purple-400 uppercase tracking-widest text-sm mb-2">
                                Expedition Review
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

export default MatchingPairsItem;
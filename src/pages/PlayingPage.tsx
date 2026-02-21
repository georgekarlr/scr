import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import RushBreakGame from '../components/games/RushBreakGame';
import TimeBattleGame from '../components/games/TimeBattleGame';
import SpeedMarchGame from '../components/games/SpeedMarchGame';
import CarParkGame from '../components/games/CarParkGame';

const PlayingPage: React.FC = () => {
    const { id: setId, gameId } = useParams<{ id: string; gameId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const selectedItemIds = location.state?.selectedItemIds as string[] | undefined;

    return (
        <div className="flex flex-col items-center py-12 min-h-screen bg-gray-900 text-white relative overflow-x-hidden overflow-y-auto">
            <button
                onClick={() => navigate(-1)}
                className="absolute top-6 right-6 p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors group z-50"
                aria-label="Back"
            >
                <X className="h-6 w-6 text-gray-400 group-hover:text-white" />
            </button>
            
            {gameId === 'rush-break' && setId ? (
                <RushBreakGame setId={setId} selectedItemIds={selectedItemIds} />
            ) : gameId === 'time-battle' && setId ? (
                <TimeBattleGame setId={setId} selectedItemIds={selectedItemIds} />
            ) : gameId === 'speed-march' && setId ? (
                <SpeedMarchGame setId={setId} selectedItemIds={selectedItemIds} />
            ) : gameId === 'car-park' && setId ? (
                <CarParkGame setId={setId} selectedItemIds={selectedItemIds} />
            ) : (
                <div className="text-center p-4">
                    <h1 className="text-3xl font-black mb-2">Playing Page</h1>
                    <p className="text-gray-400">Game mode "{gameId}" not implemented yet.</p>
                    <p className="text-gray-500 text-sm mt-2">Study Set ID: {setId}</p>
                </div>
            )}
        </div>
    );
};

export default PlayingPage;

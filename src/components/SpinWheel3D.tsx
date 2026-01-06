import { useState } from 'react';
import { Coins, Gift, Sparkles, Crown } from 'lucide-react';

interface SpinWheel3DProps {
  onSpin: () => Promise<{ success: boolean; reward: number; streak?: number }>;
  canSpin: boolean;
  currentStreak: number;
}

const SPIN_REWARDS = [5, 6, 10, 13, 19, 21, 30];
const WHEEL_COLORS = [
  'from-amber-500 to-yellow-400',
  'from-purple-600 to-purple-400',
  'from-amber-500 to-yellow-400',
  'from-purple-600 to-purple-400',
  'from-amber-500 to-yellow-400',
  'from-purple-600 to-purple-400',
  'from-amber-600 to-yellow-500',
];

export default function SpinWheel3D({ onSpin, canSpin, currentStreak }: SpinWheel3DProps) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ reward: number; streak: number } | null>(null);
  const [rotation, setRotation] = useState(0);

  const handleSpin = async () => {
    if (!canSpin || spinning) return;
    
    setSpinning(true);
    setResult(null);
    
    const newRotation = rotation + 1800 + Math.random() * 720;
    setRotation(newRotation);
    
    const spinResult = await onSpin();
    
    setTimeout(() => {
      setSpinning(false);
      if (spinResult.success) {
        setResult({ reward: spinResult.reward, streak: spinResult.streak || 1 });
      }
    }, 4000);
  };

  return (
    <div className="relative">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 via-transparent to-transparent rounded-3xl blur-3xl" />
      
      <div className="relative bg-gradient-to-b from-zinc-900 to-black rounded-3xl p-6 border border-amber-500/30 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl shadow-lg shadow-amber-500/30">
              <Gift className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Roleta Diária</h3>
              <p className="text-amber-400/80 text-sm">Gire e ganhe moedas!</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-semibold">Dia {currentStreak}</span>
          </div>
        </div>

        {/* 3D Wheel Container */}
        <div className="relative w-72 h-72 mx-auto mb-8" style={{ perspective: '1000px' }}>
          {/* Outer ring glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 blur-md opacity-50 animate-pulse" />
          
          {/* Wheel base shadow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-56 h-8 bg-black/50 rounded-full blur-xl" />
          
          {/* Main wheel */}
          <div 
            className="absolute inset-2 rounded-full transition-transform duration-[4000ms] ease-out"
            style={{ 
              transform: `rotateZ(${rotation}deg)`,
              transformStyle: 'preserve-3d',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 0 30px rgba(251,191,36,0.2)'
            }}
          >
            {/* Wheel segments */}
            <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-amber-400/50">
              {SPIN_REWARDS.map((reward, index) => {
                const angle = (index * 360) / 7;
                return (
                  <div
                    key={index}
                    className={`absolute inset-0 bg-gradient-to-br ${WHEEL_COLORS[index]}`}
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle - 25.7) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle - 25.7) * Math.PI / 180)}%, ${50 + 50 * Math.cos((angle + 25.7) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle + 25.7) * Math.PI / 180)}%)`,
                    }}
                  >
                    <div 
                      className="absolute flex items-center justify-center"
                      style={{
                        left: `${50 + 32 * Math.cos(angle * Math.PI / 180)}%`,
                        top: `${50 + 32 * Math.sin(angle * Math.PI / 180)}%`,
                        transform: `translate(-50%, -50%) rotate(${angle + 90}deg)`,
                      }}
                    >
                      <div className="flex flex-col items-center">
                        <Coins className="w-4 h-4 text-black/80 mb-0.5" />
                        <span className="text-sm font-bold text-black drop-shadow-sm">{reward}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Inner decorative ring */}
            <div className="absolute inset-8 rounded-full border-2 border-amber-300/30" />
            <div className="absolute inset-12 rounded-full border border-amber-300/20" />
          </div>
          
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
            <div className="relative">
              <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[28px] border-l-transparent border-r-transparent border-t-amber-400 drop-shadow-lg" />
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-amber-300 rounded-full" />
            </div>
          </div>
          
          {/* Center button */}
          <button
            onClick={handleSpin}
            disabled={!canSpin || spinning}
            className={`absolute inset-0 m-auto w-24 h-24 rounded-full z-30 transition-all duration-300 ${
              canSpin && !spinning 
                ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 hover:scale-105 cursor-pointer shadow-lg shadow-amber-500/50' 
                : 'bg-gradient-to-br from-zinc-600 to-zinc-700 cursor-not-allowed'
            }`}
            style={{
              boxShadow: canSpin && !spinning 
                ? '0 10px 40px rgba(251,191,36,0.4), inset 0 2px 10px rgba(255,255,255,0.3)' 
                : 'none'
            }}
          >
            <div className="flex flex-col items-center justify-center">
              {spinning ? (
                <div className="animate-spin">
                  <Sparkles className="w-8 h-8 text-zinc-300" />
                </div>
              ) : (
                <>
                  <Crown className="w-6 h-6 text-black/80 mb-1" />
                  <span className="text-black font-bold text-sm">
                    {canSpin ? 'GIRAR' : 'AMANHÃ'}
                  </span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Result display */}
        {result && (
          <div className="text-center p-4 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 rounded-xl border border-amber-500/30 animate-scale-in mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-8 h-8 text-amber-400" />
              <span className="text-3xl font-bold text-amber-400">+{result.reward}</span>
            </div>
            <p className="text-zinc-400 text-sm">Dia {result.streak} de sequência</p>
          </div>
        )}

        {/* Daily check-in */}
        <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
          <p className="text-amber-400 font-semibold mb-4 text-center">Check-in daily</p>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {SPIN_REWARDS.slice(0, 4).map((reward, index) => (
              <div 
                key={index}
                className={`relative p-3 rounded-xl text-center transition-all ${
                  index < currentStreak 
                    ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/50' 
                    : 'bg-zinc-800 border border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Coins className={`w-4 h-4 ${index < currentStreak ? 'text-amber-400' : 'text-zinc-500'}`} />
                  <span className={`font-bold ${index < currentStreak ? 'text-amber-400' : 'text-zinc-500'}`}>
                    +{reward}
                  </span>
                </div>
                <span className={`text-xs ${index < currentStreak ? 'text-amber-400/80' : 'text-zinc-500'}`}>
                  {index === 0 ? 'Alegar' : `Dia${index + 1}`}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SPIN_REWARDS.slice(4).map((reward, index) => (
              <div 
                key={index + 4}
                className={`relative p-3 rounded-xl text-center transition-all ${
                  index + 4 < currentStreak 
                    ? 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10 border border-amber-500/50' 
                    : index + 4 === 6 
                      ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/50'
                      : 'bg-zinc-800 border border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  {index + 4 === 6 ? (
                    <Crown className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Coins className={`w-4 h-4 ${index + 4 < currentStreak ? 'text-amber-400' : 'text-zinc-500'}`} />
                  )}
                  <span className={`font-bold ${
                    index + 4 === 6 
                      ? 'text-purple-400' 
                      : index + 4 < currentStreak 
                        ? 'text-amber-400' 
                        : 'text-zinc-500'
                  }`}>
                    {index + 4 === 6 ? '+1day' : `+${reward}`}
                  </span>
                </div>
                <span className={`text-xs ${
                  index + 4 === 6 
                    ? 'text-purple-400/80' 
                    : index + 4 < currentStreak 
                      ? 'text-amber-400/80' 
                      : 'text-zinc-500'
                }`}>
                  Dia{index + 5}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

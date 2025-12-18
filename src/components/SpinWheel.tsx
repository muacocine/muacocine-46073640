import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Coins, Gift } from 'lucide-react';

interface SpinWheelProps {
  onSpin: () => Promise<{ success: boolean; reward: number; streak?: number }>;
  canSpin: boolean;
  currentStreak: number;
}

const SPIN_REWARDS = [5, 6, 10, 13, 19, 21, 30];

export default function SpinWheel({ onSpin, canSpin, currentStreak }: SpinWheelProps) {
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ reward: number; streak: number } | null>(null);
  const [rotation, setRotation] = useState(0);

  const handleSpin = async () => {
    if (!canSpin || spinning) return;
    
    setSpinning(true);
    setResult(null);
    
    // Animate wheel
    const newRotation = rotation + 1440 + Math.random() * 360;
    setRotation(newRotation);
    
    const spinResult = await onSpin();
    
    setTimeout(() => {
      setSpinning(false);
      if (spinResult.success) {
        setResult({ reward: spinResult.reward, streak: spinResult.streak || 1 });
      }
    }, 3000);
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h3 className="text-xl font-display text-foreground mb-4 flex items-center gap-2">
        <Gift className="w-5 h-5 text-primary" />
        Roleta Diária
      </h3>

      <div className="relative w-64 h-64 mx-auto mb-6">
        {/* Wheel */}
        <div 
          className="absolute inset-0 rounded-full border-4 border-primary overflow-hidden transition-transform duration-[3000ms] ease-out"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {SPIN_REWARDS.map((reward, index) => {
            const angle = (index * 360) / 7;
            const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-primary/80', 'bg-secondary/80', 'bg-accent/80', 'bg-primary/60'];
            return (
              <div
                key={index}
                className={`absolute inset-0 ${colors[index]} origin-center`}
                style={{
                  clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((angle - 25.7) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle - 25.7) * Math.PI / 180)}%, ${50 + 50 * Math.cos((angle + 25.7) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle + 25.7) * Math.PI / 180)}%)`,
                }}
              >
                <span 
                  className="absolute text-xs font-bold text-white"
                  style={{
                    left: `${50 + 30 * Math.cos(angle * Math.PI / 180)}%`,
                    top: `${50 + 30 * Math.sin(angle * Math.PI / 180)}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {reward}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-8 border-r-8 border-t-16 border-l-transparent border-r-transparent border-t-primary z-10" />
        
        {/* Center button */}
        <button
          onClick={handleSpin}
          disabled={!canSpin || spinning}
          className={`absolute inset-0 m-auto w-20 h-20 rounded-full ${
            canSpin && !spinning 
              ? 'bg-primary hover:bg-primary/90 cursor-pointer' 
              : 'bg-muted cursor-not-allowed'
          } flex items-center justify-center transition-colors z-20`}
        >
          <span className="text-primary-foreground font-bold text-sm">
            {spinning ? '...' : canSpin ? 'GIRAR' : 'AMANHÃ'}
          </span>
        </button>
      </div>

      {result && (
        <div className="text-center p-4 bg-primary/20 rounded-lg animate-fade-in">
          <p className="text-2xl font-bold text-primary">+{result.reward} moedas!</p>
          <p className="text-sm text-muted-foreground">Dia {result.streak} de sequência</p>
        </div>
      )}

      {/* Streak info */}
      <div className="mt-4">
        <p className="text-sm text-muted-foreground mb-2">Recompensas por dia de sequência:</p>
        <div className="flex flex-wrap gap-2">
          {SPIN_REWARDS.map((reward, index) => (
            <div 
              key={index}
              className={`px-3 py-1 rounded-full text-xs ${
                index < currentStreak 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              D{index + 1}: {reward}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

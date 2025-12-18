import { Coins } from 'lucide-react';
import { useCoins } from '@/hooks/useCoins';
import { Link } from 'react-router-dom';

export default function CoinDisplay() {
  const { coins, loading } = useCoins();

  if (loading) {
    return (
      <div className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 rounded-full">
        <Coins className="w-4 h-4 text-primary animate-pulse" />
        <span className="text-sm font-bold text-primary">...</span>
      </div>
    );
  }

  return (
    <Link 
      to="/profile"
      className="flex items-center gap-1 px-3 py-1.5 bg-primary/20 rounded-full hover:bg-primary/30 transition-colors"
    >
      <Coins className="w-4 h-4 text-primary" />
      <span className="text-sm font-bold text-primary">{coins}</span>
    </Link>
  );
}

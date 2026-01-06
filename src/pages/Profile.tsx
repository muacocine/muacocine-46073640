import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCoins } from '@/hooks/useCoins';
import Navbar from '@/components/Navbar';
import SpinWheel from '@/components/SpinWheel';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  User, 
  Coins, 
  History, 
  Gift, 
  Instagram, 
  Play,
  ArrowRight,
  Trophy,
  Crown,
  Download,
  Sparkles,
  Shield,
  Zap,
  ChevronRight
} from 'lucide-react';

interface WatchHistoryItem {
  id: string;
  media_id: string;
  media_type: string;
  media_title: string;
  media_poster: string | null;
  watched_at: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  created_at: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    coins, 
    userCoins, 
    canSpinToday, 
    spin, 
    claimBonus, 
    followInstagram,
    loading: coinsLoading 
  } = useCoins();
  
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<{ username: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'rewards' | 'history'>('rewards');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchData();
    }
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setProfile(profileData);

      const { data: historyData } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false })
        .limit(20);

      setWatchHistory(historyData || []);

      const { data: transactionsData } = await supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Premium Banner */}
          <div className="relative mb-6 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600" />
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
            <div className="relative p-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-black">Teste grátis</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Crown className="w-4 h-4 text-black/80" />
                  <span className="text-sm text-black/80">1 dias restantes</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-3 bg-black/20 rounded-xl">
                  <Crown className="w-8 h-8 text-black" />
                </div>
                <div className="flex items-center gap-1 bg-black/20 px-3 py-1 rounded-full">
                  <Coins className="w-4 h-4 text-black" />
                  <span className="font-bold text-black">{coins}</span>
                  <ChevronRight className="w-4 h-4 text-black" />
                </div>
              </div>
            </div>
          </div>

          {/* Premium Benefits */}
          <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 mb-6 border border-amber-500/20">
            <h3 className="text-lg font-bold text-amber-400 text-center mb-6">
              Amplie seus benefícios premium
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl flex items-center justify-center mb-2 border border-amber-500/30">
                  <Shield className="w-7 h-7 text-amber-400" />
                </div>
                <p className="text-xs text-zinc-400">Sem anúncios,</p>
                <p className="text-xs text-zinc-400">apenas aproveite</p>
              </div>
              <div className="relative text-center">
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-amber-500/50 text-lg">+</div>
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl flex items-center justify-center mb-2 border border-amber-500/30">
                  <Zap className="w-7 h-7 text-amber-400" />
                </div>
                <p className="text-xs text-zinc-400">Desfrute de</p>
                <p className="text-xs text-zinc-400">vídeos com</p>
                <p className="text-xs text-zinc-400">qualidade 720p</p>
              </div>
              <div className="relative text-center">
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-amber-500/50 text-lg">+</div>
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-xl flex items-center justify-center mb-2 border border-amber-500/30">
                  <Download className="w-7 h-7 text-amber-400" />
                </div>
                <p className="text-xs text-zinc-400">Vários</p>
                <p className="text-xs text-zinc-400">downloads de</p>
                <p className="text-xs text-zinc-400">uma só vez</p>
              </div>
            </div>

            {/* Redemption options */}
            <div className="grid grid-cols-3 gap-3">
              <button className="bg-zinc-800 hover:bg-zinc-700 rounded-xl p-4 transition-colors border border-zinc-700">
                <p className="text-zinc-400 text-sm mb-1">1 day</p>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span className="text-xl font-bold text-white">5</span>
                </div>
                <span className="text-amber-400 text-sm">Resgatar</span>
              </button>
              <button className="bg-zinc-800 hover:bg-zinc-700 rounded-xl p-4 transition-colors border border-zinc-700">
                <p className="text-zinc-400 text-sm mb-1">7 day</p>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span className="text-xl font-bold text-white">15</span>
                </div>
                <span className="text-amber-400 text-sm">Resgatar</span>
              </button>
              <button className="bg-zinc-800 hover:bg-zinc-700 rounded-xl p-4 transition-colors border border-zinc-700">
                <p className="text-zinc-400 text-sm mb-1">30 day</p>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span className="text-xl font-bold text-white">45</span>
                </div>
                <span className="text-amber-400 text-sm">Resgatar</span>
              </button>
            </div>
          </div>

          {/* Tasks banner */}
          <div className="relative mb-6 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-700/50 via-amber-600/30 to-amber-700/50" />
            <div className="relative p-4 text-center">
              <p className="text-amber-400 font-semibold text-lg">
                Conclua tarefas para ganhar pontos
              </p>
            </div>
          </div>

          {/* Spin Wheel */}
          <SpinWheel 
            onSpin={spin}
            canSpin={canSpinToday}
            currentStreak={userCoins?.spin_streak || 0}
          />

          {/* Earn coins section */}
          <div className="bg-zinc-900 rounded-2xl p-6 mt-6 border border-zinc-800">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Ganhar Moedas
            </h3>

            <div className="space-y-3">
              {!userCoins?.claimed_bonus && (
                <button 
                  onClick={claimBonus}
                  className="w-full flex items-center justify-between p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors border border-zinc-700"
                >
                  <span className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Gift className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-white">Bônus de Boas-vindas</span>
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Coins className="w-4 h-4" />
                    +30
                  </span>
                </button>
              )}

              {!userCoins?.followed_instagram && (
                <button 
                  onClick={followInstagram}
                  className="w-full flex items-center justify-between p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors border border-zinc-700"
                >
                  <span className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <Instagram className="w-5 h-5 text-pink-400" />
                    </div>
                    <span className="text-white">Seguir @isaacmuaco</span>
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Coins className="w-4 h-4" />
                    +40
                  </span>
                </button>
              )}

              <div className="p-4 bg-zinc-800/50 rounded-xl text-center border border-zinc-700/50">
                <Sparkles className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                <p className="text-sm text-zinc-500">
                  Mais tarefas em breve
                </p>
              </div>
            </div>
          </div>

          {/* Section tabs */}
          <div className="flex gap-2 mt-8 mb-4">
            <button
              onClick={() => setActiveSection('rewards')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                activeSection === 'rewards'
                  ? 'bg-amber-500 text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Transações
            </button>
            <button
              onClick={() => setActiveSection('history')}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                activeSection === 'history'
                  ? 'bg-amber-500 text-black'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Histórico
            </button>
          </div>

          {/* Transactions */}
          {activeSection === 'rewards' && (
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                Transações de Moedas
              </h3>

              {transactions.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">
                  Nenhuma transação ainda
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {transactions.map((tx) => (
                    <div 
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-zinc-800 rounded-xl"
                    >
                      <div>
                        <p className="font-medium text-white text-sm">{tx.description || tx.type}</p>
                        <p className="text-xs text-zinc-500">{formatDate(tx.created_at)}</p>
                      </div>
                      <span className={`font-bold flex items-center gap-1 ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <Coins className="w-4 h-4" />
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Watch History */}
          {activeSection === 'history' && (
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                Histórico de Visualização
              </h3>

              {watchHistory.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">
                  Nenhum histórico ainda
                </p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {watchHistory.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-3 p-2 bg-zinc-800 rounded-xl cursor-pointer hover:bg-zinc-700 transition-colors"
                      onClick={() => navigate(`/${item.media_type}/${item.media_id}`)}
                    >
                      {item.media_poster ? (
                        <img 
                          src={item.media_poster} 
                          alt={item.media_title}
                          className="w-12 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-16 bg-zinc-700 rounded-lg flex items-center justify-center">
                          <Play className="w-4 h-4 text-zinc-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{item.media_title}</p>
                        <p className="text-xs text-zinc-500">
                          {item.media_type === 'movie' ? 'Filme' : 'Série'} • {formatDate(item.watched_at)}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-zinc-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

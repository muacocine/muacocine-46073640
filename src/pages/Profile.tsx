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
  Calendar,
  ArrowRight,
  Trophy
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
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setProfile(profileData);

      // Fetch watch history
      const { data: historyData } = await supabase
        .from('watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false })
        .limit(20);

      setWatchHistory(historyData || []);

      // Fetch transactions
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-display text-foreground">
                  {profile?.username || user?.email?.split('@')[0] || 'Usuário'}
                </h1>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Coins display */}
            <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl">
              <Coins className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Suas moedas</p>
                <p className="text-3xl font-bold text-primary">{coins}</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left column */}
            <div className="space-y-6">
              {/* Spin Wheel */}
              <SpinWheel 
                onSpin={spin}
                canSpin={canSpinToday}
                currentStreak={userCoins?.spin_streak || 0}
              />

              {/* Earn coins section */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-xl font-display text-foreground mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Ganhar Moedas
                </h3>

                <div className="space-y-3">
                  {/* Claim bonus */}
                  {!userCoins?.claimed_bonus && (
                    <Button 
                      onClick={claimBonus}
                      className="w-full justify-between"
                      variant="outline"
                    >
                      <span className="flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Bônus de Boas-vindas
                      </span>
                      <span className="text-primary font-bold">+30</span>
                    </Button>
                  )}

                  {/* Follow Instagram */}
                  {!userCoins?.followed_instagram && (
                    <Button 
                      onClick={followInstagram}
                      className="w-full justify-between"
                      variant="outline"
                    >
                      <span className="flex items-center gap-2">
                        <Instagram className="w-4 h-4" />
                        Seguir @isaacmuaco
                      </span>
                      <span className="text-primary font-bold">+40</span>
                    </Button>
                  )}

                  {/* Ads (placeholder) */}
                  <div className="p-4 bg-secondary/30 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Anúncios disponíveis em breve
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Assista anúncios para ganhar moedas extras
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Watch History */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-xl font-display text-foreground mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Histórico de Visualização
                </h3>

                {watchHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum histórico ainda
                  </p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {watchHistory.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center gap-3 p-2 bg-secondary/30 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                        onClick={() => navigate(`/${item.media_type}/${item.media_id}`)}
                      >
                        {item.media_poster ? (
                          <img 
                            src={item.media_poster} 
                            alt={item.media_title}
                            className="w-12 h-16 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-16 bg-secondary rounded flex items-center justify-center">
                            <Play className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{item.media_title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.media_type === 'movie' ? 'Filme' : 'Série'} • {formatDate(item.watched_at)}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Transactions */}
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-xl font-display text-foreground mb-4 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary" />
                  Transações de Moedas
                </h3>

                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma transação ainda
                  </p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {transactions.map((tx) => (
                      <div 
                        key={tx.id}
                        className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-foreground text-sm">{tx.description || tx.type}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                        </div>
                        <span className={`font-bold ${tx.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UserCoins {
  coins: number;
  last_spin_date: string | null;
  spin_streak: number;
  followed_instagram: boolean;
  claimed_bonus: boolean;
}

const SPIN_REWARDS = [5, 6, 10, 13, 19, 21, 30]; // Day 1-7

export function useCoins() {
  const { user } = useAuth();
  const [userCoins, setUserCoins] = useState<UserCoins | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCoins = useCallback(async () => {
    if (!user) {
      setUserCoins(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_coins')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching coins:', error);
      }

      if (!data) {
        // Create initial coins for user
        const { data: newData, error: insertError } = await supabase
          .from('user_coins')
          .insert({ user_id: user.id, coins: 10 })
          .select()
          .single();

        if (!insertError && newData) {
          setUserCoins({
            coins: newData.coins,
            last_spin_date: newData.last_spin_date,
            spin_streak: newData.spin_streak,
            followed_instagram: newData.followed_instagram,
            claimed_bonus: newData.claimed_bonus,
          });
        }
      } else {
        setUserCoins({
          coins: data.coins,
          last_spin_date: data.last_spin_date,
          spin_streak: data.spin_streak,
          followed_instagram: data.followed_instagram,
          claimed_bonus: data.claimed_bonus,
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  const canSpinToday = useCallback(() => {
    if (!userCoins?.last_spin_date) return true;
    const today = new Date().toISOString().split('T')[0];
    return userCoins.last_spin_date !== today;
  }, [userCoins]);

  const spin = useCallback(async () => {
    if (!user || !userCoins) return { success: false, reward: 0 };

    if (!canSpinToday()) {
      toast.error('Você já girou a roleta hoje! Volte amanhã.');
      return { success: false, reward: 0 };
    }

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    let newStreak = 1;
    if (userCoins.last_spin_date === yesterday) {
      newStreak = Math.min(userCoins.spin_streak + 1, 7);
    }

    const reward = SPIN_REWARDS[newStreak - 1];

    const { error } = await supabase
      .from('user_coins')
      .update({
        coins: userCoins.coins + reward,
        last_spin_date: today,
        spin_streak: newStreak,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (!error) {
      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: reward,
        type: 'spin',
        description: `Spin diário - Dia ${newStreak}`,
      });

      setUserCoins(prev => prev ? {
        ...prev,
        coins: prev.coins + reward,
        last_spin_date: today,
        spin_streak: newStreak,
      } : null);

      return { success: true, reward, streak: newStreak };
    }

    return { success: false, reward: 0 };
  }, [user, userCoins, canSpinToday]);

  const spendCoins = useCallback(async (amount: number, description: string) => {
    if (!user || !userCoins) return false;

    // Get current coins from database to prevent race conditions
    const { data: currentData } = await supabase
      .from('user_coins')
      .select('coins')
      .eq('user_id', user.id)
      .single();

    if (!currentData || currentData.coins < amount) {
      toast.error('Moedas insuficientes!');
      return false;
    }

    const { error } = await supabase
      .from('user_coins')
      .update({
        coins: currentData.coins - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (!error) {
      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: -amount,
        type: 'watch',
        description,
      });

      setUserCoins(prev => prev ? { ...prev, coins: currentData.coins - amount } : null);
      return true;
    }

    return false;
  }, [user, userCoins]);

  const refundCoins = useCallback(async (amount: number, description: string) => {
    if (!user || !userCoins) return false;

    try {
      // First check current coins to avoid race conditions
      const { data: currentData } = await supabase
        .from('user_coins')
        .select('coins')
        .eq('user_id', user.id)
        .single();

      if (!currentData) return false;

      const { error } = await supabase
        .from('user_coins')
        .update({
          coins: currentData.coins + amount,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (!error) {
        await supabase.from('coin_transactions').insert({
          user_id: user.id,
          amount,
          type: 'refund',
          description,
        });

        setUserCoins(prev => prev ? { ...prev, coins: currentData.coins + amount } : null);
        toast.success(`${amount} moedas devolvidas!`);
        return true;
      }
    } catch (error) {
      console.error('Refund error:', error);
    }

    return false;
  }, [user, userCoins]);

  const earnCoins = useCallback(async (amount: number, type: string, description: string) => {
    if (!user || !userCoins) return false;

    const { error } = await supabase
      .from('user_coins')
      .update({
        coins: userCoins.coins + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (!error) {
      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount,
        type,
        description,
      });

      setUserCoins(prev => prev ? { ...prev, coins: prev.coins + amount } : null);
      toast.success(`+${amount} moedas!`);
      return true;
    }

    return false;
  }, [user, userCoins]);

  const claimBonus = useCallback(async () => {
    if (!user || !userCoins || userCoins.claimed_bonus) return false;

    const { error } = await supabase
      .from('user_coins')
      .update({
        coins: userCoins.coins + 30,
        claimed_bonus: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (!error) {
      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: 30,
        type: 'claim',
        description: 'Bônus de boas-vindas',
      });

      setUserCoins(prev => prev ? { ...prev, coins: prev.coins + 30, claimed_bonus: true } : null);
      toast.success('+30 moedas! Bônus resgatado!');
      return true;
    }

    return false;
  }, [user, userCoins]);

  const followInstagram = useCallback(async () => {
    if (!user || !userCoins || userCoins.followed_instagram) return false;

    window.open('https://instagram.com/isaacmuaco', '_blank');

    const { error } = await supabase
      .from('user_coins')
      .update({
        coins: userCoins.coins + 40,
        followed_instagram: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (!error) {
      await supabase.from('coin_transactions').insert({
        user_id: user.id,
        amount: 40,
        type: 'follow',
        description: 'Seguiu no Instagram',
      });

      setUserCoins(prev => prev ? { ...prev, coins: prev.coins + 40, followed_instagram: true } : null);
      toast.success('+40 moedas por seguir!');
      return true;
    }

    return false;
  }, [user, userCoins]);

  return {
    coins: userCoins?.coins || 0,
    userCoins,
    loading,
    canSpinToday: canSpinToday(),
    spin,
    spendCoins,
    refundCoins,
    earnCoins,
    claimBonus,
    followInstagram,
    refreshCoins: fetchCoins,
  };
}

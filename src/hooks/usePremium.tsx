import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PremiumSubscription {
  id: string;
  plan_type: 'free' | 'basic' | 'premium' | 'ultimate';
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
}

export interface PremiumPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  noCoinsNeeded: boolean;
  unlimitedDownloads: boolean;
  noAds: boolean;
}

export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'free',
    name: 'Grátis',
    price: 0,
    features: ['10 moedas iniciais', 'Roleta diária', 'Ganhar moedas seguindo'],
    noCoinsNeeded: false,
    unlimitedDownloads: false,
    noAds: false,
  },
  {
    id: 'basic',
    name: 'Básico',
    price: 9.99,
    features: ['Assistir sem gastar moedas', '5 downloads por mês', 'Menos anúncios'],
    noCoinsNeeded: true,
    unlimitedDownloads: false,
    noAds: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    features: ['Assistir sem gastar moedas', 'Downloads ilimitados', 'Sem anúncios'],
    noCoinsNeeded: true,
    unlimitedDownloads: true,
    noAds: true,
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    price: 29.99,
    features: ['Tudo do Premium', 'Acesso antecipado', 'Suporte prioritário', 'Badge exclusivo'],
    noCoinsNeeded: true,
    unlimitedDownloads: true,
    noAds: true,
  },
];

export function usePremium() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<PremiumSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
      }

      if (data) {
        // Check if subscription is expired
        const isExpired = data.expires_at && new Date(data.expires_at) < new Date();
        if (isExpired) {
          // Update to inactive
          await supabase
            .from('premium_subscriptions')
            .update({ is_active: false })
            .eq('id', data.id);
          
          setSubscription({ ...data, is_active: false } as PremiumSubscription);
        } else {
          setSubscription(data as PremiumSubscription);
        }
      } else {
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isPremium = subscription?.is_active && subscription?.plan_type !== 'free';
  
  const currentPlan = PREMIUM_PLANS.find(p => p.id === (subscription?.plan_type || 'free')) || PREMIUM_PLANS[0];

  const needsCoins = !currentPlan.noCoinsNeeded;
  const canDownloadUnlimited = currentPlan.unlimitedDownloads;
  const hasAds = !currentPlan.noAds;

  return {
    subscription,
    loading,
    isPremium,
    currentPlan,
    needsCoins,
    canDownloadUnlimited,
    hasAds,
    refresh: fetchSubscription,
  };
}

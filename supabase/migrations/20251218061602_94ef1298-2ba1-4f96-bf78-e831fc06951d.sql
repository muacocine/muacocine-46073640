-- Tabela de moedas do usuário
CREATE TABLE public.user_coins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  coins INTEGER NOT NULL DEFAULT 0,
  last_spin_date DATE,
  spin_streak INTEGER NOT NULL DEFAULT 0,
  followed_instagram BOOLEAN NOT NULL DEFAULT false,
  claimed_bonus BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Histórico de transações de moedas
CREATE TABLE public.coin_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- 'spin', 'watch', 'refund', 'follow', 'claim', 'ads'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Histórico de visualização
CREATE TABLE public.watch_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL, -- 'movie' ou 'tv'
  media_title TEXT NOT NULL,
  media_poster TEXT,
  coins_spent INTEGER NOT NULL DEFAULT 0,
  watched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed BOOLEAN NOT NULL DEFAULT false
);

-- Comentários
CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_coins
CREATE POLICY "Users can view their own coins" ON public.user_coins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own coins" ON public.user_coins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own coins" ON public.user_coins FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for coin_transactions
CREATE POLICY "Users can view their own transactions" ON public.coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for watch_history
CREATE POLICY "Users can view their own history" ON public.watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own history" ON public.watch_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own history" ON public.watch_history FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Anyone can view comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can insert their own comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Function to create user coins on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_coins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_coins (user_id, coins)
  VALUES (new.id, 10);
  RETURN new;
END;
$$;

-- Trigger for new user coins
CREATE TRIGGER on_auth_user_created_coins
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_coins();
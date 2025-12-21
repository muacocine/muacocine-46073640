import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePremium, PREMIUM_PLANS } from '@/hooks/usePremium';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Check, Crown, Sparkles, Zap, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function Premium() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentPlan, isPremium } = usePremium();

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      toast.error('Faça login para assinar um plano');
      navigate('/auth');
      return;
    }

    if (planId === 'free') {
      toast.info('Você já está no plano gratuito');
      return;
    }

    // For now, show a message since we don't have payment integration
    toast.info('Em breve! Sistema de pagamento será implementado.');
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'basic': return <Zap className="w-8 h-8" />;
      case 'premium': return <Crown className="w-8 h-8" />;
      case 'ultimate': return <Sparkles className="w-8 h-8" />;
      default: return <Star className="w-8 h-8" />;
    }
  };

  const getPlanColors = (planId: string) => {
    switch (planId) {
      case 'basic': return 'from-blue-500 to-blue-600';
      case 'premium': return 'from-primary to-accent';
      case 'ultimate': return 'from-purple-500 to-pink-500';
      default: return 'from-muted to-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-primary font-medium">Planos Premium</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-display text-foreground mb-4">
              ASSISTA SEM LIMITES
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano perfeito para você e aproveite todo o conteúdo do Muaco Cine sem restrições.
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {PREMIUM_PLANS.map((plan) => {
              const isCurrentPlan = currentPlan.id === plan.id;
              const isPopular = plan.id === 'premium';

              return (
                <div 
                  key={plan.id}
                  className={`relative bg-card rounded-2xl border transition-all duration-300 hover:scale-105 ${
                    isPopular ? 'border-primary shadow-gold' : 'border-border'
                  } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                      MAIS POPULAR
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-3 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      ATUAL
                    </div>
                  )}

                  <div className="p-6">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getPlanColors(plan.id)} flex items-center justify-center text-white mb-4`}>
                      {getPlanIcon(plan.id)}
                    </div>

                    {/* Name & Price */}
                    <h3 className="text-xl font-display text-foreground mb-2">
                      {plan.name.toUpperCase()}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      {plan.price > 0 ? (
                        <>
                          <span className="text-3xl font-bold text-foreground">
                            R${plan.price.toFixed(2).replace('.', ',')}
                          </span>
                          <span className="text-muted-foreground">/mês</span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold text-foreground">Grátis</span>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-foreground/80">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Button */}
                    <Button
                      className={`w-full ${isPopular ? 'bg-primary hover:bg-primary/90' : ''}`}
                      variant={isPopular ? 'default' : 'outline'}
                      disabled={isCurrentPlan}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {isCurrentPlan ? 'Plano Atual' : plan.price > 0 ? 'Assinar' : 'Continuar Grátis'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Benefits Section */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-display text-foreground mb-8">
              POR QUE SER PREMIUM?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="p-6 bg-card rounded-xl border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Sem Gastar Moedas</h3>
                <p className="text-sm text-muted-foreground">
                  Assista quantos filmes e séries quiser sem se preocupar com moedas.
                </p>
              </div>
              <div className="p-6 bg-card rounded-xl border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Downloads Ilimitados</h3>
                <p className="text-sm text-muted-foreground">
                  Baixe seus filmes favoritos para assistir offline a qualquer momento.
                </p>
              </div>
              <div className="p-6 bg-card rounded-xl border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Sem Anúncios</h3>
                <p className="text-sm text-muted-foreground">
                  Experiência limpa e sem interrupções durante a reprodução.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

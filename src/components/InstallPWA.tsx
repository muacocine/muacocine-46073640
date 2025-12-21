import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed before
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      // Show again after 3 days
      if (Date.now() - dismissedTime < 3 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS/Safari that doesn't support beforeinstallprompt
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    
    if (isIOS && isSafari) {
      setTimeout(() => setShowBanner(true), 3000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
    setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
    setShowBanner(false);
  };

  if (isInstalled || !showBanner) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="container mx-auto max-w-lg">
        <div className="bg-card border border-border rounded-2xl p-4 shadow-xl">
          <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center">
              <img src="/logo.png" alt="Muaco Cine" className="w-12 h-12 object-contain" />
            </div>
            
            <div className="flex-1">
              <h3 className="font-display text-lg text-foreground">Instale o App!</h3>
              <p className="text-sm text-muted-foreground">
                Acesse mais rápido e assista offline
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            {isIOS ? (
              <div className="flex-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Toque em <strong>Compartilhar</strong> e depois <strong>"Adicionar à Tela Inicial"</strong>
                </p>
              </div>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleDismiss}
                >
                  Agora não
                </Button>
                <Button 
                  className="flex-1 gap-2"
                  onClick={handleInstall}
                >
                  <Download className="w-4 h-4" />
                  Instalar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

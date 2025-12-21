import { useState } from 'react';
import { Download, X, HardDrive, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCoins } from '@/hooks/useCoins';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface DownloadQuality {
  id: string;
  name: string;
  size: string;
  resolution: string;
  icon: React.ReactNode;
}

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  mediaTitle: string;
  season?: number;
  episode?: number;
}

const DOWNLOAD_COST = 100;

const QUALITIES: DownloadQuality[] = [
  {
    id: 'low',
    name: 'Baixa',
    size: '150-300 MB',
    resolution: '480p',
    icon: <WifiOff className="w-5 h-5" />,
  },
  {
    id: 'medium',
    name: 'Média',
    size: '500-800 MB',
    resolution: '720p HD',
    icon: <Wifi className="w-5 h-5" />,
  },
  {
    id: 'high',
    name: 'Alta',
    size: '1.5-3 GB',
    resolution: '1080p Full HD',
    icon: <HardDrive className="w-5 h-5" />,
  },
];

export default function DownloadModal({
  isOpen,
  onClose,
  mediaId,
  mediaType,
  mediaTitle,
  season,
  episode,
}: DownloadModalProps) {
  const { user } = useAuth();
  const { coins, spendCoins } = useCoins();
  const { canDownloadUnlimited } = usePremium();
  const navigate = useNavigate();
  const [selectedQuality, setSelectedQuality] = useState<string>('medium');
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!user) {
      toast.error('Faça login para baixar');
      navigate('/auth');
      onClose();
      return;
    }

    if (!canDownloadUnlimited && coins < DOWNLOAD_COST) {
      toast.error(`Você precisa de ${DOWNLOAD_COST} moedas para baixar. Seja Premium para downloads ilimitados!`);
      navigate('/premium');
      onClose();
      return;
    }

    setDownloading(true);

    // Spend coins only if not premium
    if (!canDownloadUnlimited) {
      const success = await spendCoins(DOWNLOAD_COST, `Download: ${mediaTitle} (${selectedQuality})`);
      if (!success) {
        setDownloading(false);
        return;
      }
    }

    // Generate download URL based on quality
    let downloadUrl = '';
    const qualityParam = selectedQuality === 'low' ? '480' : selectedQuality === 'medium' ? '720' : '1080';
    
    if (mediaType === 'movie') {
      downloadUrl = `https://dl.vidsrc.vip/movie/${mediaId}?quality=${qualityParam}`;
    } else {
      downloadUrl = `https://dl.vidsrc.vip/tv/${mediaId}/${season}/${episode}?quality=${qualityParam}`;
    }

    // Open download link
    window.open(downloadUrl, '_blank');
    
    toast.success(`Download iniciado! Qualidade: ${QUALITIES.find(q => q.id === selectedQuality)?.name}`);
    setDownloading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg text-foreground">BAIXAR</h3>
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">{mediaTitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quality Options */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground mb-4">Escolha a qualidade do download:</p>
          
          {QUALITIES.map((quality) => (
            <button
              key={quality.id}
              onClick={() => setSelectedQuality(quality.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                selectedQuality === quality.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50 bg-secondary/50'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                selectedQuality === quality.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {quality.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{quality.name}</span>
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                    {quality.resolution}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{quality.size}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedQuality === quality.id ? 'border-primary' : 'border-muted-foreground'
              }`}>
                {selectedQuality === quality.id && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-3">
          {!canDownloadUnlimited && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Custo:</span>
              <span className="font-semibold text-primary">{DOWNLOAD_COST} moedas</span>
            </div>
          )}
          
          {canDownloadUnlimited && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <span>✓ Download gratuito (Premium)</span>
            </div>
          )}

          <Button 
            className="w-full gap-2" 
            onClick={handleDownload}
            disabled={downloading}
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Iniciando...' : 'Baixar Agora'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            O arquivo será salvo no seu dispositivo
          </p>
        </div>
      </div>
    </div>
  );
}

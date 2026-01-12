import { useState, useEffect } from 'react';
import { Download, X, HardDrive, Wifi, WifiOff, CheckCircle, Loader2, FolderDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCoins } from '@/hooks/useCoins';
import { usePremium } from '@/hooks/usePremium';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

interface DownloadQuality {
  id: string;
  name: string;
  size: string;
  resolution: string;
  icon: React.ReactNode;
  bitrate: number; // KB/s simulation
}

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  mediaTitle: string;
  mediaPoster?: string;
  season?: number;
  episode?: number;
}

interface DownloadItem {
  id: string;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  poster?: string;
  quality: string;
  size: string;
  downloadedAt: string;
  season?: number;
  episode?: number;
}

const DOWNLOAD_COST = 100;
const STORAGE_KEY = 'muaco_downloads';

const QUALITIES: DownloadQuality[] = [
  {
    id: 'low',
    name: 'Baixa',
    size: '150-300 MB',
    resolution: '480p',
    icon: <WifiOff className="w-5 h-5" />,
    bitrate: 500,
  },
  {
    id: 'medium',
    name: 'Média',
    size: '500-800 MB',
    resolution: '720p HD',
    icon: <Wifi className="w-5 h-5" />,
    bitrate: 1000,
  },
  {
    id: 'high',
    name: 'Alta',
    size: '1.5-3 GB',
    resolution: '1080p Full HD',
    icon: <HardDrive className="w-5 h-5" />,
    bitrate: 2000,
  },
];

// Get downloads from localStorage
const getDownloads = (): DownloadItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Save download to localStorage
const saveDownload = (item: DownloadItem) => {
  const downloads = getDownloads();
  // Check if already exists
  const exists = downloads.find(
    d => d.mediaId === item.mediaId && 
    d.mediaType === item.mediaType && 
    d.season === item.season && 
    d.episode === item.episode
  );
  
  if (!exists) {
    downloads.unshift(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(downloads));
  }
};

// Check if already downloaded
const isDownloaded = (mediaId: number, mediaType: string, season?: number, episode?: number): boolean => {
  const downloads = getDownloads();
  return downloads.some(
    d => d.mediaId === mediaId && 
    d.mediaType === mediaType && 
    d.season === season && 
    d.episode === episode
  );
};

export default function DownloadModal({
  isOpen,
  onClose,
  mediaId,
  mediaType,
  mediaTitle,
  mediaPoster,
  season,
  episode,
}: DownloadModalProps) {
  const { user } = useAuth();
  const { coins, spendCoins } = useCoins();
  const { canDownloadUnlimited } = usePremium();
  const navigate = useNavigate();
  const [selectedQuality, setSelectedQuality] = useState<string>('medium');
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [alreadyDownloaded, setAlreadyDownloaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAlreadyDownloaded(isDownloaded(mediaId, mediaType, season, episode));
      setProgress(0);
      setDownloadComplete(false);
    }
  }, [isOpen, mediaId, mediaType, season, episode]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!user) {
      toast.error('Faça login para baixar');
      navigate('/auth');
      onClose();
      return;
    }

    if (alreadyDownloaded) {
      toast.info('Este conteúdo já está na sua lista de downloads!');
      return;
    }

    if (!canDownloadUnlimited && coins < DOWNLOAD_COST) {
      toast.error(`Você precisa de ${DOWNLOAD_COST} moedas para baixar. Seja Premium para downloads ilimitados!`);
      navigate('/premium');
      onClose();
      return;
    }

    setDownloading(true);
    setProgress(0);

    // Spend coins only if not premium
    if (!canDownloadUnlimited) {
      const success = await spendCoins(DOWNLOAD_COST, `Download: ${mediaTitle} (${selectedQuality})`);
      if (!success) {
        setDownloading(false);
        return;
      }
    }

    // Simulate download progress
    const quality = QUALITIES.find(q => q.id === selectedQuality);
    const duration = quality?.id === 'high' ? 5000 : quality?.id === 'medium' ? 3000 : 2000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const progressInterval = setInterval(() => {
      currentStep++;
      const newProgress = Math.min((currentStep / steps) * 100, 100);
      setProgress(newProgress);

      if (currentStep >= steps) {
        clearInterval(progressInterval);
        
        // Save to local storage
        const downloadItem: DownloadItem = {
          id: `${mediaType}-${mediaId}-${season || 0}-${episode || 0}`,
          mediaId,
          mediaType,
          title: mediaTitle,
          poster: mediaPoster,
          quality: selectedQuality,
          size: quality?.size || '500 MB',
          downloadedAt: new Date().toISOString(),
          season,
          episode,
        };
        
        saveDownload(downloadItem);
        setDownloadComplete(true);
        setDownloading(false);
        toast.success('Download concluído! Disponível offline na sua lista.');
        
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    }, interval);
  };

  const handleViewDownloads = () => {
    onClose();
    navigate('/favorites?tab=downloads');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border-t sm:border border-border rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              {downloadComplete ? (
                <CheckCircle className="w-6 h-6 text-primary animate-scale-in" />
              ) : (
                <Download className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                {downloadComplete ? 'Concluído!' : 'Baixar Offline'}
              </h3>
              <p className="text-sm text-muted-foreground truncate max-w-[180px]">{mediaTitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Already downloaded notice */}
        {alreadyDownloaded && !downloading && !downloadComplete && (
          <div className="p-4 bg-primary/10 border-b border-primary/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Já está nos seus downloads</p>
                <button 
                  onClick={handleViewDownloads}
                  className="text-xs text-primary hover:underline"
                >
                  Ver meus downloads →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Download Progress */}
        {downloading && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-secondary"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * progress) / 100}
                    className="text-primary transition-all duration-100"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-foreground">{Math.round(progress)}%</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Baixando para armazenamento local...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Qualidade: {QUALITIES.find(q => q.id === selectedQuality)?.resolution}
              </p>
            </div>
          </div>
        )}

        {/* Download Complete */}
        {downloadComplete && (
          <div className="p-6 space-y-4 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">Download Salvo!</p>
              <p className="text-sm text-muted-foreground">Disponível na sua lista de downloads</p>
            </div>
          </div>
        )}

        {/* Quality Options */}
        {!downloading && !downloadComplete && (
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground mb-4">Escolha a qualidade do download:</p>
            
            {QUALITIES.map((quality) => (
              <button
                key={quality.id}
                onClick={() => setSelectedQuality(quality.id)}
                disabled={alreadyDownloaded}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  selectedQuality === quality.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 bg-secondary/30'
                } ${alreadyDownloaded ? 'opacity-50' : ''}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
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
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedQuality === quality.id ? 'border-primary bg-primary' : 'border-muted-foreground'
                }`}>
                  {selectedQuality === quality.id && (
                    <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        {!downloading && !downloadComplete && (
          <div className="p-4 border-t border-border space-y-3">
            {!canDownloadUnlimited && !alreadyDownloaded && (
              <div className="flex items-center justify-between text-sm bg-secondary/50 p-3 rounded-xl">
                <span className="text-muted-foreground">Custo:</span>
                <span className="font-semibold text-primary">{DOWNLOAD_COST} moedas</span>
              </div>
            )}
            
            {canDownloadUnlimited && !alreadyDownloaded && (
              <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 p-3 rounded-xl">
                <CheckCircle className="w-4 h-4" />
                <span>Download gratuito (Premium)</span>
              </div>
            )}

            <Button 
              className="w-full gap-2 h-12 rounded-xl text-base" 
              onClick={alreadyDownloaded ? handleViewDownloads : handleDownload}
              disabled={downloading}
            >
              {alreadyDownloaded ? (
                <>
                  <FolderDown className="w-5 h-5" />
                  Ver Meus Downloads
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Baixar Agora
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              {alreadyDownloaded 
                ? 'Este conteúdo já foi baixado anteriormente'
                : 'O arquivo será salvo localmente no seu dispositivo'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Export utility functions for use in other components
export { getDownloads, saveDownload, isDownloaded };
export type { DownloadItem };

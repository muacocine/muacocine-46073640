import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  Trash2, 
  Play, 
  Film, 
  Tv, 
  Clock, 
  HardDrive,
  WifiOff,
  ChevronLeft,
  MoreVertical,
  Search,
  SortDesc
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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

interface WatchProgress {
  mediaId: number;
  mediaType: string;
  currentTime: number;
  duration: number;
  season?: number;
  episode?: number;
}

const STORAGE_KEY = 'muaco_downloads';
const PROGRESS_KEY = 'muaco_watch_progress';

const getDownloads = (): DownloadItem[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const removeDownload = (id: string): void => {
  const downloads = getDownloads();
  const filtered = downloads.filter(d => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

const getWatchProgress = (): WatchProgress[] => {
  try {
    const data = localStorage.getItem(PROGRESS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const getProgressForMedia = (mediaId: number, mediaType: string, season?: number, episode?: number): WatchProgress | undefined => {
  const progresses = getWatchProgress();
  return progresses.find(p => 
    p.mediaId === mediaId && 
    p.mediaType === mediaType &&
    p.season === season &&
    p.episode === episode
  );
};

export default function Downloads() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadDownloads();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadDownloads = () => {
    const data = getDownloads();
    setDownloads(data);
  };

  const handleDelete = (id: string) => {
    removeDownload(id);
    loadDownloads();
    setDeleteDialog(null);
    toast.success('Download removido com sucesso');
  };

  const handleDeleteAll = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    loadDownloads();
    toast.success('Todos os downloads foram removidos');
  };

  const handlePlay = (item: DownloadItem) => {
    const path = item.mediaType === 'movie' 
      ? `/movie/${item.mediaId}?offline=true`
      : `/tv/${item.mediaId}?offline=true&season=${item.season}&episode=${item.episode}`;
    navigate(path);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
  };

  const getQualityLabel = (quality: string) => {
    switch (quality) {
      case 'high': return '1080p';
      case 'medium': return '720p';
      case 'low': return '480p';
      default: return quality;
    }
  };

  const filteredDownloads = downloads
    .filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime();
      }
      return a.title.localeCompare(b.title);
    });

  const totalSize = downloads.reduce((acc, d) => {
    const sizeMatch = d.size.match(/(\d+\.?\d*)/);
    const size = sizeMatch ? parseFloat(sizeMatch[1]) : 0;
    const isGB = d.size.includes('GB');
    return acc + (isGB ? size * 1024 : size);
  }, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">Downloads</h1>
              <p className="text-xs text-muted-foreground">
                {downloads.length} {downloads.length === 1 ? 'item' : 'itens'} • {totalSize > 1024 ? `${(totalSize / 1024).toFixed(1)} GB` : `${totalSize.toFixed(0)} MB`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Online/Offline indicator */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              isOnline 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-orange-500/20 text-orange-400'
            }`}>
              <WifiOff className="w-3 h-3" />
              {isOnline ? 'Online' : 'Offline'}
            </div>

            {/* Sort button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <SortDesc className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy('date')}>
                  Por data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name')}>
                  Por nome
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar downloads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-border rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Empty state */}
        {downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
              <Download className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Nenhum download</h2>
            <p className="text-muted-foreground max-w-xs mb-6">
              Baixe filmes e séries para assistir offline quando não tiver conexão
            </p>
            <Button onClick={() => navigate('/')} className="gap-2">
              <Film className="w-4 h-4" />
              Explorar Conteúdo
            </Button>
          </div>
        ) : (
          <>
            {/* Quick actions */}
            {downloads.length > 1 && (
              <div className="flex items-center justify-between bg-secondary/30 rounded-xl p-3">
                <span className="text-sm text-muted-foreground">
                  {filteredDownloads.length} downloads
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleDeleteAll}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Limpar tudo
                </Button>
              </div>
            )}

            {/* Downloads list */}
            <div className="space-y-3">
              {filteredDownloads.map((item) => {
                const progress = getProgressForMedia(
                  item.mediaId, 
                  item.mediaType, 
                  item.season, 
                  item.episode
                );
                const progressPercent = progress 
                  ? Math.round((progress.currentTime / progress.duration) * 100) 
                  : 0;

                return (
                  <div 
                    key={item.id}
                    className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all"
                  >
                    <div className="flex gap-3 p-3">
                      {/* Poster */}
                      <div 
                        className="relative w-24 h-36 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
                        onClick={() => handlePlay(item)}
                      >
                        {item.poster ? (
                          <img 
                            src={item.poster} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-secondary flex items-center justify-center">
                            {item.mediaType === 'movie' ? (
                              <Film className="w-8 h-8 text-muted-foreground" />
                            ) : (
                              <Tv className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        
                        {/* Play overlay */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                            <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
                          </div>
                        </div>

                        {/* Quality badge */}
                        <Badge className="absolute top-1 right-1 bg-black/60 text-white text-[10px] px-1.5">
                          {getQualityLabel(item.quality)}
                        </Badge>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                            {item.title}
                          </h3>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              {item.mediaType === 'movie' ? (
                                <Film className="w-3 h-3" />
                              ) : (
                                <Tv className="w-3 h-3" />
                              )}
                              {item.mediaType === 'movie' ? 'Filme' : `S${item.season}:E${item.episode}`}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              {item.size}
                            </span>
                          </div>

                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Baixado em {formatDate(item.downloadedAt)}
                          </p>
                        </div>

                        {/* Watch progress */}
                        {progressPercent > 0 && progressPercent < 100 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">Continuar assistindo</span>
                              <span className="text-primary font-medium">{progressPercent}%</span>
                            </div>
                            <Progress value={progressPercent} className="h-1.5" />
                          </div>
                        )}

                        {progressPercent >= 100 && (
                          <div className="flex items-center gap-1 text-xs text-green-500 mt-2">
                            <div className="w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                              ✓
                            </div>
                            Assistido
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-center justify-between">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full w-8 h-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePlay(item)}>
                              <Play className="w-4 h-4 mr-2" />
                              Reproduzir
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteDialog(item.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button 
                          size="sm" 
                          className="rounded-full gap-1 px-3"
                          onClick={() => handlePlay(item)}
                        >
                          <Play className="w-4 h-4 fill-primary-foreground" />
                          Assistir
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover download?</AlertDialogTitle>
            <AlertDialogDescription>
              Este conteúdo será removido da sua lista de downloads. Você precisará baixar novamente para assistir offline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}

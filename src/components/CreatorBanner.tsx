import { Heart, ExternalLink } from 'lucide-react';

export default function CreatorBanner() {
  return (
    <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 py-2 px-4">
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
        <Heart className="w-4 h-4 text-primary fill-primary" />
        <span className="text-foreground">
          Criado por <strong className="text-primary">Isaac Muaco</strong>
        </span>
        <a 
          href="https://instagram.com/isaacmuaco" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          Instagram
        </a>
      </div>
    </div>
  );
}

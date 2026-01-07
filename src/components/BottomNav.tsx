import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Tv, Heart, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/categories', icon: Compass, label: 'Explorar' },
  { path: '/muaco-tv', icon: Tv, label: 'TV' },
  { path: '/favorites', icon: Heart, label: 'Lista' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          // Se for favoritos ou perfil e não estiver logado, redireciona para auth
          const targetPath = (item.path === '/favorites' || item.path === '/profile') && !user 
            ? '/auth' 
            : item.path;
          
          return (
            <Link
              key={item.path}
              to={targetPath}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all duration-200 ${
                isActive 
                  ? 'text-primary scale-105' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${
                isActive ? 'bg-primary/20' : ''
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

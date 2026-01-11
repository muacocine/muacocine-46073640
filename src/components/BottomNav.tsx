import { Link, useLocation } from 'react-router-dom';
import { Home, Film, Tv, Download, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { path: '/', icon: Home, label: 'Lar' },
  { path: '/categories', icon: Film, label: 'Filmes' },
  { path: '/muaco-tv', icon: Tv, label: 'TV' },
  { path: '/favorites', icon: Download, label: 'Lista' },
  { path: '/profile', icon: User, label: 'Meu' },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong safe-area-bottom">
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
              className={`bottom-nav-item ${isActive ? 'active' : 'text-muted-foreground'}`}
            >
              <div className={`nav-icon p-2 rounded-xl transition-all duration-300 ${
                isActive ? 'bg-primary/20' : ''
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              </div>
              <span className="text-[10px] font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Central FREE button like in the reference */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <Link
            to="/muaco-tv"
            className="flex items-center justify-center w-14 h-14 rounded-full bg-primary shadow-glow text-primary-foreground font-bold text-xs animate-float"
          >
            FREE
          </Link>
        </div>
      </div>
    </nav>
  );
}

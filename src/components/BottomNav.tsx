import { Link, useLocation } from 'react-router-dom';
import { Home, Film, Tv, Download, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { path: '/', icon: Home, label: 'Início' },
  { path: '/categories', icon: Film, label: 'Filmes' },
  { path: '/muaco-tv', icon: Tv, label: 'TV' },
  { path: '/downloads', icon: Download, label: 'Downloads' },
  { path: '/profile', icon: User, label: 'Perfil' },
];

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Flutter-style bottom nav with curved notch effect */}
      <div className="relative">
        {/* Background with blur and gradient */}
        <div className="absolute inset-0 bg-card/95 backdrop-blur-2xl border-t border-border/50" />
        
        {/* Nav content */}
        <div className="relative flex items-center justify-around h-16 px-1 safe-area-bottom">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const isCenter = index === 2; // TV is center
            const Icon = item.icon;
            
            // Auth redirect for protected routes
            const targetPath = (item.path === '/downloads' || item.path === '/profile') && !user 
              ? '/auth' 
              : item.path;
            
            if (isCenter) {
              return (
                <Link
                  key={item.path}
                  to={targetPath}
                  className="relative flex flex-col items-center justify-center -mt-6"
                >
                  {/* Floating center button */}
                  <div className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary shadow-glow scale-105' 
                      : 'bg-gradient-to-br from-primary to-primary/80 shadow-lg'
                  }`}>
                    {/* Ripple effect background */}
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-30" />
                    <Icon className="w-6 h-6 text-primary-foreground relative z-10" strokeWidth={2} />
                  </div>
                  <span className={`text-[10px] font-medium mt-1 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {item.label}
                  </span>
                </Link>
              );
            }
            
            return (
              <Link
                key={item.path}
                to={targetPath}
                className="flutter-nav-item group"
              >
                <div className={`relative flex flex-col items-center gap-1 py-2 px-3 transition-all duration-300`}>
                  {/* Active indicator dot */}
                  {isActive && (
                    <div className="absolute -top-1 w-1 h-1 rounded-full bg-primary animate-pulse" />
                  )}
                  
                  {/* Icon container */}
                  <div className={`relative p-2 rounded-2xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-primary/15 scale-105' 
                      : 'group-hover:bg-secondary'
                  }`}>
                    <Icon 
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive 
                          ? 'text-primary stroke-[2.5]' 
                          : 'text-muted-foreground group-hover:text-foreground stroke-[1.5]'
                      }`} 
                    />
                    
                    {/* Glow effect for active */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-md -z-10" />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={`text-[10px] font-medium transition-all duration-300 ${
                    isActive 
                      ? 'text-primary font-semibold' 
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { Button } from '@/components/ui/button';
import CoinDisplay from './CoinDisplay';
import SearchBar from './SearchBar';
import { ThemeToggle } from './ThemeToggle';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Search, User, LogOut, Heart, Menu, X, Crown } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isPremium, currentPlan } = usePremium();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      
      <nav className="fixed top-0 left-0 right-0 z-40 glass-strong">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src="/logo.png" 
                alt="Muaco Cine" 
                className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
              />
              <span className="text-lg font-bold text-gradient hidden sm:block">
                MUACO CINE
              </span>
            </Link>

            {/* Search bar - always visible */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-2 bg-secondary/50 hover:bg-secondary text-muted-foreground px-4 py-2 rounded-xl transition-colors"
              >
                <Search className="w-4 h-4" />
                <span className="text-sm">Procurar filmes, séries...</span>
              </button>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSearchOpen(true)}
                className="md:hidden text-foreground p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              <ThemeToggle />

              {user && <CoinDisplay />}

              {isPremium && (
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-primary/20 rounded-lg border border-primary/30">
                  <Crown className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-primary">{currentPlan.name}</span>
                </div>
              )}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors">
                      <User className="w-4 h-4 text-primary-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 glass-strong">
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => navigate('/profile')}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="cursor-pointer"
                      onClick={() => navigate('/favorites')}
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Favoritos
                    </DropdownMenuItem>
                    {!isPremium && (
                      <DropdownMenuItem 
                        className="text-primary cursor-pointer"
                        onClick={() => navigate('/premium')}
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Premium
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="text-destructive cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={() => navigate('/auth')}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  Entrar
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

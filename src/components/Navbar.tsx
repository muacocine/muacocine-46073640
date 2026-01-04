import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePremium } from '@/hooks/usePremium';
import { Button } from '@/components/ui/button';
import CoinDisplay from './CoinDisplay';
import CreatorBanner from './CreatorBanner';
import InstallPWA from './InstallPWA';
import { ThemeToggle } from './ThemeToggle';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Search, User, LogOut, Heart, Menu, X, Tv, Crown, Sparkles } from 'lucide-react';
import SearchBar from './SearchBar';

export default function Navbar() {
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
      <CreatorBanner />
      <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <InstallPWA />
      
      <nav className="fixed top-8 left-0 right-0 z-40 bg-gradient-to-b from-background via-background/80 to-transparent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src="/logo.png" 
                alt="Muaco Cine" 
                className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
              />
              <span className="text-2xl font-display text-gradient-gold hidden sm:block">MUACO CINE</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
                Início
              </Link>
              <Link to="/categories" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
                Categorias
              </Link>
              <Link to="/series" className="text-foreground/80 hover:text-foreground transition-colors font-medium flex items-center gap-1">
                <Tv className="w-4 h-4" />
                Séries
              </Link>
              <Link to="/muaco-tv" className="text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1">
                <Tv className="w-4 h-4" />
                Muaco TV
              </Link>
              {user && (
                <Link to="/favorites" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
                  Minha Lista
                </Link>
              )}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              <button 
                onClick={() => setSearchOpen(true)}
                className="text-foreground/80 hover:text-foreground transition-colors p-2 rounded-full hover:bg-secondary"
              >
                <Search className="w-5 h-5" />
              </button>

              <ThemeToggle />

              {user && <CoinDisplay />}

              {isPremium && (
                <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full border border-primary/30">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary">{currentPlan.name}</span>
                </div>
              )}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                    <DropdownMenuItem 
                      className="text-foreground cursor-pointer"
                      onClick={() => navigate('/profile')}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Meu Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-foreground cursor-pointer"
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
                        <Sparkles className="w-4 h-4 mr-2" />
                        Seja Premium
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-border" />
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
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/auth')}
                  >
                    Entrar
                  </Button>
                  <Button onClick={() => navigate('/auth')}>
                    Cadastrar
                  </Button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              {user && <CoinDisplay />}
              <button 
                onClick={() => setSearchOpen(true)}
                className="text-foreground p-2"
              >
                <Search className="w-6 h-6" />
              </button>
              <button 
                className="text-foreground p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-border pt-4 animate-fade-in">
              <div className="flex flex-col gap-4">
                <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
                  Início
                </Link>
                <Link to="/categories" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
                  Categorias
                </Link>
                <Link to="/series" className="text-foreground/80 hover:text-foreground transition-colors font-medium flex items-center gap-1">
                  <Tv className="w-4 h-4" />
                  Séries
                </Link>
                <Link to="/muaco-tv" className="text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1">
                  <Tv className="w-4 h-4" />
                  Muaco TV
                </Link>
                {user && (
                  <>
                    <Link to="/favorites" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
                      Minha Lista
                    </Link>
                    <Link to="/profile" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
                      Meu Perfil
                    </Link>
                    {!isPremium && (
                      <Link to="/premium" className="text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1">
                        <Sparkles className="w-4 h-4" />
                        Seja Premium
                      </Link>
                    )}
                  </>
                )}
                <div className="pt-4 border-t border-border">
                  {user ? (
                    <Button variant="destructive" onClick={handleSignOut} className="w-full">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  ) : (
                    <Button onClick={() => navigate('/auth')} className="w-full">
                      Entrar / Cadastrar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Film, Search, User, LogOut, Heart, Menu, X } from 'lucide-react';
import SearchBar from './SearchBar';

export default function Navbar() {
  const { user, signOut } = useAuth();
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
      
      <nav className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-background via-background/80 to-transparent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <Film className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
              <span className="text-2xl font-display text-gradient-gold">MUACO CINE</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
                Início
              </Link>
              <Link to="/genre/28?name=Ação" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
                Filmes
              </Link>
              {user && (
                <Link to="/favorites" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
                  Minha Lista
                </Link>
              )}
            </div>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => setSearchOpen(true)}
                className="text-foreground/80 hover:text-foreground transition-colors p-2"
              >
                <Search className="w-5 h-5" />
              </button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors">
                      <User className="w-5 h-5 text-primary-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                    <DropdownMenuItem className="text-foreground cursor-pointer">
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
                <Link to="/genre/28?name=Ação" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
                  Filmes
                </Link>
                {user && (
                  <Link to="/favorites" className="text-foreground/80 hover:text-foreground transition-colors font-medium">
                    Minha Lista
                  </Link>
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

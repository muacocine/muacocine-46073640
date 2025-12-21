import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MovieDetails from "./pages/MovieDetails";
import TVDetails from "./pages/TVDetails";
import Favorites from "./pages/Favorites";
import GenrePage from "./pages/GenrePage";
import Profile from "./pages/Profile";
import Series from "./pages/Series";
import Premium from "./pages/Premium";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/tv/:id" element={<TVDetails />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/genre/:genreId" element={<GenrePage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/series" element={<Series />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageCircle, Send, Trash2, User } from 'lucide-react';

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
}

interface CommentsProps {
  mediaId: string;
  mediaType: 'movie' | 'tv';
}

export default function Comments({ mediaId, mediaType }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [mediaId, mediaType]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('media_id', mediaId)
        .eq('media_type', mediaType)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch usernames
      const userIds = [...new Set(data?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const commentsWithUsernames = data?.map(comment => ({
        ...comment,
        username: profiles?.find(p => p.user_id === comment.user_id)?.username || 'Usuário',
      })) || [];

      setComments(commentsWithUsernames);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Faça login para comentar');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Escreva um comentário');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('comments').insert({
        user_id: user.id,
        media_id: mediaId,
        media_type: mediaType,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment('');
      toast.success('Comentário adicionado!');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao adicionar comentário');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comentário removido');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Erro ao remover comentário');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h3 className="text-xl font-display text-foreground mb-6 flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-primary" />
        Comentários ({comments.length})
      </h3>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Escreva seu comentário..."
            className="mb-3 bg-background border-border"
            rows={3}
          />
          <Button type="submit" disabled={submitting}>
            <Send className="w-4 h-4 mr-2" />
            {submitting ? 'Enviando...' : 'Comentar'}
          </Button>
        </form>
      ) : (
        <p className="text-muted-foreground mb-6 p-4 bg-secondary/50 rounded-lg">
          Faça login para deixar um comentário
        </p>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Nenhum comentário ainda. Seja o primeiro!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{comment.username}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</p>
                  </div>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="mt-3 text-foreground/80">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

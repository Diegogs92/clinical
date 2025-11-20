'use client';

import { Heart } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const WEB3FORMS_ACCESS_KEY = '8776d26e-554f-4f36-902f-de28ce4e5618';

export function Footer() {
  const [commentOpen, setCommentOpen] = useState(false);
  const { user } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [thankYouVisible, setThankYouVisible] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSending(true);
    const formElement = event.target as HTMLFormElement;
    const formData = new FormData(formElement);
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', 'Comentario desde Clinical');
    const senderName = user?.displayName?.trim() || 'Usuario Clinical';
    const senderEmail = user?.email || 'dgarciasantillan@gmail.com';
    formData.append('name', senderName);
    formData.append('email', senderEmail);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error('No fue posible enviar el comentario');
      }
      setCommentOpen(false);
      setCommentText('');
      setThankYouVisible(true);
      setTimeout(() => setThankYouVisible(false), 2000);
    } catch (error) {
      console.error('Error enviando comentario:', error);
      setThankYouVisible(true);
      setTimeout(() => setThankYouVisible(false), 2000);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <footer className="mt-auto border-t border-elegant-200 dark:border-elegant-800 bg-white dark:bg-elegant-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="relative w-full flex items-center justify-center gap-4">
            <div className="absolute left-0">
              <button
                onClick={() => setCommentOpen(true)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold border border-elegant-300 dark:border-elegant-700 text-elegant-700 dark:text-elegant-300 hover:border-primary hover:text-primary dark:hover:border-primary-light dark:hover:text-primary-light transition-all duration-200"
              >
                Deja tu comentario
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-elegant-600 dark:text-elegant-400">
              <span>Creado con</span>
              <Heart className="w-4 h-4 text-red-600 dark:text-red-400 fill-current" strokeWidth={2} />
              <span>por</span>
              <span className="font-semibold text-navy-dark dark:text-pearl">DGS Solutions</span>
            </div>
          </div>
        </div>
      </footer>

      {commentOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-elegant-900 border border-elegant-200 dark:border-elegant-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-base font-semibold text-elegant-900 dark:text-white mb-2">Deja tu comentario</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                name="message"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                required
                placeholder="Escribe tu comentario aquí..."
                className="w-full border border-elegant-300 dark:border-elegant-700 rounded-lg px-3 py-2 bg-white dark:bg-elegant-950 text-sm text-elegant-900 dark:text-white placeholder-elegant-400 dark:placeholder-elegant-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCommentOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-elegant-600 dark:text-elegant-400 hover:text-elegant-900 dark:hover:text-white transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isSending
                      ? 'bg-elegant-200 dark:bg-elegant-800 text-elegant-500 dark:text-elegant-500 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary-dark text-white shadow-sm hover:shadow-md active:scale-95'
                  }`}
                >
                  {isSending ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {thankYouVisible && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-elegant-900 border border-elegant-200 dark:border-elegant-800 rounded-2xl shadow-xl px-6 py-4 animate-fade-in">
            <p className="text-sm font-semibold text-elegant-900 dark:text-white">
              Gracias por tu comentario. Nos sirve para mejorar tu experiencia.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

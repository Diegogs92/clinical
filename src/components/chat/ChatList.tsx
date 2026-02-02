import { Conversation } from '@/hooks/useChat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquarePlus, X } from 'lucide-react';

interface ChatListProps {
    conversations: Conversation[];
    loading: boolean;
    onSelectConversation: (conversation: Conversation) => void;
    onNewChat: () => void;
    onCloseConversation: (conversation: Conversation) => void;
}

export default function ChatList({ conversations, loading, onSelectConversation, onNewChat, onCloseConversation }: ChatListProps) {
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-elegant-900 rounded-t-xl">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm">
                <h3 className="font-bold text-lg text-elegant-800 dark:text-elegant-100">Chats</h3>
                <button
                    onClick={onNewChat}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-elegant-800 rounded-full text-primary dark:text-primary-light transition-colors"
                    title="Nuevo mensaje"
                >
                    <MessageSquarePlus className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        <p className="mb-2">No tienes conversaciones activas.</p>
                        <button onClick={onNewChat} className="text-primary hover:underline">
                            Iniciar una charla
                        </button>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-50 dark:divide-gray-800">
                        {conversations.map(conv => {
                            const otherUser = conv.participantProfiles?.[0];
                            const name = otherUser?.displayName || 'Usuario desconocido';
                            const lastMsg = conv.lastMessage;
                            const date = lastMsg?.createdAt ? (
                                (lastMsg.createdAt.toDate ? lastMsg.createdAt.toDate() : new Date(lastMsg.createdAt))
                            ) : null;

                            return (
                                <li
                                    key={conv.id}
                                    onClick={() => onSelectConversation(conv)}
                                    className="p-3 hover:bg-gray-50 dark:hover:bg-elegant-800 cursor-pointer transition-colors flex gap-3 items-center group"
                                >
                                    <div className="relative">
                                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-100 to-sky-200 dark:from-sky-900 dark:to-sky-800 flex items-center justify-center text-sky-700 dark:text-sky-300 font-semibold text-lg shadow-sm group-hover:shadow-md transition-shadow">
                                            {otherUser?.photoURL ? (
                                                <img src={otherUser.photoURL} alt={name} className="h-full w-full rounded-full object-cover" />
                                            ) : (
                                                name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        {/* Online indicator could go here */}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h4 className="font-semibold text-elegant-900 dark:text-elegant-50 truncate mr-2 text-sm">{name}</h4>
                                            {date && (
                                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                                    {format(date, 'HH:mm', { locale: es })}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm truncate ${lastMsg && !lastMsg.seen && lastMsg.senderId !== 'me' ? 'font-semibold text-elegant-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                            {lastMsg?.text || <span className="italic text-gray-400">Nueva conversación</span>}
                                        </p>
                                    </div>

                                    <button
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onCloseConversation(conv);
                                        }}
                                        className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all"
                                        title="Cerrar conversaci?n"
                                        aria-label="Cerrar conversaci?n"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}

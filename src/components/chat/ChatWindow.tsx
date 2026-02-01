import { useState, useRef, useEffect } from 'react';
import { Conversation, useChat, useMessages } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { Send, ArrowLeft, MoreVertical, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatWindowProps {
    conversation: Conversation;
    onBack: () => void;
    onClose: () => void;
}

export default function ChatWindow({ conversation, onBack, onClose }: ChatWindowProps) {
    const { user } = useAuth();
    const confirm = useConfirm();
    const { sendMessage, closeConversation } = useChat();
    const { messages, loadingMessages } = useMessages(conversation.id);
    const [newMessage, setNewMessage] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const otherUser = conversation.participantProfiles?.[0];
    const participantName = otherUser?.displayName || 'Usuario';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loadingMessages]);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        try {
            await sendMessage(conversation.id, newMessage);
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleCloseChat = async () => {
        setShowMenu(false);
        const shouldClose = await confirm({
            title: 'Cerrar conversación',
            description: '¿Estás seguro de que quieres cerrar esta conversación? Dejará de aparecer en tu lista de chats activos.',
            confirmText: 'Cerrar conversación',
            cancelText: 'Cancelar',
            tone: 'danger'
        });

        if (shouldClose) {
            try {
                await closeConversation(conversation.id);
                onClose(); // Close the window/widget view
                onBack(); // Go back to list if needed, or just reset logic
            } catch (error) {
                console.error("Error closing conversation", error);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-elegant-900 rounded-t-xl">
            {/* Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between shadow-sm bg-white dark:bg-elegant-900 z-10 sticky top-0 rounded-t-xl">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-1 hover:bg-gray-100 dark:hover:bg-elegant-800 rounded-full text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {otherUser?.photoURL ? (
                                <img src={otherUser.photoURL} alt={participantName} className="h-full w-full object-cover" />
                            ) : (
                                <span className="text-sm font-medium">{participantName.charAt(0)}</span>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 border-2 border-white dark:border-elegant-900 rounded-full"></div>
                    </div>

                    <div className="leading-tight">
                        <h4 className="font-semibold text-sm text-elegant-900 dark:text-elegant-50 max-w-[140px] truncate">{participantName}</h4>
                        <span className="text-xs text-green-600 dark:text-green-400">En línea</span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* Menu Options */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className={`p-1 rounded-full transition-colors ${showMenu ? 'bg-gray-100 dark:bg-elegant-800 text-elegant-900 dark:text-gray-100' : 'hover:bg-gray-100 dark:hover:bg-elegant-800 text-gray-500'}`}
                            title="Opciones"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-elegant-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                <button
                                    onClick={handleCloseChat}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Cerrar conversación
                                </button>
                            </div>
                        )}
                    </div>

                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-elegant-800 rounded-full text-primary" title="Minimizar">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-elegant-950/50">
                {loadingMessages ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.senderId === user?.uid;
                        const showAvatar = !isMe && (index === 0 || messages[index - 1].senderId !== msg.senderId);

                        return (
                            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                                    {!isMe && (
                                        <div className="w-6 h-6 flex-shrink-0">
                                            {showAvatar && (
                                                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 overflow-hidden">
                                                    {otherUser?.photoURL ? (
                                                        <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[10px]">{participantName.charAt(0)}</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div
                                        className={`px-4 py-2 rounded-2xl shadow-sm text-sm break-words ${isMe
                                            ? 'bg-primary text-white rounded-br-none'
                                            : 'bg-white dark:bg-elegant-800 text-elegant-900 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white dark:bg-elegant-900 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSend} className="flex gap-2 items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 bg-gray-100 dark:bg-elegant-800 text-elegant-900 dark:text-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:placeholder-gray-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors shadow-sm"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}

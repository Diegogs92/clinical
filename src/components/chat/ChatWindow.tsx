import { useState, useRef, useEffect } from 'react';
import { Conversation, useChat, useMessages } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { Send, ArrowLeft, MoreVertical, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatWindowProps {
    conversation: Conversation;
    onBack: () => void;
    onClose: () => void;
}

export default function ChatWindow({ conversation, onBack, onClose }: ChatWindowProps) {
    const { user } = useAuth();
    const { sendMessage } = useChat();
    const { messages, loadingMessages } = useMessages(conversation.id);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const otherUser = conversation.participantProfiles?.[0];
    const participantName = otherUser?.displayName || 'Usuario';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loadingMessages]);

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
                        <h4 className="font-semibold text-sm text-elegant-900 dark:text-elegant-50">{participantName}</h4>
                        <span className="text-xs text-green-600 dark:text-green-400">En línea</span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-elegant-800 rounded-full text-primary-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-elegant-950/50">
                {loadingMessages ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
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
                                                ? 'bg-primary-600 text-white rounded-br-none'
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
                        className="flex-1 bg-gray-100 dark:bg-elegant-800 text-elegant-900 dark:text-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:placeholder-gray-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-colors shadow-sm"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}

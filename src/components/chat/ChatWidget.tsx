"use client";

import { useState, useEffect } from 'react';
import { MessageCircle, X, ChevronDown, Minus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation, useChat } from '@/hooks/useChat';
import { UserProfile } from '@/types';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import UserSelect from './UserSelect';
import { toast } from 'sonner';

type ViewState = 'LIST' | 'CHAT' | 'NEW_CHAT';

export default function ChatWidget() {
    const { user } = useAuth();
    const { conversations, loadingConversations, createConversation } = useChat();

    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false); // If true, only show header bubble? No, usually just close.
    // Actually, standard behavior: 
    // - Closed: just the bubble icon.
    // - Open: full window.
    // - We could have a 'minimized' state but 'isOpen' covers it for now.

    const [view, setView] = useState<ViewState>('LIST');
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    // Temporary storage for a newly created conversation that hasn't synced from Firestore yet
    const [tempConversation, setTempConversation] = useState<Conversation | null>(null);

    // Determine the active conversation object
    const activeConversation =
        conversations.find(c => c.id === activeConversationId) ||
        (activeConversationId === tempConversation?.id ? tempConversation : null);

    if (!user) return null;

    const handleOpen = () => {
        setIsOpen(true);
        setView('LIST'); // Or restore last state? Reset to LIST is safer.
    };

    const handleClose = () => {
        setIsOpen(false);
        setTempConversation(null);
        setActiveConversationId(null);
        setView('LIST');
    };

    const handleSelectConversation = (conv: Conversation) => {
        setActiveConversationId(conv.id);
        setView('CHAT');
    };

    const handleNewChat = () => {
        setView('NEW_CHAT');
    };

    const handleBackToList = () => {
        setView('LIST');
        setActiveConversationId(null);
        setTempConversation(null);
    };

    const handleUserSelect = async (selectedUser: UserProfile) => {
        try {
            console.log("Creating conversation with:", selectedUser.uid);
            const convId = await createConversation(selectedUser.uid);
            console.log("Conversation created/found:", convId);

            if (convId) {
                // Optimistically set active conversation
                setActiveConversationId(convId);

                // Check if it exists in current list
                const existing = conversations.find(c => c.id === convId);
                if (!existing) {
                    // Create temp
                    setTempConversation({
                        id: convId,
                        participants: [user.uid, selectedUser.uid],
                        participantProfiles: [selectedUser],
                        updatedAt: new Date(),
                        // No last message
                    } as Conversation);
                }

                setView('CHAT');
            } else {
                toast.error("No se pudo iniciar la conversación");
            }
        } catch (error) {
            console.error("Error creating chat", error);
            toast.error("Error al iniciar el chat. Intenta nuevamente.");
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window Container */}
            <div
                className={`pointer-events-auto transition-all duration-300 ease-in-out transform origin-bottom-right
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'} 
          w-[360px] h-[550px] max-h-[80vh] bg-white dark:bg-elegant-900 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden mb-4`}
            >
                {isOpen && (
                    <>
                        {view === 'LIST' && (
                            <ChatList
                                conversations={conversations}
                                loading={loadingConversations}
                                onSelectConversation={handleSelectConversation}
                                onNewChat={handleNewChat}
                            />
                        )}

                        {view === 'NEW_CHAT' && (
                            <UserSelect
                                onSelect={handleUserSelect}
                                onCancel={handleBackToList}
                            />
                        )}

                        {view === 'CHAT' && activeConversation && (
                            <ChatWindow
                                conversation={activeConversation}
                                onBack={handleBackToList}
                                onClose={handleClose}
                            />
                        )}

                        {view === 'CHAT' && !activeConversation && (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Floating Toggle Button */}
            <button
                onClick={isOpen ? handleClose : handleOpen}
                className={`pointer-events-auto h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95
          ${isOpen
                        ? 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rotate-90'
                        : 'bg-gradient-to-tr from-primary-dark to-primary text-white hover:shadow-primary/50'
                    }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
                {!isOpen && conversations.some(c => c.lastMessage && !c.lastMessage.seen && c.lastMessage.senderId !== user.uid) && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-white dark:border-elegant-950"></span>
                )}
            </button>
        </div>
    );
}

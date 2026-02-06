"use client";

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, ChevronDown, Minus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { Conversation, useChat } from '@/hooks/useChat';
import { UserProfile } from '@/types';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import UserSelect from './UserSelect';
import { toast } from 'sonner';

type ViewState = 'LIST' | 'CHAT' | 'NEW_CHAT';

export default function ChatWidget() {
    const { user } = useAuth();
    const confirm = useConfirm();
    const { conversations, loadingConversations, createConversation, closeConversation } = useChat();

    // Sound effect
    const playNotificationSound = () => {
        try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.error("Error playing sound", e));
        } catch (error) {
            console.error("Audio error", error);
        }
    };

    // Track previous last messages to detect new ones
    const prevLastMessagesRef = useState<{ [key: string]: any }>({});

    // We can't easily use useRef for detecting *changes* in an effect without keeping track state manually.
    // Instead, let's just use an effect that runs when `conversations` changes.
    // But we need to know if the change was a *new message* vs just loading.

    useEffect(() => {
        if (loadingConversations) return;

        // This is a simplified check. A robust one would compare against a ref.
        // Let's use sessionStorage/ref to store the "last known" state?
        // Actually, useRef is perfect.
    }, [conversations, loadingConversations]);

    const lastMessagesMapRef = useRef<{ [key: string]: string }>({});

    useEffect(() => {
        if (loadingConversations) return;

        let hasNewMessage = false;

        conversations.forEach(conv => {
            if (!conv.lastMessage) return;

            const prevId = lastMessagesMapRef.current[conv.id];
            // Identify unique message by timestamp or text+timestamp. 
            // Ideally messages have IDs, but lastMessage is an object.
            // We can use createdAt.
            const currentMsgId = conv.lastMessage.createdAt?.toString() + conv.lastMessage.text;

            // If we have a previous record and it's different, AND it's not from me, AND it's not seen
            if (prevId && prevId !== currentMsgId && conv.lastMessage.senderId !== user?.uid && !conv.lastMessage.seen) {
                hasNewMessage = true;
            }

            // Update ref
            lastMessagesMapRef.current[conv.id] = currentMsgId;
        });

        if (hasNewMessage) {
            playNotificationSound();
        }
    }, [conversations, loadingConversations, user?.uid]);

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

    const handleCloseConversation = async (conversation: Conversation) => {
        const otherUser = conversation.participantProfiles?.[0];
        const name = otherUser?.displayName || 'Usuario';

        const shouldClose = await confirm({
            title: 'Cerrar conversación',
            description: `¿Estás seguro de que quieres cerrar la conversación con ${name}? Dejará de aparecer en tu lista de chats activos.`,
            confirmText: 'Cerrar conversación',
            cancelText: 'Cancelar',
            tone: 'danger'
        });

        if (!shouldClose) return;

        try {
            await closeConversation(conversation.id);
            if (activeConversationId === conversation.id) {
                handleBackToList();
            }
        } catch (error) {
            console.error("Error closing conversation", error);
            toast.error("No se pudo cerrar la conversación.");
        }
    };

    return (
        <div className="fixed bottom-24 md:bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window Container */}
            <div
                className={`pointer-events-auto transition-all duration-300 ease-in-out transform origin-bottom-right
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'} 
          w-[360px] max-w-[calc(100vw-32px)] h-[550px] max-h-[80vh] bg-white dark:bg-elegant-900 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden mb-4`}
            >
                {isOpen && (
                    <>
                        {view === 'LIST' && (
                            <ChatList
                                conversations={conversations}
                                loading={loadingConversations}
                                onSelectConversation={handleSelectConversation}
                                onNewChat={handleNewChat}
                                onCloseConversation={handleCloseConversation}
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
                className={`relative pointer-events-auto h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95
          ${isOpen
                        ? 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rotate-90'
                        : 'bg-gradient-to-tr from-primary-dark to-primary text-white hover:shadow-primary/50'
                    }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-7 h-7" />}
                {!isOpen && conversations.some(c => c.lastMessage && !c.lastMessage.seen && c.lastMessage.senderId !== user.uid) && (
                    <span className="absolute top-0 right-0 h-3.5 w-3.5 bg-red-500 rounded-full border-2 border-white dark:border-elegant-950"></span>
                )}
            </button>
        </div>
    );
}

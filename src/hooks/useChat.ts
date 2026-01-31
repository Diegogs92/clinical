import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    Timestamp,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/types';

export interface Message {
    id: string;
    text: string;
    senderId: string;
    createdAt: any; // Timestamp or Date
    seen: boolean;
}

export interface Conversation {
    id: string;
    participants: string[];
    lastMessage?: {
        text: string;
        senderId: string;
        createdAt: any;
        seen: boolean;
    };
    updatedAt: any;
    participantProfiles?: UserProfile[]; // Hydrated profiles
}

export function useChat() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loadingConversations, setLoadingConversations] = useState(true);

    // Subscribe to conversations where the current user is a participant
    useEffect(() => {
        if (!user?.uid || !db) {
            setConversations([]);
            setLoadingConversations(false);
            return;
        }

        const q = query(
            collection(db, 'conversations'),
            where('participants', 'array-contains', user.uid),
            orderBy('updatedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const convs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Conversation[];

            // Fetch profiles for all conversations
            // Optimization: Cache profiles or use a separate users listener if needed, 
            // but for now fetch unique participants
            const uniqueUserIds = Array.from(new Set(convs.flatMap(c => c.participants)));
            // Filter out current user
            const otherUserIds = uniqueUserIds.filter(uid => uid !== user.uid);

            // Fetch these users. In a real app we might want to batch this or use a cache.
            // For simplicity, we'll fetch them one by one for now (or use getUserById from lib/users)
            const { getUserById } = await import('@/lib/users');

            const profilesMap = new Map<string, UserProfile>();
            await Promise.all(otherUserIds.map(async (uid) => {
                const profile = await getUserById(uid);
                if (profile) profilesMap.set(uid, profile);
            }));

            // Attach profiles to conversations
            const enrichedConvs = convs.map(conv => {
                const otherParticipants = conv.participants
                    .filter(uid => uid !== user.uid)
                    .map(uid => profilesMap.get(uid))
                    .filter((p): p is UserProfile => !!p);

                return {
                    ...conv,
                    participantProfiles: otherParticipants
                };
            });

            setConversations(enrichedConvs);
            setLoadingConversations(false);
        }, (error) => {
            console.error("Error fetching conversations:", error);
            setLoadingConversations(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const createConversation = async (otherUserId: string) => {
        if (!user?.uid || !db) return null;

        // Check if conversation already exists (this can be optimized but keeping it simple)
        // Client-side check for now since we have the list
        const existing = conversations.find(c => c.participants.includes(otherUserId));
        if (existing) return existing.id;

        // Create new
        const newConvRef = doc(collection(db, 'conversations'));
        const conversationData = {
            participants: [user.uid, otherUserId],
            updatedAt: serverTimestamp(),
            lastMessage: null
        };

        await setDoc(newConvRef, conversationData);
        return newConvRef.id;
    };

    const sendMessage = async (conversationId: string, text: string) => {
        if (!user?.uid || !db || !text.trim()) return;

        try {
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const docRef = await addDoc(messagesRef, {
                text: text,
                senderId: user.uid,
                createdAt: serverTimestamp(),
                seen: false
            });

            // Update last message in conversation
            const convRef = doc(db, 'conversations', conversationId);
            await updateDoc(convRef, {
                lastMessage: {
                    text: text,
                    senderId: user.uid,
                    createdAt: new Date(), // Local time for specific field or serverTimestamp if consistent type needed
                    seen: false
                },
                updatedAt: serverTimestamp()
            });

            return docRef.id;
        } catch (e) {
            console.error("Error sending message", e);
            throw e;
        }
    };

    return {
        conversations,
        loadingConversations,
        createConversation,
        sendMessage
    };
}

export function useMessages(conversationId: string | null) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    useEffect(() => {
        if (!conversationId || !db) {
            setMessages([]);
            return;
        }

        setLoadingMessages(true);
        const q = query(
            collection(db, 'conversations', conversationId, 'messages'),
            orderBy('createdAt', 'asc'),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Message[];
            setMessages(msgs);
            setLoadingMessages(false);
        }, (error) => {
            console.error("Error fetching messages:", error);
            setLoadingMessages(false);
        });

        return () => unsubscribe();
    }, [conversationId]);

    return { messages, loadingMessages };
}

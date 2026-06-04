import { useEffect, useState, useRef, Fragment } from "react";
import type { Socket } from "socket.io-client";
import { API_URL } from "../../config";

type ChatPanelPros = {
    myId: string;
    chatId: string | null;                       // existing chat _id, or null for a new chat
    partnerId: string | null;                    // who we're talking to (for send + typing)
    partnerName?: string | null;
    socket?: Socket | null;
    onChatCreated?: (newChatId: string) => void; // called when first message creates a chat
};

type Message = {
    _id: string;
    chatId?: string;
    text?: string;
    message?: string;                            // legacy / optimistic shape
    sender?: { _id: string; name: string };      // new schema: denormalized embedded sender
    senderId?: { _id: string; name: string };    // legacy populated shape
    receiverId?: { _id: string; name: string };
    createdAt: string;
    updatedAt?: string;
};

// Helpers — unify access across old + new shapes
const getSenderId = (msg: Message): string =>
    msg.sender?._id || msg.senderId?._id || '';

const getText = (msg: Message): string =>
    msg.text || msg.message || '';


function ChatPanel({ myId, chatId, partnerId, partnerName, socket, onChatCreated }: ChatPanelPros) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [draft, setDraft] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [partnerTyping, setPartnerTyping] = useState(false);

    // ──────────────────────────────────────────────────────────────
    // Fetch messages when chatId changes.
    // For a brand-new chat (no chatId yet) just skip — we start empty.
    // State reset between chats is handled by the `key` prop in Dashboard (React remounts).
    // ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!chatId) return;
        let cancelled = false;
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/messages?chatId=${chatId}`, {
                    headers: {
                        "content-type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                if (!cancelled) setMessages(json.data);
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            }
        })();
        return () => { cancelled = true; };
    }, [chatId]);


    const handleSend = () => {
        if (!partnerId || !draft.trim()) return;

        const text = draft;                       // capture current value before clearing input

        const sendMessage = async () => {
            const tempId = 'temp-' + Date.now();
            const optimisticMsg: Message = {
                _id: tempId,
                chatId: chatId || undefined,
                text,
                sender: { _id: myId, name: 'me' },
                createdAt: new Date().toISOString(),
            };
            setMessages(prev => [...prev, optimisticMsg]);
            setDraft('');

            // Send both chatId (when we have one) and receiverId.
            // Backend uses chatId if present, else find-or-creates from receiverId.
            const body = {
                chatId,
                receiverId: partnerId,
                message: text,                    // backend still expects "message"
            };

            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/send-message`, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify(body),
                });
                if (res.ok) {
                    const json = await res.json();
                    const real: Message = json.data;

                    // Swap optimistic message with the real one
                    setMessages(prev => prev.map(m => m._id === tempId ? real : m));

                    // If this was a NEW chat (no chatId yet) and backend created one,
                    // notify Dashboard so it can refresh sidebar + update URL.
                    if (!chatId && real.chatId && onChatCreated) {
                        onChatCreated(real.chatId);
                    }
                } else {
                    throw new Error(`HTTP ${res.status}`);
                }
            } catch (error) {
                console.error('Send failed:', error);
                setMessages(prev => prev.filter(m => m._id !== tempId));
                alert('Failed to send');
            }
        };

        sendMessage();
    };


    // ──────────────────────────────────────────────────────────────
    // Socket: incoming messages
    // ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg: Message) => {
            // Prefer chatId match (more reliable); fall back to sender match for legacy shape.
            const matchesByChat = chatId && msg.chatId === chatId;
            const matchesBySender = !chatId && getSenderId(msg) === partnerId;
            if (matchesByChat || matchesBySender) {
                setMessages(prev => [...prev, msg]);
            }
        };

        socket.on('new-message', handleNewMessage);
        return () => { socket.off('new-message', handleNewMessage); };
    }, [socket, chatId, partnerId]);


    // Auto-scroll to bottom on new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    // ──────────────────────────────────────────────────────────────
    // Typing indicator
    // ──────────────────────────────────────────────────────────────
    const handleTyping = () => {
        if (!socket || !partnerId) return;
        socket.emit('typing', { to: partnerId, from: myId });
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => {
            socket.emit('stop-typing', { to: partnerId, from: myId });
        }, 1500);
    };

    useEffect(() => {
        if (!socket) return;
        const onTyping = ({ from }: { from: string }) => {
            if (from === partnerId) setPartnerTyping(true);
        };
        const onStopTyping = ({ from }: { from: string }) => {
            if (from === partnerId) setPartnerTyping(false);
        };
        socket.on('typing', onTyping);
        socket.on('stop-typing', onStopTyping);
        return () => {
            socket.off('typing', onTyping);
            socket.off('stop-typing', onStopTyping);
        };
    }, [socket, partnerId]);


    // ──────────────────────────────────────────────────────────────
    // Render
    // ──────────────────────────────────────────────────────────────

    // Empty state — nothing selected (no chat, no new-chat partner)
    if (!partnerId) {
        return <div className="chat-empty">Select a chat — or click + to start a new one.</div>;
    }

    return (
        <>
            <div className="chat-header">
                <div className="chat-avatar">{partnerName?.[0]?.toUpperCase()}</div>
                <div className="chat-header-info">
                    <span className="chat-header-name">{partnerName}</span>
                    <span className="chat-header-status">
                        {partnerTyping ? 'typing…' : 'online'}
                    </span>
                </div>
            </div>

            <div className="chat-messages">
                {messages.map((msg) => {
                    const isMine = getSenderId(msg) === myId;
                    const time = new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit', minute: '2-digit',
                    });
                    return (
                        <Fragment key={msg._id}>
                            <div className={isMine ? 'chat-bubble sent' : 'chat-bubble received'}>
                                {getText(msg)}
                            </div>
                            <span className={isMine ? 'chat-time sent' : 'chat-time received'}>
                                {time}
                            </span>
                        </Fragment>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <div className="chat-input-row">
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Type a message…"
                    value={draft}
                    onChange={(e) => {
                        setDraft(e.target.value);
                        handleTyping();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                    }}
                />
                <button
                    type="button"
                    className="chat-send-btn"
                    onClick={handleSend}
                    disabled={!draft.trim()}
                >
                    ➤
                </button>
            </div>
        </>
    );
}

export default ChatPanel;

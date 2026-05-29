import { useEffect, useState, useRef, Fragment } from "react";
import type { Socket } from "socket.io-client";

type ChatPanelPros = {
    myId: string;
    partnerId: string | null;
    socket?: Socket | null;
    partnerName?: string | null;
};

type Message = {
    _id: string;
    message: string;
    senderId: {
        _id: string;
        name: string;
    };
    receiverId: {
        _id: string;
        name: string;
    };
    createdAt: string;
    updatedAt?: string
};

function ChatPanel({ myId, partnerId, socket, partnerName }: ChatPanelPros) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [draft, setDraft] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null)
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [partnerTyping, setPartnerTyping] = useState(false)




    useEffect(() => {
        if (!partnerId) return
        const fetchMessages = async () => {
            try {
                const res = await fetch(
                    `http://localhost:3000/get-messages?senderId=${myId}&receiverId=${partnerId}`,
                    {
                        method: "GET",
                        headers: {
                            "content-type": "application/json",
                        },
                    },
                );
                if (res.ok) {
                    const json = await res.json();
                    console.log(`Backend returned api ${json}`);
                    setMessages(json.data);
                }
            } catch (error) {
                console.log(`error fetching messages ${error}`);
            }
        };

        fetchMessages();
    }, [partnerId, myId]);

    console.log(`partner id : ${partnerId}`);

    const handleSend = () => {
        if (!partnerId || !draft.trim()) return

        const sendMessage = async () => {

            const tempId = 'temp-' + Date.now()        // e.g. 'temp-1730473200000'
            const optimisticMsg = {
                _id: tempId,                              // ← fake local ID
                message: draft,
                senderId: { _id: myId, name: 'me' },
                receiverId: { _id: partnerId, name: '' },
                createdAt: new Date().toISOString(),

            }
            setMessages(prev => [...prev, optimisticMsg])
            setDraft('')
            const body = {
                senderId: myId,
                receiverId: partnerId,
                message: draft,
            };

            try {
                const res = await fetch("http://localhost:3000/send-message", {
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                    },
                    body: JSON.stringify(body),
                });
                if (res.ok) {
                    const json = await res.json();
                    console.log(`api res : ${json.data}`);
                    setMessages(prev =>
                        prev.map(m => m._id === tempId ? json.data : m)
                        //              ↑ find the temp      ↑ swap in real
                    )

                }
            } catch (error) {
                console.log(`error ${error}`);
                setMessages(prev => prev.filter(m => m._id !== tempId))
                alert('Failed to send')
            }
        };

        sendMessage();
    };



    useEffect(() => {
        if (!socket) return;

        // handler for incoming messages
        const handleNewMessage = (msg: Message) => {
            if (msg.senderId._id === partnerId) {
                setMessages(prev => [...prev, msg])
            }

        }

        socket.on('new-message', handleNewMessage)
        return () => {
            socket.off('new-message', handleNewMessage)
        }

    }, [socket, partnerId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleTyping = () => {
        if (!socket || !partnerId) return;

        socket.emit('typing', { to: partnerId, from: myId });

        // reset the "stopped typing" timer
        if (typingTimeout.current) clearTimeout(typingTimeout.current)
        typingTimeout.current = setTimeout(() => {
            socket.emit('stop-typing', { to: partnerId, from: myId })
        }, 1500)
    }
    useEffect(() => {
        if (!socket) return

        const onTyping = ({ from }: { from: string }) => {
            if (from === partnerId) setPartnerTyping(true)
        }
        const onStopTyping = ({ from }: { from: string }) => {
            if (from === partnerId) setPartnerTyping(false)
        }

        socket.on('typing', onTyping)
        socket.on('stop-typing', onStopTyping)

        return () => {
            socket.off('typing', onTyping)
            socket.off('stop-typing', onStopTyping)
        }
    }, [socket, partnerId])


    if (!partnerId) {
        return <div className="chat-empty">Select a user to start chatting</div>;
    }
    return (
        <>
            {/* HEADER — partner info */}
            <div className="chat-header">
                <div className="chat-avatar">{partnerName?.[0]?.toUpperCase()}</div>
                <div className="chat-header-info">
                    <span className="chat-header-name">{partnerName}</span>
                    <span className="chat-header-status">
                        {partnerTyping ? 'typing…' : 'online'}
                    </span>

                </div>
            </div>

            {/* MESSAGES — scrollable list of bubbles.
            YOU will replace these placeholders with .map() over real messages */}
            <div className="chat-messages">
                {messages.map((msg) => {
                    const isMine = msg.senderId._id === myId
                    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    return (
                        <Fragment key={msg._id}>
                            <div className={isMine ? 'chat-bubble sent' : 'chat-bubble received'}>
                                {msg.message}
                            </div>
                            <span className={isMine ? 'chat-time sent' : 'chat-time received'}>
                                {time}
                            </span>
                        </Fragment>
                    )
                })}


                <div ref={bottomRef} />        {/* ← invisible scroll anchor */}
            </div>

            {/* INPUT — pinned to bottom */}
            <div className="chat-input-row">
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Type a message…"
                    value={draft}
                    onChange={(e) => {
                        setDraft(e.target.value)
                        handleTyping();

                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            handleSend(); // run the same code as the Send button
                        }
                    }}
                />
                <button
                    type="button"
                    className="chat-send-btn"
                    onClick={() => {
                        handleSend();
                    }}
                    disabled={!draft.trim()}
                >
                    ➤
                </button>
            </div>
        </>
    );
}

export default ChatPanel;

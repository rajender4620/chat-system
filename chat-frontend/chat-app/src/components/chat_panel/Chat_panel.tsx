import { useEffect, useState } from "react";

type ChatPanelPros = {
    myId: string;
    partnerId: string | null;
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

function ChatPanel({ myId, partnerId }: ChatPanelPros) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [draft, setDraft] = useState("");

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch(
                    "http://localhost:3000/get-messages?senderId=6a1405b5952966f9ab934586&receiverId=6a1405c9952966f9ab93469d",
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
                senderId: "6a1405b5952966f9ab934586",
                receiverId: "6a1405c9952966f9ab93469d",
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

    if (!partnerId) {
        return <div className="chat-empty">Select a user to start chatting</div>;
    }
    return (
        <>
            {/* HEADER — partner info */}
            <div className="chat-header">
                <div className="chat-avatar">B</div>
                <div className="chat-header-info">
                    <span className="chat-header-name">Bob (placeholder)</span>
                    <span className="chat-header-status">online</span>
                </div>
            </div>

            {/* MESSAGES — scrollable list of bubbles.
            YOU will replace these placeholders with .map() over real messages */}
            <div className="chat-messages">
                {messages.length !== 0 &&
                    messages.map((msg) => {
                        const isMine = msg.senderId._id === "6a1405b5952966f9ab934586";
                        console.log();
                        return (
                            <div
                                key={msg._id}
                                className={isMine ? "chat-bubble sent" : "chat-bubble received"}
                            >
                                {msg.message}
                            </div>
                        );
                    })}
            </div>

            {/* INPUT — pinned to bottom */}
            <div className="chat-input-row">
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Type a message…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
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

import React, { useState } from "react";
import { chatAPI } from "../services/api";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(input);
      setMessages([...newMessages, { role: "assistant", content: response.data.reply }]);
    } catch (err) {
      console.error("Error:", err);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "⚠️ Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2 bg-gray-100 rounded">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center text-sm mt-4">
            👋 Hi! Ask me anything about the alumni network.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`my-2 p-2 rounded-lg max-w-[75%] ${
              m.role === "user"
                ? "ml-auto bg-blue-500 text-white"
                : "mr-auto bg-gray-300 text-black"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <p className="italic text-gray-500">Bot is typing...</p>}
      </div>
      <div className="flex mt-2 gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border rounded-lg p-2 text-sm"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Send message"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

export default Chat;

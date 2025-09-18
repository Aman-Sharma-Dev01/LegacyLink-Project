import React, { useState } from "react";
import { API_URL } from "../services/api";

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
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error("Error:", err);
      setMessages([
        ...newMessages,
        { role: "assistant", content: "⚠️ Something went wrong" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-2 bg-gray-100 rounded">
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
          placeholder="Type..."
          className="flex-1 border rounded-lg p-2"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

export default Chat;

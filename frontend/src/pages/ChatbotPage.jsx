import React from "react";
import Chat from "../components/Chat";

function ChatbotPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-2xl font-bold mb-4">💬 Alumni Chatbot</h1>
      <Chat />
    </div>
  );
}

export default ChatbotPage;

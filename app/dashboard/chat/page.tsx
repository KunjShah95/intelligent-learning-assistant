import { ChatWindow } from '@/components/chat/chat-window';

export default function ChatPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ask me anything</h1>
        <p className="text-gray-600">Stuck on a problem? Curious about a concept? Just ask.</p>
      </div>
      <ChatWindow />
    </div>
  );
}
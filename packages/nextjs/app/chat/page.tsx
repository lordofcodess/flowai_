"use client";

import { Suspense } from "react";
import ChatInterface from "../../components/chat/ChatInterface";
import { ChatLayout } from "./_components/ChatLayout";
import { ChatLoading } from "./_components/ChatLoading";

export default function ChatPage() {
  return (
    <ChatLayout>
      <Suspense fallback={<ChatLoading />}>
        <ChatInterface />
      </Suspense>
    </ChatLayout>
  );
}

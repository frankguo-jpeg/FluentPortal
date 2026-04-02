"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage, TypingIndicator } from "@/components/chat-message";
import { ChatWelcome } from "@/components/chat-welcome";
import { ChatInput } from "@/components/chat-input";

interface UploadedFile {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

interface ToolCall {
  tool: string;
  success: boolean;
  data?: Record<string, unknown>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isStreaming]);

  const sendMessage = useCallback(async (content: string, attachments: UploadedFile[]) => {
    if (isLoading || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      });

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: "assistant", content: "Sorry, I encountered an error. Please try again." },
        ]);
        setIsLoading(false);
        return;
      }

      const contentType = res.headers.get("content-type") || "";

      if (contentType.includes("text/event-stream")) {
        // Streaming response
        setIsLoading(false);
        setIsStreaming(true);

        const assistantId = (Date.now() + 1).toString();
        const collectedToolCalls: ToolCall[] = [];

        // Add empty assistant message
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "", toolCalls: undefined },
        ]);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const event = JSON.parse(jsonStr);

              if (event.type === "text") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + event.content }
                      : m
                  )
                );
              } else if (event.type === "tool_result") {
                collectedToolCalls.push({
                  tool: event.tool,
                  success: event.success,
                  data: event.data,
                });
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, toolCalls: [...collectedToolCalls] }
                      : m
                  )
                );
              } else if (event.type === "error") {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content || "Sorry, an error occurred." }
                      : m
                  )
                );
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }

        setIsStreaming(false);
      } else {
        // Non-streaming JSON response (fallback for tool-use-only paths)
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.content,
            toolCalls: data.toolCalls,
          },
        ]);
        setIsLoading(false);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: "Network error. Please check your connection and try again." },
      ]);
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [messages, isLoading, isStreaming]);

  function handlePromptSelect(prompt: string) {
    sendMessage(prompt, []);
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 flex items-center gap-3 border-b border-slate-200 bg-white">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #4a90d9 0%, #2d6cb5 100%)" }}>
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-900">AI Assistant</h1>
          <p className="text-xs text-slate-400">Submit updates, explore insights, ask anything</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            New chat
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <ChatWelcome onSelect={handlePromptSelect} />
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-6">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                toolCalls={msg.toolCalls}
              />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 max-w-3xl mx-auto w-full">
        <ChatInput onSend={sendMessage} disabled={isLoading || isStreaming} />
      </div>
    </div>
  );
}

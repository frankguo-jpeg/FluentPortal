"use client";

interface ToolCall {
  tool: string;
  success: boolean;
  data?: Record<string, unknown>;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

function formatContent(text: string) {
  // Simple markdown-like formatting
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    // Bold
    let formatted: React.ReactNode = line;
    const boldParts = line.split(/\*\*(.*?)\*\*/g);
    if (boldParts.length > 1) {
      formatted = boldParts.map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );
    }

    // Bullet points
    if (line.match(/^[-•]\s/)) {
      elements.push(
        <div key={i} className="flex gap-2 ml-1">
          <span className="text-slate-400 mt-0.5">•</span>
          <span>{typeof formatted === "string" ? formatted.replace(/^[-•]\s/, "") : formatted}</span>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(<div key={i}>{formatted}</div>);
    }
  });

  return elements;
}

function UpdateConfirmCard({ toolCall }: { toolCall: ToolCall }) {
  if (toolCall.tool !== "submit_weekly_update") return null;

  if (toolCall.success) {
    return (
      <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="text-sm font-semibold text-green-800">Update Submitted Successfully</span>
        </div>
        {toolCall.data?.weekNumber && (
          <p className="text-xs text-green-700">
            Week {String(toolCall.data.weekNumber)}, {String(toolCall.data.year)} — <a href="/updates" className="underline hover:no-underline">View updates</a>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <span className="text-sm font-semibold text-red-800">Submission Failed</span>
      </div>
      {toolCall.data?.error && (
        <p className="text-xs text-red-700 mt-1">{String(toolCall.data.error)}</p>
      )}
    </div>
  );
}

export function ChatMessage({ role, content, toolCalls }: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[720px] bg-blue-600 text-white rounded-2xl rounded-br-sm px-5 py-3 text-sm leading-relaxed">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-3 mb-4">
      <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-1" style={{ background: "linear-gradient(135deg, #4a90d9 0%, #2d6cb5 100%)" }}>
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
        </svg>
      </div>
      <div className="max-w-[720px]">
        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-5 py-3 text-sm text-slate-800 leading-relaxed shadow-sm">
          {formatContent(content)}
        </div>
        {toolCalls?.map((tc, i) => (
          <UpdateConfirmCard key={i} toolCall={tc} />
        ))}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start gap-3 mb-4">
      <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center mt-1" style={{ background: "linear-gradient(135deg, #4a90d9 0%, #2d6cb5 100%)" }}>
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
        </svg>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
}

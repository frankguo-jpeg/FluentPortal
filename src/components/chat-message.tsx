"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

function UpdateConfirmCard({ toolCall }: { toolCall: ToolCall }) {
  const isUpdate = toolCall.tool === "submit_weekly_update" || toolCall.tool === "edit_weekly_update";
  if (!isUpdate) return null;

  const isEdit = toolCall.tool === "edit_weekly_update";

  if (toolCall.success) {
    return (
      <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="text-sm font-semibold text-green-800">
            {isEdit ? "Update Edited Successfully" : "Update Submitted Successfully"}
          </span>
        </div>
        {"weekNumber" in (toolCall.data ?? {}) ? (
          <p className="text-xs text-green-700">
            Week {String(toolCall.data?.weekNumber)}, {String(toolCall.data?.year)} — <a href="/updates" className="underline hover:no-underline">View updates</a>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
        </svg>
        <span className="text-sm font-semibold text-red-800">
          {isEdit ? "Edit Failed" : "Submission Failed"}
        </span>
      </div>
      {"error" in (toolCall.data ?? {}) ? (
        <p className="text-xs text-red-700 mt-1">{String(toolCall.data?.error)}</p>
      ) : null}
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
          {content ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-lg font-bold mt-3 mb-2 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-1.5 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-1 first:mt-0">{children}</h3>,
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                em: ({ children }) => <em className="italic">{children}</em>,
                a: ({ href, children }) => (
                  <a href={href} className="text-blue-600 underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                code: ({ className, children }) => {
                  const isInline = !className;
                  if (isInline) {
                    return <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>;
                  }
                  return (
                    <code className="block bg-slate-900 text-slate-100 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2">
                      {children}
                    </code>
                  );
                },
                pre: ({ children }) => <pre className="my-2">{children}</pre>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-3 border-blue-300 pl-3 my-2 text-slate-600 italic">{children}</blockquote>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full text-xs border-collapse">{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="border border-slate-300 bg-slate-50 px-2 py-1 text-left font-semibold">{children}</th>,
                td: ({ children }) => <td className="border border-slate-300 px-2 py-1">{children}</td>,
                hr: () => <hr className="my-3 border-slate-200" />,
              }}
            >
              {content}
            </ReactMarkdown>
          ) : (
            <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse rounded-sm" />
          )}
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

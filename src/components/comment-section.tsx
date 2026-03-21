"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; role: string };
  _optimistic?: boolean;
  _failed?: boolean;
}

export function CommentSection({ updateId }: { updateId: string }) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/comments?updateId=${updateId}`)
      .then((r) => r.json())
      .then(setComments);
  }, [updateId]);

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || loading) return;

    const commentText = newComment.trim();
    const tempId = `temp-${Date.now()}`;

    // Optimistically add the comment
    const optimisticComment: Comment = {
      id: tempId,
      content: commentText,
      createdAt: new Date().toISOString(),
      user: {
        id: session?.user?.id || "",
        name: session?.user?.name || "You",
        role: session?.user?.role || "COMPANY_ADMIN",
      },
      _optimistic: true,
    };

    setComments((prev) => [...prev, optimisticComment]);
    setNewComment("");
    setLoading(true);

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateId, content: commentText }),
      });

      if (res.ok) {
        const comment = await res.json();
        // Replace optimistic comment with real one
        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? comment : c))
        );
      } else {
        // Mark as failed
        setComments((prev) =>
          prev.map((c) =>
            c.id === tempId ? { ...c, _optimistic: false, _failed: true } : c
          )
        );
      }
    } catch {
      // Mark as failed on network error
      setComments((prev) =>
        prev.map((c) =>
          c.id === tempId ? { ...c, _optimistic: false, _failed: true } : c
        )
      );
    }
    setLoading(false);
  }

  async function retryComment(failedComment: Comment) {
    const tempId = failedComment.id;

    // Reset to optimistic state
    setComments((prev) =>
      prev.map((c) =>
        c.id === tempId ? { ...c, _optimistic: true, _failed: false } : c
      )
    );

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateId, content: failedComment.content }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) =>
          prev.map((c) => (c.id === tempId ? comment : c))
        );
      } else {
        setComments((prev) =>
          prev.map((c) =>
            c.id === tempId ? { ...c, _optimistic: false, _failed: true } : c
          )
        );
      }
    } catch {
      setComments((prev) =>
        prev.map((c) =>
          c.id === tempId ? { ...c, _optimistic: false, _failed: true } : c
        )
      );
    }
  }

  function dismissFailed(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  async function deleteComment(id: string) {
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
  }

  return (
    <div className="space-y-5">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        Comments ({comments.filter((c) => !c._failed).length})
      </h3>

      {comments.length === 0 && (
        <p className="text-sm text-slate-400">No comments yet. Be the first to share your thoughts.</p>
      )}

      <div className="space-y-3">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`bg-slate-50/80 rounded-xl p-4 animate-fade-in ${
              comment._optimistic ? "opacity-60" : ""
            } ${comment._failed ? "border border-red-200 bg-red-50/50" : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                  {comment.user.name.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-slate-800">{comment.user.name}</span>
                {comment.user.role === "MANAGER" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-medium">Manager</span>
                )}
                {comment._optimistic && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-500 font-medium">Sending...</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {comment._failed ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-red-500">Failed to send</span>
                    <button
                      onClick={() => retryComment(comment)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => dismissFailed(comment.id)}
                      className="text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-[11px] text-slate-400">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                    {session?.user.id === comment.user.id && !comment._optimistic && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed pl-[38px]">{comment.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submitComment} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="input flex-1"
        />
        <button
          type="submit"
          disabled={loading || !newComment.trim()}
          className="btn-primary disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; role: string };
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
    setLoading(true);

    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updateId, content: newComment }),
    });

    if (res.ok) {
      const comment = await res.json();
      setComments((prev) => [...prev, comment]);
      setNewComment("");
    }
    setLoading(false);
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
        Comments ({comments.length})
      </h3>

      {comments.length === 0 && (
        <p className="text-sm text-slate-400">No comments yet. Be the first to share your thoughts.</p>
      )}

      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-slate-50/80 rounded-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold">
                  {comment.user.name.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-slate-800">{comment.user.name}</span>
                {comment.user.role === "MANAGER" && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-medium">Manager</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                {session?.user.id === comment.user.id && (
                  <button
                    onClick={() => deleteComment(comment.id)}
                    className="text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
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

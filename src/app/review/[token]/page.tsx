"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface ReviewData {
  instanceName: string;
  chunkIndex: number;
  totalChunks: number;
  keyPoints: string[];
  recallQuestions: string[];
  sentAt: string;
}

function FlipCard({ question, index }: { question: string; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const parts = question.split("|||");
  const q = parts[0]?.trim() || question;
  const a = parts[1]?.trim() || "Check your notes for the answer.";

  return (
    <div
      onClick={() => setFlipped(!flipped)}
      className="cursor-pointer bg-white rounded-xl border border-gray-100 p-5 transition-all hover:border-brand-500 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <span className="text-xs font-medium text-gray-300 mt-0.5 flex-shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="flex-1">
          <p className="text-sm text-gray-900 mb-2">{q}</p>
          {flipped ? (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-brand-600 font-medium mb-1">Answer</p>
              <p className="text-sm text-gray-600">{a}</p>
            </div>
          ) : (
            <p className="text-xs text-gray-300">Tap to reveal answer</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await fetch(`/api/review/${params.token}`);
        if (!res.ok) {
          setError("This review session could not be found or has expired.");
          setLoading(false);
          return;
        }
        const d = await res.json();
        setData(d);
      } catch {
        setError("Something went wrong loading this review.");
      }
      setLoading(false);
    };
    fetchReview();
  }, [params.token]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading your review...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-brand-500 hover:text-brand-600"
          >
            Back to dashboard
          </button>
        </div>
      </main>
    );
  }

  const progress = Math.round(((data.chunkIndex + 1) / data.totalChunks) * 100);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-10">

        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Dashboard
          </button>
        </div>

        <div className="mb-6">
          <h1 className="text-lg font-medium text-gray-900 mb-1">{data.instanceName}</h1>
          <p className="text-sm text-gray-400">
            Section {data.chunkIndex + 1} of {data.totalChunks} · {progress}% through your material
          </p>
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full"
              style={{ width: `${Math.max(2, progress)}%` }}
            />
          </div>
        </div>

        {data.keyPoints.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
              Key points
            </p>
            <div className="space-y-2">
              {data.keyPoints.map((point, i) => (
                <div key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-brand-500 flex-shrink-0">·</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.recallQuestions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
              Test yourself
            </p>
            <div className="space-y-3">
              {data.recallQuestions.map((q, i) => (
                <FlipCard key={i} question={q} index={i} />
              ))}
            </div>
            <p className="text-xs text-gray-300 text-center mt-4">
              Tap each card to reveal the answer
            </p>
          </div>
        )}

      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function NewInstancePage() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "upload" | "processing" | "done">("details");
  const [name, setName] = useState("");
  const [type, setType] = useState<"STUDY" | "BOOK" | "CUSTOM">("STUDY");
  const [cadenceDays, setCadenceDays] = useState(1);
  const [sendTime, setSendTime] = useState("07:00");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ totalChunks: number; name: string } | null>(null);

  const handleSubmit = async () => {
    if (!file || !name) {
      setError("Please fill in all fields and select a PDF.");
      return;
    }

    setStep("processing");
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("type", type);
      formData.append("userId", user.id);
      formData.append("cadenceDays", cadenceDays.toString());
      formData.append("sendTime", sendTime);
      formData.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed. Please try again.");
        setStep("upload");
        return;
      }

      setResult({ totalChunks: data.instance.totalChunks, name: data.instance.name });
      setStep("done");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("upload");
    }
  };

  const cadenceLabel = (days: number) => {
    if (days === 1) return "Daily";
    if (days === 7) return "Weekly";
    return `Every ${days} days`;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-lg font-medium text-gray-900">New instance</h1>
        </div>

        {step === "done" ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 11l5 5 9-9" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-base font-medium text-gray-900 mb-1">{result?.name} is ready</p>
            <p className="text-sm text-gray-500 mb-6">
              Your notes have been split into {result?.totalChunks} sections.
              Your first digest will arrive at {sendTime} tomorrow.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Back to dashboard
            </button>
          </div>
        ) : step === "processing" ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 3v4M11 15v4M3 11h4M15 11h4" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-base font-medium text-gray-900 mb-1">Processing your PDF</p>
            <p className="text-sm text-gray-500">
              Parsing and segmenting your notes. This takes about 15 seconds.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Name */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instance name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Corporate Law, Zero to One"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {/* Type */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["STUDY", "BOOK", "CUSTOM"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`py-2 text-sm rounded-lg border transition-colors ${
                      type === t
                        ? "bg-brand-50 border-brand-500 text-brand-600 font-medium"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Cadence */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Digest cadence — <span className="text-brand-500">{cadenceLabel(cadenceDays)}</span>
              </label>
              <input
                type="range"
                min={1}
                max={7}
                step={1}
                value={cadenceDays}
                onChange={(e) => setCadenceDays(parseInt(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Daily</span>
                <span>Weekly</span>
              </div>
            </div>

            {/* Send time */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send time
              </label>
              <input
                type="time"
                value={sendTime}
                onChange={(e) => setSendTime(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* PDF Upload */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Upload PDF
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-brand-500 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-brand-600">{file.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {(file.size / 1024 / 1024).toFixed(1)} MB · Click to change
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Click to upload PDF</p>
                    <p className="text-xs text-gray-300 mt-1">Max 20MB</p>
                  </div>
                )}
              </label>
            </div>

            {error && (
              <p className="text-sm text-red-500 px-1">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!name || !file}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create instance
            </button>

          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

type SourceType = "PDF" | "DOCX" | "TEXT";

export default function NewInstancePage() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "processing" | "done">("details");
  const [name, setName] = useState("");
  const [type, setType] = useState<"STUDY" | "BOOK" | "CUSTOM">("STUDY");
  const [sourceType, setSourceType] = useState<SourceType>("PDF");
  const [cadenceDays, setCadenceDays] = useState(1);
  const [sendTime, setSendTime] = useState("07:00");
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ totalChunks: number; name: string } | null>(null);

  const handleSubmit = async () => {
    if (!name) { setError("Please enter a name."); return; }
    if ((sourceType === "PDF" || sourceType === "DOCX") && !file) { setError("Please select a file."); return; }
    if (sourceType === "TEXT" && pasteText.trim().length < 100) { setError("Please paste at least 100 characters."); return; }

    setStep("processing");
    setError("");

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/login"); return; }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("type", type);
      formData.append("userId", session.user.id);
      formData.append("cadenceDays", cadenceDays.toString());
      formData.append("sendTime", sendTime);
      formData.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);
      formData.append("sourceType", sourceType);

      if (sourceType === "TEXT") {
        formData.append("text", pasteText);
      } else if (file) {
        formData.append("file", file);
      }

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) { setError(data.error || "Upload failed."); setStep("details"); return; }

      setResult({ totalChunks: data.instance.totalChunks, name: data.instance.name });
      setStep("done");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("details");
    }
  };

  const cadenceLabel = (days: number) => days === 1 ? "Daily" : days === 7 ? "Weekly" : `Every ${days} days`;
  const acceptedTypes = sourceType === "PDF" ? ".pdf" : ".docx,.doc";
  const canSubmit = name && (sourceType === "TEXT" ? pasteText.length >= 100 : !!file);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => router.push("/dashboard")} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Back</button>
          <h1 className="text-lg font-medium text-gray-900">New instance</h1>
        </div>

        {step === "done" ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 11l5 5 9-9" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-base font-medium text-gray-900 mb-1">{result?.name} is ready</p>
            <p className="text-sm text-gray-500 mb-6">Split into {result?.totalChunks} sections. First digest at {sendTime} tomorrow.</p>
            <button onClick={() => router.push("/dashboard")} className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors">Back to dashboard</button>
          </div>
        ) : step === "processing" ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3v4M11 15v4M3 11h4M15 11h4" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round"/></svg>
            </div>
            <p className="text-base font-medium text-gray-900 mb-1">Processing your content</p>
            <p className="text-sm text-gray-500">Parsing and segmenting. About 15 seconds.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Instance name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Corporate Law, Zero to One" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(["STUDY", "BOOK", "CUSTOM"] as const).map((t) => (
                  <button key={t} onClick={() => setType(t)} className={`py-2 text-sm rounded-lg border transition-colors ${type === t ? "bg-brand-50 border-brand-500 text-brand-600 font-medium" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">Content source</label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(["PDF", "DOCX", "TEXT"] as const).map((s) => (
                  <button key={s} onClick={() => { setSourceType(s); setFile(null); }} className={`py-2 text-sm rounded-lg border transition-colors ${sourceType === s ? "bg-brand-50 border-brand-500 text-brand-600 font-medium" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    {s === "TEXT" ? "Paste text" : s}
                  </button>
                ))}
              </div>
              {sourceType === "TEXT" ? (
                <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Paste your notes here..." rows={8} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none" />
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-brand-500 transition-colors">
                  <input type="file" accept={acceptedTypes} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                  {file ? (
                    <div className="text-center"><p className="text-sm font-medium text-brand-600">{file.name}</p><p className="text-xs text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB · Click to change</p></div>
                  ) : (
                    <div className="text-center"><p className="text-sm text-gray-400">Click to upload {sourceType}</p><p className="text-xs text-gray-300 mt-1">Max 20MB</p></div>
                  )}
                </label>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-3">Cadence — <span className="text-brand-500">{cadenceLabel(cadenceDays)}</span></label>
              <input type="range" min={1} max={7} step={1} value={cadenceDays} onChange={(e) => setCadenceDays(parseInt(e.target.value))} className="w-full accent-brand-500" />
              <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Daily</span><span>Weekly</span></div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Send time</label>
              <input type="time" value={sendTime} onChange={(e) => setSendTime(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>

            {error && <p className="text-sm text-red-500 px-1">{error}</p>}

            <button onClick={handleSubmit} disabled={!canSubmit} className="w-full py-3 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Create instance
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Instance {
  id: string;
  name: string;
  type: string;
  sourceType: string;
  cursorIndex: number;
  totalChunks: number;
  isActive: boolean;
  cadenceDays: number;
  lastSentAt: string | null;
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-brand-500 rounded-full transition-all"
        style={{ width: `${Math.max(2, value)}%` }}
      />
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    STUDY: "bg-brand-50 text-brand-600",
    BOOK: "bg-amber-50 text-amber-700",
    CUSTOM: "bg-purple-50 text-purple-700"
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[type] || styles.CUSTOM}`}>
      {type.charAt(0) + type.slice(1).toLowerCase()}
    </span>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-brand-500" : "bg-gray-200"}`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${checked ? "left-4.5" : "left-0.5"}`}
        style={{ left: checked ? "18px" : "2px" }}
      />
    </button>
  );
}

export default function DashboardPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      await fetchInstances(user.id);
      setLoading(false);
    };
    init();
  }, [router]);

  const fetchInstances = async (userId: string) => {
    const res = await fetch(`/api/instances?userId=${userId}`);
    if (res.ok) {
      const data = await res.json();
      setInstances(data.instances);
    }
  };

  const toggleInstance = async (instanceId: string, currentState: boolean) => {
    setInstances((prev) =>
      prev.map((i) => i.id === instanceId ? { ...i, isActive: !currentState } : i)
    );
    await fetch("/api/instances/toggle", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ instanceId, isActive: !currentState })
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const progressPercent = (instance: Instance) => {
    if (instance.totalChunks === 0) return 0;
    return Math.round((instance.cursorIndex / instance.totalChunks) * 100);
  };

  const daysLeft = (instance: Instance) => {
    const remaining = instance.totalChunks - instance.cursorIndex;
    const days = remaining * instance.cadenceDays;
    if (days === 0) return "Complete — restarting";
    if (days === 1) return "1 day left";
    return `~${days} days left`;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-400">Loading...</p>
      </main>
    );
  }

  const activeCount = instances.filter((i) => i.isActive).length;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-medium text-gray-900">
              Re<span className="text-brand-500">call</span>
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Active instances", value: activeCount },
            { label: "Total instances", value: instances.length },
            { label: "Next digest", value: "7:00 AM" }
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className="text-xl font-medium text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Instance cards */}
        <div className="space-y-3 mb-4">
          {instances.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
              <p className="text-sm text-gray-400 mb-1">No instances yet</p>
              <p className="text-xs text-gray-300">Upload your first set of notes below</p>
            </div>
          ) : (
            instances.map((instance) => (
              <div
                key={instance.id}
                className={`bg-white rounded-xl border border-gray-100 p-4 transition-opacity ${!instance.isActive ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TypeBadge type={instance.type} />
                  </div>
                  <Toggle
                    checked={instance.isActive}
                    onChange={() => toggleInstance(instance.id, instance.isActive)}
                  />
                </div>

                <p className="text-sm font-medium text-gray-900 mb-1">{instance.name}</p>
                <p className="text-xs text-gray-400 mb-3">
                  {instance.sourceType === "PDF" ? "PDF upload" : instance.sourceType} ·{" "}
                  {instance.cadenceDays === 1 ? "Daily" : `Every ${instance.cadenceDays} days`}
                </p>

                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{progressPercent(instance)}%</span>
                  </div>
                  <ProgressBar value={progressPercent(instance)} />
                </div>

                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>{instance.isActive ? "Active" : "Paused"}</span>
                  <span>{daysLeft(instance)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add new instance button */}
        <button
          onClick={() => router.push("/dashboard/new")}
          className="w-full py-3 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
        >
          + Add instance — upload PDF or connect Notion
        </button>

      </div>
    </main>
  );
}

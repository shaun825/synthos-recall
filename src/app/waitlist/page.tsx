export default function WaitlistPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-medium text-gray-900 mb-2">
          Re<span className="text-brand-500">call</span>
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Recall is currently in private access. We&apos;ll be opening to new users soon.
        </p>
        <a
          href="mailto:hello@dailyrecalldigest.com"
          className="text-sm text-brand-500 hover:text-brand-600"
        >
          Request early access →
        </a>
      </div>
    </main>
  );
}

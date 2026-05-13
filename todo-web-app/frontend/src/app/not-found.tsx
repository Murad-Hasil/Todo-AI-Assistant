import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-center px-6">
      {/* Robot icon */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="w-2 h-7 bg-cyan-400 rounded-full" />
        <div className="w-20 h-14 bg-[#0f172a] border-2 border-slate-700 rounded-xl flex items-center justify-center gap-4">
          <div className="w-4 h-4 bg-cyan-400 rounded-sm" />
          <div className="w-4 h-4 bg-cyan-400 rounded-sm" />
        </div>
        <div className="w-8 h-2 bg-slate-700 rounded-full" />
      </div>

      {/* 404 */}
      <h1 className="text-8xl font-extrabold text-white tracking-tight mb-2">
        404
      </h1>
      <p className="text-xl font-semibold text-slate-300 mb-3">
        Page not found
      </p>
      <p className="text-slate-500 text-sm mb-10 max-w-xs">
        The route you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      {/* Go Home */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-[#0f172a] font-semibold text-sm transition-colors"
      >
        ← Go Home
      </Link>
    </div>
  );
}

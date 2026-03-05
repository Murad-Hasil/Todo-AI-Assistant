// [Task]: T-3.4.7
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-black/40 border-t border-white/10 py-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="text-white font-bold text-xl mb-2">TodoAI</div>
          <p className="text-sm text-white/50">
            AI-powered task management for modern teams.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/#features"
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Features
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard"
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Account</h4>
          <ul className="space-y-2">
            <li>
              <Link
                href="/login"
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            </li>
            <li>
              <Link
                href="/register"
                className="text-sm text-white/50 hover:text-white transition-colors"
              >
                Register
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
          <ul className="space-y-2">
            <li>
              <span className="text-sm text-white/50">Privacy Policy</span>
            </li>
            <li>
              <span className="text-sm text-white/50">Terms of Service</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/10">
        <p className="text-center text-xs text-white/30">
          © {new Date().getFullYear()} TodoAI. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

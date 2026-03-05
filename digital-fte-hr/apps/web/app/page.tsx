import Link from 'next/link';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
}

function FeatureCard({ icon, title, description, href, disabled = false }: FeatureCardProps) {
  if (disabled) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm opacity-60 cursor-not-allowed">
        <div className="text-3xl">{icon}</div>
        <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        <p className="mt-4 text-xs text-gray-500">Coming soon - Configure API first</p>
      </div>
    );
  }

  return (
    <Link href={href}>
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300 hover:scale-105 cursor-pointer">
        <div className="text-3xl">{icon}</div>
        <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        <p className="mt-4 text-xs font-semibold text-blue-600">→ Explore</p>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 px-4 py-12">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tighter text-gray-900 sm:text-6xl">
          Digital FTE
        </h1>
        <p className="mt-4 text-xl text-gray-600">
          Your AI Career Accelerator
        </p>
        <p className="mt-2 text-lg text-gray-500">
          Find jobs, optimize your resume, and apply automatically with AI
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Account
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
          <FeatureCard
            icon="🔍"
            title="Smart Job Search"
            description="Find jobs across 15+ platforms with AI-powered matching"
            href="/auth/login"
            disabled={true}
          />

          <FeatureCard
            icon="📄"
            title="Resume Optimizer"
            description="Get ATS-optimized resumes with 23-point analysis"
            href="/auth/login"
            disabled={true}
          />

          <FeatureCard
            icon="⚡"
            title="Auto-Apply"
            description="Apply to relevant jobs with human approval gates"
            href="/auth/login"
            disabled={true}
          />
        </div>

        <div className="mt-16 text-sm text-gray-500">
          <p>Phase 1: Web App Setup Complete ✅</p>
          <p className="mt-2">
            Next: Configure API Backend & Database
          </p>
        </div>
      </div>
    </main>
  );
}

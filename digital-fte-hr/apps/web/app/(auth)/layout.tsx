export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 px-4 py-4 sm:py-6">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Digital FTE</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">Your AI Career Accelerator</p>
        </div>

        {/* Auth Form Container */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-lg">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs sm:text-sm text-gray-600">
          <p>© 2026 Digital FTE. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

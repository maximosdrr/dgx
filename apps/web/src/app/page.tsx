import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Gere documentos profissionais em segundos
        </h1>
        <p className="text-xl text-gray-600">
          Crie contratos, certificados e propostas com editor visual e API REST.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Começar grátis
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Entrar
          </Link>
        </div>
      </div>
    </main>
  );
}

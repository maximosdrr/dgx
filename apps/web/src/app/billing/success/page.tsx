import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen">
      <Navbar authenticated />
      <main className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl">🎉</div>
          <h1 className="text-2xl font-bold">Pagamento enviado!</h1>
          <p className="text-gray-600">
            Assim que o pagamento for confirmado seu plano será ativado automaticamente.
            Se pagou via Pix, costuma ser instantâneo.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Voltar para o dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}

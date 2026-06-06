'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface NavbarProps {
  authenticated?: boolean;
}

const navItems = [
  { label: 'Templates', href: '/dashboard', match: ['/dashboard', '/templates'] },
  { label: 'Documentos', href: '/documents', match: ['/documents'] },
  { label: 'Planos', href: '/billing', match: ['/billing'] },
];

export function Navbar({ authenticated = false }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    router.push('/login');
  }

  const visibleItems = authenticated ? navItems : navItems.slice(0, 2);

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-sm">
      <Link href={authenticated ? '/dashboard' : '/'} className="text-xl font-bold tracking-tight text-gray-950">
        DocGen
      </Link>

      <div className="flex items-center gap-5">
        <nav className="flex items-center gap-4 text-sm">
          {visibleItems.map((item) => {
            const active = item.match.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? 'font-semibold text-gray-950' : 'font-medium text-gray-500 hover:text-gray-900'}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {authenticated && (
          <>
            <Link
              href="/templates/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Novo template
            </Link>
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              Sair
            </button>
          </>
        )}
      </div>
    </header>
  );
}

import Link from 'next/link';
import { LogIn, LogOut, Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Header() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('mapleki-session');

  async function handleLogout() {
    "use server";
    const cookieStore = await cookies();
    cookieStore.delete('mapleki-session');
    redirect('/');
  }

  return (
    <header className="h-20 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between px-4 sm:px-10 border-b border-transparent transition-colors duration-200">
      <div className="flex items-center gap-3 sm:gap-4">
        <label htmlFor="mobile-menu" className="md:hidden p-2 -ml-2 text-slate-700 dark:text-slate-200 cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Menu className="w-6 h-6" />
        </label>
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 hidden md:block tracking-tight">
          매왕 길드 전용 대시보드
        </h2>
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {isLoggedIn ? (
          <form action={handleLogout}>
            <button type="submit" className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[15px] font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-[0.98] transition-all shadow-sm border border-slate-200 dark:border-slate-700">
              <LogOut className="w-4 h-4" />
              <span>로그아웃</span>
            </button>
          </form>
        ) : (
          <Link href="/login" className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white text-[15px] font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm shadow-blue-600/20">
            <LogIn className="w-4 h-4" />
            <span>관리자 로그인</span>
          </Link>
        )}
      </div>
    </header>
  );
}

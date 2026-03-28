import Link from 'next/link';
import { Home, Users } from 'lucide-react';
import AddContentModal from './AddContentModal';
import SidebarContentLink from './SidebarContentLink';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/db';

export default async function Sidebar() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('mapleki-session');

  // React Server Components 안에서 Supabase Fetch
  const { data: contents } = await supabase
    .from('contents')
    .select('*')
    .order('created_at', { ascending: true });

  const { data: records } = await supabase
    .from('records')
    .select('id, title, content_id')
    .order('created_at', { ascending: false });

  return (
    <aside className="w-64 h-screen bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col fixed left-0 top-0 pt-8 z-50 transition-transform duration-300 peer-checked:translate-x-0 -translate-x-full md:translate-x-0">
      <div className="px-8 mb-10 flex items-center justify-start">
        <Link href="/">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="text-blue-600">🍁</span> Mapleki
          </h1>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 space-y-3 overflow-y-auto">
        <div className="text-[13px] font-semibold text-slate-400 dark:text-slate-500 mb-4 px-4 uppercase tracking-wider">메뉴</div>
        
        <Link href="/" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
          <Home className="w-[20px] h-[20px] text-slate-400 group-hover:text-blue-600 transition-colors" />
          <span className="font-semibold text-[15px]">대시보드 홈</span>
        </Link>
        <Link href="/members" className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group">
          <Users className="w-[20px] h-[20px] text-slate-400 group-hover:text-emerald-500 transition-colors" />
          <span className="font-semibold text-[15px]">전체 길드원 관리</span>
        </Link>
        
        <div className="mt-10 mb-2">
          <div className="text-[13px] font-semibold text-slate-400 dark:text-slate-500 px-4 flex justify-between items-center uppercase tracking-wider">
            <span>길드 컨텐츠</span>
            <AddContentModal isLoggedIn={isLoggedIn} />
          </div>
        </div>
        
        {/* Dynamic Contents from DB */}
        {contents && contents.length > 0 ? (
          contents.map((c) => {
            const contentRecords = records?.filter(r => r.content_id === c.id) || [];
            return <SidebarContentLink key={c.id} content={c} records={contentRecords} isLoggedIn={isLoggedIn} />
          })
        ) : (
          <div className="px-5 py-4 text-[13px] text-slate-400 dark:text-slate-600 text-center">
            등록된 컨텐츠가 없습니다.
          </div>
        )}
      </nav>
    </aside>
  );
}

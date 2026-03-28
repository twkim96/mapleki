import { supabase } from '@/lib/db';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default async function Home() {
  const { data: contents } = await supabase
    .from('contents')
    .select('*')
    .order('created_at', { ascending: true });

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-4">
      <div className="flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">메인 대시보드</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-[15px]">매왕 길드의 모든 컨텐츠 현황을 한눈에 살펴보세요.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contents && contents.length > 0 ? contents.map((c) => (
          <Link key={c.id} href={`/${c.id}`}>
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:-translate-y-1 hover:shadow-md group">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-blue-600 transition-colors flex items-center justify-between">
                {c.name}
                <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-700 group-hover:text-blue-600 transition-colors" />
              </h3>
              <p className="text-[14px] text-slate-500 dark:text-slate-500 mt-4 font-medium">기록/게시판 입장</p>
            </div>
          </Link>
        )) : (
          <div className="col-span-1 md:col-span-3 py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">아직 등록된 길드 컨텐츠가 없습니다.</p>
            <p className="text-[15px] mt-2 text-slate-400 font-medium">좌측 사이드바에서 로그인 후 <span className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">[ + ]</span> 버튼을 눌러 첫 카테고리를 생성해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { supabase } from '@/lib/db';
import Link from 'next/link';
import { FilePlus2 } from 'lucide-react';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import DeleteContentButton from '@/components/sheet/DeleteContentButton';

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays > 5) return '오래 전에 수정됨';
  if (diffDays >= 1) return `${diffDays}일 전 수정됨`;
  
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours >= 1) return `${diffHours}시간 전 수정됨`;
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes >= 1) return `${diffMinutes}분 전 수정됨`;
  
  return '방금 전 수정됨';
}

function formatAbsoluteTime(dateStr: string) {
  const date = new Date(dateStr);
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${yy}.${mm}.${dd} ${hh}:${mi}:${ss}`;
}

export default async function ContentPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('mapleki-session');

  const { data: content } = await supabase.from('contents').select('*').eq('id', contentId).single();
  if (!content) return notFound();

  const { data: records } = await supabase
    .from('records')
    .select('*')
    .eq('content_id', contentId)
    .order('created_at', { ascending: false });

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-4">
      <div className="flex items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{content.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-[15px]">해당 컨텐츠의 모든 진행 결과를 확인하세요.</p>
        </div>
        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <>
              <Link href={`/${contentId}/new`} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 text-white text-[15px] font-bold hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm shadow-blue-600/20">
                <FilePlus2 className="w-5 h-5" />
                <span>새 기록지 작성</span>
              </Link>
              <DeleteContentButton contentId={contentId} contentName={content.name} />
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {records && records.length > 0 ? (
          records.map((r) => {
            const displayTimeStr = r.updated_at || r.created_at;
            return (
              <Link key={r.id} href={`/${contentId}/${r.id}`}>
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md cursor-pointer group flex flex-col h-full justify-between gap-6">
                  <div>
                    <div className="text-[13px] font-bold text-blue-600 dark:text-blue-400 mb-3">{formatRelativeTime(displayTimeStr)}</div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{r.title}</h3>
                  </div>
                  <div className="flex justify-end">
                    <p className="text-[13px] font-medium text-slate-400 dark:text-slate-500">
                      수정 기록: {formatAbsoluteTime(displayTimeStr)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })
        ) : (
          <div className="col-span-1 md:col-span-2 py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">아직 등록된 기록이 없습니다.</p>
            {isLoggedIn && <p className="text-sm mt-2 text-slate-400">우측 상단의 버튼을 눌러 첫 번째 기록을 작성해보세요.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

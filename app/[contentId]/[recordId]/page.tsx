import RecordViewer from "@/components/sheet/RecordViewer";
import { supabase } from "@/lib/db";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { Edit3 } from "lucide-react";
import ShareButton from "@/components/sheet/ShareButton";

export default async function RecordDetailPage({ params }: { params: Promise<{ contentId: string, recordId: string }> }) {
  const { contentId, recordId } = await params;
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('mapleki-session');

  const { data: content } = await supabase.from('contents').select('*').eq('id', contentId).single();
  if (!content) return notFound();

  const { data: record, error: recordError } = await supabase.from('records').select('*').eq('id', recordId).single();
  if (!record || recordError) return notFound();

  // 오름차순으로 정렬하여 1~30위 순서가 보장되도록 가져옵니다.
  // power_rank 가 null 인 경우 맨 뒤로 가야하지만, 일단 DB에 들어간 건 유효할 확률이 큽니다.
  const { data: sheetData } = await supabase.from('sheet_data').select('*').eq('record_id', recordId).order('power_rank', { ascending: true, nullsFirst: false });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end max-w-7xl mx-auto w-full px-4 gap-3">
        <ShareButton contentName={content.name} record={record} sheetData={sheetData || []} />
        {isLoggedIn && (
           <Link href={`/${contentId}/${recordId}/edit`} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-[14px]">
             <Edit3 className="w-4 h-4" />
             기록 수정하기
           </Link>
        )}
      </div>
      <RecordViewer record={record} sheetData={sheetData || []} isServerContent={content.is_server_content} />
    </div>
  );
}

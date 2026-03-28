import RecordSheet from "@/components/sheet/RecordSheet";
import { supabase } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function EditRecordPage({ params }: { params: Promise<{ contentId: string, recordId: string }> }) {
  const { contentId, recordId } = await params;

  const { data: content } = await supabase.from('contents').select('*').eq('id', contentId).single();
  if (!content) return notFound();

  const { data: record } = await supabase.from('records').select('*').eq('id', recordId).single();
  if (!record) return notFound();

  const { data: sheetData } = await supabase.from('sheet_data').select('*').eq('record_id', recordId).order('power_rank', { ascending: true, nullsFirst: false });
  
  // 30개의 행으로 복원
  const initialRows = Array.from({ length: 30 }, (_, i) => {
    if (sheetData && sheetData[i]) {
      const dbRow = sheetData[i];
      let rank_diff = null;
      if (dbRow.power_rank !== null && dbRow.content_rank !== null) {
        rank_diff = dbRow.power_rank - dbRow.content_rank;
      }
      return {
        power_rank: dbRow.power_rank,
        character_name: dbRow.character_name,
        content_rank: dbRow.content_rank,
        rank_diff,
        grade: dbRow.grade
      };
    }
    return { power_rank: null, character_name: "", content_rank: null, rank_diff: null, grade: null };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-7xl mx-auto w-full px-4 mb-2">
         <span className="text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/30 px-5 py-2.5 rounded-2xl text-[14px] border border-amber-200 dark:border-amber-800">
           ✏️ 현재 시트 데이터 수정 모드입니다.
         </span>
      </div>
      <RecordSheet 
        contentId={contentId} 
        isServerContent={content.is_server_content} 
        initialRecordId={recordId}
        initialTitle={record.title}
        initialRows={initialRows}
      />
    </div>
  );
}

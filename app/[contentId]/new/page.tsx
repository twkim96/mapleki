import RecordSheet from "@/components/sheet/RecordSheet";
import { supabase } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function NewRecordPage({ params }: { params: Promise<{ contentId: string }> }) {
  const { contentId } = await params;

  const { data: content } = await supabase.from('contents').select('*').eq('id', contentId).single();
  if (!content) return notFound();

  return (
    <>
      <RecordSheet contentId={contentId} isServerContent={content.is_server_content} />
    </>
  );
}

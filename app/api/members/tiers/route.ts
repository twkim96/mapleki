import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

/**
 * GET /api/members/tiers
 * 서버 내 컨텐츠들의 모든 기록에서 캐릭터별 content_rank 목록을 반환합니다.
 *
 * 반환 형태:
 * {
 *   success: true,
 *   data: {
 *     [character_name]: Array<{
 *       contentName: string;
 *       recordTitle: string;
 *       contentRank: number;
 *       recordCreatedAt: string;
 *     }>
 *   }
 * }
 */
export async function GET() {
  // 1. 서버 내 컨텐츠 목록 가져오기
  const { data: contents, error: contentsError } = await supabase
    .from('contents')
    .select('id, name')
    .eq('is_server_content', true);

  if (contentsError) {
    return NextResponse.json({ error: contentsError.message }, { status: 500 });
  }
  if (!contents || contents.length === 0) {
    return NextResponse.json({ success: true, data: {} });
  }

  const contentIds = contents.map((c) => c.id);
  const contentMap: Record<string, string> = {};
  contents.forEach((c) => { contentMap[c.id] = c.name; });

  // 2. 해당 컨텐츠들의 record 목록 가져오기
  const { data: records, error: recordsError } = await supabase
    .from('records')
    .select('id, title, content_id, created_at')
    .in('content_id', contentIds)
    .order('created_at', { ascending: false });

  if (recordsError) {
    return NextResponse.json({ error: recordsError.message }, { status: 500 });
  }
  if (!records || records.length === 0) {
    return NextResponse.json({ success: true, data: {} });
  }

  const recordIds = records.map((r) => r.id);
  const recordMap: Record<string, { title: string; contentId: string; createdAt: string }> = {};
  records.forEach((r) => {
    recordMap[r.id] = { title: r.title, contentId: r.content_id, createdAt: r.created_at };
  });

  // 3. sheet_data에서 참여한 데이터 (content_rank != -1, != null) 가져오기
  const { data: sheetRows, error: sheetError } = await supabase
    .from('sheet_data')
    .select('character_name, content_rank, record_id')
    .in('record_id', recordIds)
    .not('content_rank', 'is', null)
    .neq('content_rank', -1);

  if (sheetError) {
    return NextResponse.json({ error: sheetError.message }, { status: 500 });
  }

  // 4. 캐릭터별로 집계
  const tierMap: Record<string, Array<{
    contentName: string;
    recordTitle: string;
    contentRank: number;
    recordCreatedAt: string;
  }>> = {};

  for (const row of (sheetRows ?? [])) {
    const rec = recordMap[row.record_id];
    if (!rec) continue;
    if (!tierMap[row.character_name]) tierMap[row.character_name] = [];
    tierMap[row.character_name].push({
      contentName: contentMap[rec.contentId] ?? '알 수 없음',
      recordTitle: rec.title,
      contentRank: row.content_rank,
      recordCreatedAt: rec.createdAt,
    });
  }

  // 최신순 정렬 (같은 캐릭터 내에서)
  for (const name of Object.keys(tierMap)) {
    tierMap[name].sort((a, b) => new Date(b.recordCreatedAt).getTime() - new Date(a.recordCreatedAt).getTime());
  }

  return NextResponse.json({ success: true, data: tierMap });
}

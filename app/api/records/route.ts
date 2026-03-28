import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get('contentId');
  if (!contentId) return NextResponse.json({ error: 'contentId missing' }, { status: 400 });

  const { data, error } = await supabase
    .from('records')
    .select('id, title, updated_at, created_at')
    .eq('content_id', contentId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!cookieStore.has('mapleki-session')) {
    return NextResponse.json({ error: '권한이 없습니다 (로그인 필요)' }, { status: 401 });
  }

  const { contentId, title, rows } = await request.json();
  
  if (!contentId || !title || !Array.isArray(rows)) {
    return NextResponse.json({ error: '잘못된 요청 파라미터입니다' }, { status: 400 });
  }

  try {
    // 1. Record 생성
    const { data: recordData, error: recordError } = await supabase
      .from('records')
      .insert([{ content_id: contentId, title }])
      .select()
      .single();

    if (recordError) throw recordError;

    // 2. SheetData 생성 (빈 값 걸러낸 후)
    const validRows = rows.filter(r => r.character_name.trim() !== '');
    if (validRows.length > 0) {
      const dbSheetData = validRows.map(r => ({
        record_id: recordData.id,
        power_rank: r.power_rank,
        character_name: r.character_name,
        content_rank: r.content_rank,
        grade: r.grade
      }));

      const { error: sheetError } = await supabase
        .from('sheet_data')
        .insert(dbSheetData);

      if (sheetError) throw sheetError;
    }

    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, recordId: recordData.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  if (!cookieStore.has('mapleki-session')) {
    return NextResponse.json({ error: '권한이 없습니다 (로그인 필요)' }, { status: 401 });
  }

  const { recordId, title, rows } = await request.json();
  
  if (!recordId || !title || !Array.isArray(rows)) {
    return NextResponse.json({ error: '잘못된 요청 파라미터입니다' }, { status: 400 });
  }

  try {
    // 1. Record 업데이트 (updated_at 갱신)
    const { error: recordError } = await supabase
      .from('records')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', recordId);

    if (recordError) throw recordError;

    // 2. 기존 sheet_data 싹 지우기
    const { error: deleteError } = await supabase
      .from('sheet_data')
      .delete()
      .eq('record_id', recordId);

    if (deleteError) throw deleteError;

    // 3. 새롭게 들어온 rows를 통째로 다시 Insert
    const validRows = rows.filter(r => r.character_name.trim() !== '');
    if (validRows.length > 0) {
      const dbSheetData = validRows.map(r => ({
        record_id: recordId,
        power_rank: r.power_rank,
        character_name: r.character_name,
        content_rank: r.content_rank,
        grade: r.grade
      }));

      const { error: sheetError } = await supabase
        .from('sheet_data')
        .insert(dbSheetData);

      if (sheetError) throw sheetError;
    }

    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, recordId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

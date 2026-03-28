import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { cookies } from 'next/headers';

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  if (!cookieStore.has('mapleki-session')) {
    return NextResponse.json({ error: '권한이 없습니다 (로그인 필요)' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { members } = body;
    
    if (!Array.isArray(members)) {
      return NextResponse.json({ error: '잘못된 형식입니다.' }, { status: 400 });
    }

    const validMembers = members.filter(m => m.character_name.trim() !== '');

    const timestamp = new Date().toISOString();
    const finalMembers = validMembers.map(m => ({
      character_name: m.character_name,
      power_rank: m.power_rank !== "" ? parseInt(m.power_rank, 10) : null,
      updated_at: timestamp
    }));

    // 기존 데이터 전부 삭제
    const { error: deleteError } = await supabase.from('guild_members').delete().neq('character_name', 'DELETE_ALL_HACK');
    if (deleteError) throw deleteError;

    // 새 데이터 삽입
    if (finalMembers.length > 0) {
      const { error: insertError } = await supabase.from('guild_members').insert(finalMembers);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, data: finalMembers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  const { data, error } = await supabase
    .from('guild_members')
    .select('*')
    .order('power_rank', { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!cookieStore.has('mapleki-session')) {
    return NextResponse.json({ error: '권한이 없습니다 (로그인 필요)' }, { status: 401 });
  }

  // 1. 기존 데이터에서 마지막 업데이트 시간 확인
  const { data: lastMember } = await supabase
    .from('guild_members')
    .select('updated_at')
    .limit(1)
    .single();

  if (lastMember && lastMember.updated_at) {
    const lastUpdate = new Date(lastMember.updated_at).getTime();
    const now = new Date().getTime();
    const diffMins = (now - lastUpdate) / (1000 * 60);
    if (diffMins < 10) {
      return NextResponse.json({ 
        success: false, 
        error: `업데이트한 지 ${Math.floor(diffMins)}분밖에 지나지 않았습니다. IP 차단 방지를 위해 ${Math.ceil(10 - diffMins)}분 뒤에 다시 시도해주세요.` 
      }, { status: 429 });
    }
  }

  try {
    // 2. 외부 스크래핑 진행
    // (서버 내 루트 호출로 길드원 목록 확보)
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    const membersRes = await fetch(`${baseUrl}/api/scrape/guild`);
    const membersData = await membersRes.json();
    
    if (!membersData.success) throw new Error("길드원 목록 스크래핑 실패");

    const names: string[] = membersData.data;
    const finalMembers = [];

    for (const name of names) {
      const charRes = await fetch(`${baseUrl}/api/scrape/character?n=${encodeURIComponent(name)}`);
      const charData = await charRes.json();
      const powerRank = charData.success ? charData.data.powerRank : null;
      
      finalMembers.push({
        character_name: name,
        power_rank: powerRank,
        updated_at: new Date().toISOString()
      });
    }

    // 3. 기존 데이터 전부 삭제
    const { error: deleteError } = await supabase.from('guild_members').delete().neq('character_name', 'DELETE_ALL_HACK');

    // 4. 새 데이터 삽입
    const { error: insertError } = await supabase.from('guild_members').insert(finalMembers);
    if (insertError) throw insertError;

    return NextResponse.json({ success: true, data: finalMembers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

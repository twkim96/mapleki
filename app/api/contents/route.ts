import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function GET() {
  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .order('created_at', { ascending: true });
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!cookieStore.has('mapleki-session')) {
    return NextResponse.json({ error: '권한이 없습니다 (로그인 필요)' }, { status: 401 });
  }

  try {
    const { name, is_server_content } = await request.json();
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: '컨텐츠 이름을 입력해주세요' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const { data, error } = await supabase
      .from('contents')
      .insert([{ id, name: name.trim(), is_server_content }])
      .select()
      .single();
    
    if (error) throw error;
    
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  if (!cookieStore.has('mapleki-session')) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

  try {
    const { error } = await supabase.from('contents').delete().eq('id', id);
    if (error) throw error;
    
    revalidatePath('/', 'layout');
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

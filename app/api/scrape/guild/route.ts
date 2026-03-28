import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const guildName = searchParams.get('g_name') || '매왕';

  try {
    const response = await fetch(`https://mgf.gg/contents/guild_info.php?g_name=${encodeURIComponent(guildName)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MaplekiScraper/1.0)',
      },
      next: { revalidate: 3600 } // Cache for 1 hour to prevent abuse
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from mgf.gg');
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const members: string[] = [];
    
    // 타겟요소: <a class="nick-link" title="닉네임">
    $('.nick-link').each((_, element) => {
      const name = $(element).attr('title');
      if (name) {
        members.push(name.trim());
      }
    });

    const uniqueMembers = Array.from(new Set(members)).slice(0, 30); // 최대 30명

    return NextResponse.json({
      success: true,
      data: uniqueMembers,
    });
  } catch (error) {
    console.error('Guild Scrape Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to scrape guild members',
    }, { status: 500 });
  }
}

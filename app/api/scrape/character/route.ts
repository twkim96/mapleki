import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('n');

  if (!name) {
    return NextResponse.json({ error: 'Name parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`https://mgf.gg/contents/character.php?n=${encodeURIComponent(name)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MaplekiScraper/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch character from mgf.gg');
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // 타겟 요소: <div class="stat-value rank-world">O위</div>
    let rankText = $('.stat-value.rank-world').text().trim();
    
    let powerRank = null;
    
    if (rankText) {
      // "123위" 등에서 숫자만 추출
      const match = rankText.match(/\d+/g);
      if (match) {
        powerRank = parseInt(match.join(''), 10);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        name,
        powerRank,
      },
    });
  } catch (error) {
    console.error('Character Scrape Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to scrape character rank',
    }, { status: 500 });
  }
}

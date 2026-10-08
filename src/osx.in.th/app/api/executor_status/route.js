import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch live data from WEAO API
    const response = await fetch('https://weao.xyz/api/status/exploits', {
      headers: {
        'User-Agent': 'WEAO-3PService',
      },
      next: { revalidate: 300 }, // 5 min cache
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.warn('Failed to fetch from WEAO live API, using cache:', err.message);
  }

  // 2. Fallback to cache_executor_status.json if live API fails or network issue
  try {
    const cachePath = path.join(process.cwd(), 'api', 'cache_executor_status.json');
    if (fs.existsSync(cachePath)) {
      const fileData = fs.readFileSync(cachePath, 'utf8');
      const cached = JSON.parse(fileData);
      return NextResponse.json(cached);
    }
  } catch (err) {
    console.error('Failed to read cache file:', err);
  }

  return NextResponse.json({ status: 'error', message: 'ไม่สามารถดึงข้อมูลสถานะได้ในขณะนี้' }, { status: 500 });
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const response = await fetch('https://weao.xyz/api/status/exploits', {
      headers: {
        'User-Agent': 'WEAO-3PService',
      },
      next: { revalidate: 300 },
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    console.warn('Failed to fetch from WEAO live API, using cache:', err.message);
  }

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

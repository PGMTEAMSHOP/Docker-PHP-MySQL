// Server Component - ใช้เพื่อบังคับให้ /profile เป็น Dynamic (ไม่ Cache)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ProfileLayout({ children }) {
  return children;
}

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6">
      <h1 className="text-4xl font-black mb-8">AI 재판 시뮬레이터</h1>
      <Link href="/login" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform">
        새로운 사건 분석하기
      </Link>
    </main>
  );
}
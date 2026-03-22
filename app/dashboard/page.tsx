export default function DashboardPage() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <section className="bg-blue-900 text-white p-8 rounded-3xl text-center shadow-xl">
        <h2 className="text-lg opacity-80 mb-2">최종 판결 예측 </h2>
        <div className="text-5xl font-black mb-4">무죄 (NOT GUILTY)</div>
        <div className="text-sm bg-blue-800 inline-block px-4 py-1 rounded-full">
          유죄 확률 12% [cite: 108, 109]
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <article className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold mb-4 text-gray-700">양형 분석 지수 [cite: 109]</h3>
          <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            [Recharts 차트 영역]
          </div>
        </article>

        <article className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold mb-4 text-gray-700">결정적 법적 근거 [cite: 109]</h3>
          <ul className="space-y-3 text-sm text-gray-600">
            <li className="p-2 bg-gray-50 rounded">형법 제21조 (정당방위) [cite: 116]</li>
            <li className="p-2 bg-gray-50 rounded text-blue-600 underline">유사 판례 검색 결과 [cite: 92]</li>
          </ul>
        </article>
      </div>
    </main>
  );
}
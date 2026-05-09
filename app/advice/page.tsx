"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation"; // 🚀 이동을 위한 useRouter 추가
import { Gavel, Send, ShieldCheck, User, Loader2, ArrowLeft } from "lucide-react"; // 🚀 ArrowLeft 아이콘 추가
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../src/lib/api-client";

export default function LegalAdvicePage() {
  const router = useRouter(); // 🚀 라우터 초기화
  const [messages, setMessages] = useState([
    { role: "bot", content: "안녕하세요, 전략 법률 고문 AI입니다. 새로운 상담 세션이 시작되었습니다. 도움을 드릴까요?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); 
  const [sessionId, setSessionId] = useState<number | string>(""); 
  const scrollRef = useRef<HTMLDivElement>(null);

  // 페이지 진입시마다 새로운 세션 생성
  useEffect(() => {
    const initNewSession = async () => {
      try {
        setIsInitializing(true);
        const response = await apiClient.post("/api/chat/legal/sessions", {
          title: `법률 상담_${new Date().toLocaleTimeString()}`,
        });
        const newId = response.data.id;
        setSessionId(newId);
        console.log(`실제 세션 생성 완료: ID #${newId}`);
      } catch (error) {
        console.error("세션 초기화 에러:", error);
        alert("상담 세션을 생성할 수 없습니다. 대시보드에서 다시 진입해주세요.");
      } finally {
        setIsInitializing(false);
      }
    };
    initNewSession();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || !sessionId) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await apiClient.post(`/api/chat/legal/sessions/${sessionId}/messages`, {
        content: userMessage
      });
      const botReply = response.data.content || response.data.message || "답변을 가져올 수 없습니다.";
      setMessages(prev => [...prev, { role: "bot", content: botReply }]);
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      setMessages(prev => [...prev, { 
        role: "bot", 
        content: "서버 응답 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center p-6 pt-10">
      {/* 헤더 부분 */}
      <header className="max-w-4xl w-full mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-slate-950 p-4 rounded-[1.5rem] shadow-2xl text-white">
            <Gavel size={24} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-1">AI 법률 상담사</h1>
          </div>
        </div>
        
        {/* 우측 상단 뒤로가기 버튼 추가 */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} //  이전 페이지로 이동
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            뒤로가기
          </button>
        </div>
      </header>

      {/* 채팅 인터페이스 */}
      <main className="max-w-4xl w-full h-[72vh] bg-white rounded-[3.5rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.08)] border border-white overflow-hidden flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/30 custom-scrollbar">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-4`}
              >
                {msg.role === "bot" && (
                  <div className="w-10 h-10 bg-slate-950 rounded-2xl flex items-center justify-center text-blue-400 shrink-0 shadow-lg border border-slate-800">
                    <Gavel size={18} />
                  </div>
                )}
                <div className={`max-w-[75%] p-5 rounded-[2.2rem] text-[14px] font-bold leading-relaxed shadow-sm ${
                  msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-tr-none" 
                  : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-10 h-10 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                    <User size={18} />
                  </div>
                )}
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-white border border-slate-100 p-5 rounded-[2.2rem] rounded-tl-none shadow-sm flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">AI가 법리를 검토 중입니다</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 입력바 */}
        <div className="p-8 bg-white border-t border-slate-50 flex gap-4 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
            placeholder={isTyping ? "AI 분석 대기 중..." : "상담 내용을 입력하세요"}
            className="flex-1 bg-slate-100/50 border-none rounded-2xl px-8 py-5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all text-slate-800 disabled:opacity-50"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping || !input.trim()}
            className="bg-slate-950 hover:bg-black text-white p-5 rounded-[1.5rem] shadow-xl transition-all active:scale-95 disabled:bg-slate-200"
          >
            <Send size={24} />
          </button>
        </div>
      </main>
      
      <footer className="mt-8 text-[9px] text-slate-400 font-black tracking-[0.3em] uppercase text-center opacity-40 leading-relaxed">
       본 AI 법률 자문은 참고용이며 어떠한 법적 효력도 갖지 않습니다.<br />
              중요한 결정 전 반드시 전문 변호사와 상담하시기 바랍니다.
      </footer>
    </div>
  );
}
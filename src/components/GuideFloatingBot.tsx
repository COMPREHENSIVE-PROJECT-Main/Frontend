"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, X, Send, MessageCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../lib/api-client"; //axios 인스턴스 

function formatGuideText(content: string) {
  return content
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/#{1,6}\s*/g, "")
    .replace(/[•·]\s*/g, "- ")
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^[-–—_=\s]{2,}$/.test(line))
    .join("\n")
    .trim();
}

function GuideMessage({ content }: { content: string }) {
  const blocks = formatGuideText(content).split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIdx) => {
        const lines = block.split(/\n/).map((line) => line.trim()).filter(Boolean);
        const firstLine = lines[0] || "";
        const restLines = lines.slice(1);
        const isHeading = restLines.length > 0 && firstLine.length <= 24 && !/^[-\d]/.test(firstLine);
        const bodyLines = isHeading ? restLines : lines;

        return (
          <section key={blockIdx} className={blockIdx > 0 ? "border-t border-slate-100 pt-3" : ""}>
            {isHeading && (
              <h4 className="mb-2 text-[11px] font-black uppercase tracking-widest text-blue-600">
                {firstLine.replace(/^\[|\]$/g, "")}
              </h4>
            )}
            <div className="space-y-2">
              {bodyLines.map((line, lineIdx) => {
                const cleaned = line.replace(/^[-*]\s*/, "").replace(/^\d+[.)]\s*/, "");
                const hasListMarker = /^[-*]\s*/.test(line) || /^\d+[.)]\s*/.test(line);
                const isShortLabel = cleaned.length <= 16 && !/[.?!。]$/.test(cleaned);

                if (hasListMarker && !isShortLabel) {
                  return (
                    <div key={lineIdx} className="flex gap-2 text-[13px] leading-6 text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      <p>{cleaned}</p>
                    </div>
                  );
                }

                return (
                  <p key={lineIdx} className="text-[13px] leading-6 text-slate-700">
                    {cleaned}
                  </p>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function GuideFloatingBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", content: "안녕하세요! AI 재판 시뮬레이터의 이용 방법을 알려드릴까요?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await apiClient.post("/api/chat/guide/message", {
        content: userMessage
      });

      const botReply = response.data.content || response.data.message || "답변을 가져오지 못했습니다.";
      setMessages(prev => [...prev, { role: "bot", content: botReply }]);
      
    } catch (error) {
      console.error("가이드 챗봇 에러:", error);
      setMessages(prev => [...prev, { role: "bot", content: "서버와 연결이 원활하지 않습니다. 잠시 후 다시 시도해주세요." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="guide-floating-bot fixed bottom-6 right-6 z-[9999] print:hidden">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            key="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            <HelpCircle size={32} />
          </motion.button>
        ) : (
          <motion.div
            key="window"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            //가로 넓이
            className="w-[400px] h-[520px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
          >
            {/* 헤더 */}
            <div className="bg-slate-950 p-6 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <MessageCircle size={20} className="text-blue-400" />
                <span className="text-[13px] font-black uppercase tracking-widest">기능 가이드</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            
            {/* 메시지 영역 */}
            <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto bg-slate-50 space-y-5 custom-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] font-bold leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? "bg-blue-600 text-white rounded-tr-none" 
                    : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                  }`}>
                    {msg.role === "bot" ? <GuideMessage content={msg.content} /> : msg.content}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                </div>
              )}
            </div>

            {/* 입력창 */}
            <div className="p-5 bg-white border-t flex gap-3 items-center shrink-0">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                disabled={isTyping}
                placeholder={isTyping ? "답변을 생성하는 중..." : "궁금한 기능을 입력하세요"} 
                className="flex-1 bg-slate-100 border-none rounded-xl px-5 py-4 text-[13px] outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-bold disabled:opacity-50"
              />
              <button 
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className="bg-slate-950 text-white p-4 rounded-xl hover:bg-black transition-colors shadow-lg active:scale-95 disabled:bg-slate-300"
              >
                <Send size={18}/>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

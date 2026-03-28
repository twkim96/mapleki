"use client";

import { useState } from "react";
import { PlusSquare, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AddContentModal({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [isServerContent, setIsServerContent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !isLoggedIn) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, is_server_content: isServerContent }),
      });
      if (res.ok) {
        setIsOpen(false);
        setName("");
        setIsServerContent(false);
        router.refresh(); 
      } else {
        const data = await res.json();
        alert(data.error || "추가 실패");
      }
    } catch (err) {
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => {
          if (!isLoggedIn) {
            alert('관리자 로그인이 필요합니다.');
            return;
          }
          setIsOpen(true);
        }}
        className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <PlusSquare className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-sm shadow-xl border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">새 컨텐츠 관리</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-4">
                <input
                  type="text"
                  autoFocus
                  placeholder="예: 주간 보스 토벌"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                />
                
                <label className="flex items-center gap-3 p-4 border border-slate-100 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={isServerContent} 
                    onChange={(e) => setIsServerContent(e.target.checked)}
                    className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 bg-slate-100 border-slate-300 dark:bg-slate-900 dark:border-slate-700" 
                  />
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-slate-900 dark:text-white">서버 컨텐츠 (서버 등수 비교)</span>
                    <span className="text-[12px] text-slate-500">체크 해제 시 길드원끼리 1~30위 경쟁</span>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[16px] font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                <span>컨텐츠 추가</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

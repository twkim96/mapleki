"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import EasyRankModal from "./EasyRankModal";

interface SheetRow {
  power_rank: number | null;
  character_name: string;
  content_rank: number | null;
  rank_diff: number | null;
  grade: string | null;
}

function getAutoTitle() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const week = Math.ceil(date / 7);
  return `${month}월 ${week}주차`;
}

export default function RecordSheet({ 
  contentId, 
  isServerContent,
  initialRecordId,
  initialTitle,
  initialRows
}: { 
  contentId: string; 
  isServerContent: boolean;
  initialRecordId?: string;
  initialTitle?: string;
  initialRows?: SheetRow[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle || (initialRecordId ? "" : getAutoTitle()));
  const [rows, setRows] = useState<SheetRow[]>(initialRows || Array.from({ length: 30 }, () => ({
    power_rank: null, character_name: "", content_rank: null, rank_diff: null, grade: null
  })));
  
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleLoadMembers = async () => {
    setScraping(true);
    try {
      const membersRes = await fetch('/api/members');
      const membersData = await membersRes.json();
      
      if (!membersData.success || !membersData.data || membersData.data.length === 0) {
        throw new Error("캐싱된 길드원 데이터가 없습니다. 사이드바 '전체 길드원 관리' 메뉴에서 우선 외부 갱신 1회를 실행해주세요.");
      }
      
      const existingRanks = new Map<string, number | null>();
      rows.forEach(r => {
        if (r.character_name && r.content_rank !== null) {
          existingRanks.set(r.character_name, r.content_rank);
        }
      });

      const dbMembers = membersData.data;
      const finalRows: SheetRow[] = dbMembers.map((m: any, idx: number) => {
        let pr = isServerContent ? m.power_rank : idx + 1;
        let cr = existingRanks.get(m.character_name) ?? null;
        let diff = null;
        let grade = null;

        if (pr !== null && cr !== null) {
          diff = pr - cr;
          const dangerThreshold = isServerContent ? -10 : -5;
          const cautionThreshold = isServerContent ? -5 : -3;

          if (diff <= dangerThreshold) grade = "위험";
          else if (diff <= cautionThreshold) grade = "주의";
          else grade = "양호";
        }

        return {
          power_rank: pr,
          character_name: m.character_name,
          content_rank: cr,
          rank_diff: diff,
          grade
        };
      });

      setRows(finalRows);
      
    } catch (error: any) {
      alert(error.message);
    } finally {
      setScraping(false);
    }
  };

  const handleApplyEasyRank = (orderedNames: string[]) => {
    const newRows = [...rows];
    
    // Assign 1~30 based on ordered array
    newRows.forEach(row => {
      if (row.character_name && orderedNames.includes(row.character_name)) {
        row.content_rank = orderedNames.indexOf(row.character_name) + 1;
      }
    });

    // Recompute
    newRows.forEach(row => {
      if (row.power_rank !== null && row.content_rank !== null) {
        row.rank_diff = row.power_rank - row.content_rank;
        const cautionThreshold = -3;
        const dangerThreshold = -5;
        if (row.rank_diff <= dangerThreshold) row.grade = "위험";
        else if (row.rank_diff <= cautionThreshold) row.grade = "주의";
        else row.grade = "양호";
      } else {
        row.rank_diff = null;
        row.grade = null;
      }
    });
    setRows(newRows);
  };

  const handleRowChange = (index: number, field: keyof SheetRow, value: any) => {
    const newRows = [...rows];
    let val = value;
    if ((field === "power_rank" || field === "content_rank") && val !== "") {
      val = parseInt(val, 10);
      if (isNaN(val)) val = null;
    }
    
    newRows[index] = { ...newRows[index], [field]: val };
    
    const row = newRows[index];
    if (row.power_rank !== null && row.content_rank !== null) {
      row.rank_diff = row.power_rank - row.content_rank;
      
      const dangerThreshold = isServerContent ? -10 : -5;
      const cautionThreshold = isServerContent ? -5 : -3;

      if (row.rank_diff <= dangerThreshold) {
        row.grade = "위험";
      } else if (row.rank_diff <= cautionThreshold) {
        row.grade = "주의";
      } else {
        row.grade = "1인분";
      }
    } else {
      row.rank_diff = null;
      row.grade = null;
    }
    
    setRows(newRows);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert("회차 제목을 입력해주세요!");
      return;
    }
    if (!rows.some(r => r.character_name.trim() !== '')) {
      alert("최소 한 명 이상의 길드원 데이터가 필요합니다.");
      return;
    }

    setSaving(true);
    try {
      const method = initialRecordId ? "PUT" : "POST";
      const payload = { contentId, recordId: initialRecordId, title, rows };

      const res = await fetch("/api/records", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "서버 통신 에러");
      
      router.push(initialRecordId ? `/${contentId}/${initialRecordId}` : `/${contentId}`);
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto py-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="w-full md:w-auto">
          <input
            type="text"
            placeholder="회차 제목 (예: 12월 1주차 토벌전)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full md:w-96 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-xl font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          {!isServerContent && (
             <button 
               onClick={() => setShowModal(true)} 
               className="flex-1 md:flex-none py-4 px-5 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-2xl text-[14px] font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2 border border-amber-200 dark:border-amber-800"
             >
               ✨ 편하게 배정하기
             </button>
          )}

          <button
            onClick={handleLoadMembers}
            disabled={scraping}
            className="flex-1 md:flex-none py-4 px-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            {scraping ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> 불러오는 중...</>
            ) : (
              <><RefreshCw className="w-5 h-5" /> 길드원 최신화</>
            )}
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || scraping}
            className="flex-1 md:flex-none py-4 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-blue-600/20"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>기록 저장</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 text-[14px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-5 w-16 text-center">#</th>
                <th className="px-6 py-5 w-40">{isServerContent ? "전투력 순위 (서버)" : "전투력 순위 (길드)"}</th>
                <th className="px-6 py-5">캐릭터명</th>
                <th className="px-6 py-5 w-32 border-l border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-900/10">컨텐츠 등수</th>
                <th className="px-6 py-5 w-32">등수 차이</th>
                <th className="px-6 py-5 w-32">판정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[15px]">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                  <td className="px-6 py-3">
                    <input type="number" value={row.power_rank ?? ''} onChange={(e) => handleRowChange(idx, 'power_rank', e.target.value)} className="w-full px-3 py-2 bg-transparent border-none rounded focus:ring-2 focus:ring-blue-500 font-bold" />
                  </td>
                  <td className="px-6 py-3">
                    <input type="text" value={row.character_name} onChange={(e) => handleRowChange(idx, 'character_name', e.target.value)} className="w-full px-3 py-2 bg-transparent border-none rounded focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-medium" />
                  </td>
                  <td className="px-6 py-3 border-l border-slate-200 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-900/5">
                    <input type="number" value={row.content_rank ?? ''} onChange={(e) => handleRowChange(idx, 'content_rank', e.target.value)} placeholder="수동입력" className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-blue-600 dark:text-blue-400 font-bold text-center" />
                  </td>
                  <td className="px-6 py-3 text-center font-bold">
                    {row.rank_diff !== null && (
                      <span className={row.rank_diff >= 0 ? "text-emerald-500" : "text-red-500"}>
                        {row.rank_diff > 0 ? `+${row.rank_diff}` : row.rank_diff}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {row.grade && (
                      <span className={`px-3 py-1 rounded-full text-[13px] font-bold ${
                        row.grade === "양호" 
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                          : row.grade === "주의"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {row.grade}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EasyRankModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        sortedNames={rows.map(r => r.character_name).filter(Boolean)}
        onApply={handleApplyEasyRank}
      />
    </div>
  );
}

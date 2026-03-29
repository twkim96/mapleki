"use client";

import { useState } from "react";
import { Loader2, RefreshCw, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import EasyRankModal from "./EasyRankModal";
import { getTierImage, isNearTierBoundary } from "@/lib/tier";

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

function computeGrade(rankDiff: number, isServerContent: boolean): string {
  const dangerThreshold = isServerContent ? -10 : -5;
  const cautionThreshold = isServerContent ? -5 : -3;
  if (rankDiff <= dangerThreshold) return "위험";
  if (rankDiff <= cautionThreshold) return "주의";
  return "양호";
}

export default function RecordSheet({ 
  contentId,
  contentName,
  isServerContent,
  initialRecordId,
  initialTitle,
  initialRows
}: { 
  contentId: string;
  contentName: string;
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
      
      // 기존에 입력된 컨텐츠 등수 보존
      const existingRanks = new Map<string, number | null>();
      rows.forEach(r => {
        if (r.character_name) {
          existingRanks.set(r.character_name, r.content_rank);
        }
      });

      const dbMembers = membersData.data;
      const finalRows: SheetRow[] = dbMembers.map((m: any, idx: number) => {
        const pr = isServerContent ? m.power_rank : idx + 1;
        const cr = existingRanks.has(m.character_name) ? existingRanks.get(m.character_name)! : null;
        let diff = null;
        let grade = null;

        // -1 = 미참여 → 판정 없음
        if (pr !== null && cr !== null && cr !== -1) {
          diff = pr - cr;
          grade = computeGrade(diff, isServerContent);
        }

        return { power_rank: pr, character_name: m.character_name, content_rank: cr, rank_diff: diff, grade };
      });

      setRows(finalRows);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setScraping(false);
    }
  };

  const handleApplyEasyRank = (orderedNames: string[], absentNames: string[]) => {
    const newRows = rows.map(row => {
      if (!row.character_name) return row;

      if (absentNames.includes(row.character_name)) {
        // 미참여 → content_rank = -1, 판정 없음
        return { ...row, content_rank: -1, rank_diff: null, grade: null };
      }

      const rankIndex = orderedNames.indexOf(row.character_name);
      if (rankIndex !== -1) {
        const cr = rankIndex + 1;
        const diff = row.power_rank !== null ? row.power_rank - cr : null;
        const grade = diff !== null ? computeGrade(diff, isServerContent) : null;
        return { ...row, content_rank: cr, rank_diff: diff, grade };
      }

      return row;
    });
    setRows(newRows);
  };

  const handleRowChange = (index: number, field: keyof SheetRow, value: any) => {
    const newRows = [...rows];
    let val = value;

    if (field === "content_rank") {
      // 빈칸 → -1 (미참여)
      if (val === "" || val === null || val === undefined) {
        val = -1;
      } else {
        val = parseInt(val, 10);
        if (isNaN(val)) val = -1;
      }
    } else if (field === "power_rank") {
      if (val === "") {
        val = null;
      } else {
        val = parseInt(val, 10);
        if (isNaN(val)) val = null;
      }
    }
    
    newRows[index] = { ...newRows[index], [field]: val };
    
    const row = newRows[index];
    // -1 = 미참여 → 판정·diff 없음
    if (row.power_rank !== null && row.content_rank !== null && row.content_rank !== -1) {
      row.rank_diff = row.power_rank - row.content_rank;
      row.grade = computeGrade(row.rank_diff, isServerContent);
    } else {
      row.rank_diff = null;
      row.grade = null;
    }
    
    setRows(newRows);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = document.querySelector(`input[data-row="${rowIndex - 1}"]`) as HTMLInputElement | null;
      if (prev) { prev.focus(); setTimeout(() => prev.select(), 0); }
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      const next = document.querySelector(`input[data-row="${rowIndex + 1}"]`) as HTMLInputElement | null;
      if (next) { next.focus(); setTimeout(() => next.select(), 0); }
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { alert("회차 제목을 입력해주세요!"); return; }
    if (!rows.some(r => r.character_name.trim() !== '')) {
      alert("최소 한 명 이상의 길드원 데이터가 필요합니다."); return;
    }

    setSaving(true);
    try {
      const method = initialRecordId ? "PUT" : "POST";
      // content_rank 빈칸(-1)도 그대로 저장
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
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div className="w-full md:w-auto">
          <span className="text-[13px] font-bold text-blue-500 dark:text-blue-400 mb-1.5 block px-1">📁 {contentName}</span>
          <input
            type="text"
            placeholder="회차 제목 (예: 12월 1주차 토벌전)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full md:w-96 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-xl font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto pb-1">
          {!isServerContent && (
             <button 
               onClick={() => setShowModal(true)} 
               title="편하게 배정하기"
               className="group flex flex-none items-center h-[42px] max-w-[42px] hover:max-w-[200px] px-[11px] rounded-xl bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 transition-all duration-300 overflow-hidden border border-amber-200 dark:border-amber-800"
             >
               <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-lg">✨</span>
               <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-[14px] font-bold ml-2 flex-shrink-0 relative pt-px">편하게 배정하기</span>
             </button>
          )}

          <button
            onClick={handleLoadMembers}
            disabled={scraping}
            title="길드원 최신화"
            className="group flex flex-none items-center h-[42px] max-w-[42px] hover:max-w-[200px] px-[11px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700 disabled:opacity-50"
          >
            {scraping ? <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" /> : <RefreshCw className="w-5 h-5 flex-shrink-0" />}
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-[14px] font-bold ml-2 flex-shrink-0 relative pt-px">길드원 최신화</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={saving || scraping}
            title="기록 저장"
            className="group flex flex-none items-center h-[42px] max-w-[42px] hover:max-w-[200px] px-[11px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 overflow-hidden shadow-sm shadow-blue-600/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" /> : <Save className="w-5 h-5 flex-shrink-0" />}
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-[14px] font-bold ml-2 flex-shrink-0 relative pt-px">기록 저장</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 text-[14px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isServerContent ? (
                  <>
                    <th className="px-3 py-4 w-16 text-center leading-tight">전체<br/>랭킹</th>
                    <th className="px-4 py-4 min-w-[150px] max-w-[220px]">캐릭터명</th>
                    <th className="px-3 py-4 w-20 text-center leading-tight border-l border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-900/10">매왕<br/>등수</th>
                    <th className="px-3 py-4 w-20 text-center leading-tight bg-blue-50/50 dark:bg-blue-900/10">컨텐츠<br/>등수</th>
                    <th className="px-3 py-4 w-16 text-center leading-tight bg-blue-50/50 dark:bg-blue-900/10">티어</th>
                    <th className="px-2 py-4 w-28 text-center leading-tight">등수 차이<br/><span className="text-[10px] opacity-80 decoration-none font-medium">(매왕/컨텐츠)</span></th>
                    <th className="px-3 py-4 w-16 text-center">판정</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-5 w-20 text-center leading-tight">길드<br/>순위</th>
                    <th className="px-6 py-5 min-w-[120px] max-w-[180px]">캐릭터명</th>
                    <th className="px-6 py-5 w-40 text-center border-l border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-900/10">매왕 등수</th>
                    <th className="px-4 py-5 w-28 text-center whitespace-nowrap">등수 차이</th>
                    <th className="px-4 py-5 w-24 text-center">판정</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[15px]">
              {(() => {
                const validRanks = rows
                  .filter(r => r.content_rank !== null && r.content_rank !== -1)
                  .map(r => r.content_rank as number);
                const getGuildContentRank = (cr: number | null) => {
                  if (cr === null || cr === -1) return null;
                  let rank = 1;
                  for (const r of validRanks) {
                    if (r < cr) rank++;
                  }
                  return rank;
                };

                return rows.map((row, idx) => {
                  const isAbsent = row.content_rank === -1;
                  
                  if (isServerContent) {
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 py-3 font-bold text-slate-700 dark:text-slate-300 text-center">
                          {row.power_rank ?? '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 dark:text-white text-[15px] pl-2">{row.character_name}</span>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-blue-600 dark:text-blue-400 border-l border-slate-200 dark:border-slate-800 bg-blue-50/10 dark:bg-blue-900/5">
                          {isAbsent ? <span className="text-slate-400 text-sm font-medium">미참여</span> : (getGuildContentRank(row.content_rank) ?? '-')}
                        </td>
                        <td className="px-3 py-3 bg-blue-50/10 dark:bg-blue-900/5">
                          <input
                            type="number"
                            data-row={idx}
                            onKeyDown={(e) => handleKeyDown(e, idx)}
                            value={isAbsent ? '' : (row.content_rank ?? '')}
                            onChange={(e) => handleRowChange(idx, 'content_rank', e.target.value)}
                            placeholder="빈칸=미참여"
                            className={`w-full px-2 py-2 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 font-bold text-center text-sm ${
                              !isAbsent && isNearTierBoundary(row.content_rank)
                                ? "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400"
                                : "bg-white dark:bg-slate-950 text-blue-600 dark:text-blue-400"
                            }`}
                          />
                        </td>
                        <td className="px-3 py-3 text-center bg-blue-50/10 dark:bg-blue-900/5">
                          {!isAbsent && getTierImage(row.content_rank) && (
                            <div className="flex justify-center">
                              <img src={getTierImage(row.content_rank)!} alt="tier" className="w-7 h-7 sm:w-9 sm:h-9 object-contain" />
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-3 text-center font-bold text-sm">
                          {row.rank_diff !== null && !isAbsent ? (() => {
                            const guildRank = idx + 1;
                            const guildContentRank = getGuildContentRank(row.content_rank)!;
                            const guildDiff = guildRank - guildContentRank;
                            const serverDiff = row.rank_diff;
                            return (
                              <div className="flex flex-col md:flex-row items-center justify-center gap-1">
                                <span className={guildDiff >= 0 ? "text-emerald-500" : "text-red-500"}>{guildDiff > 0 ? `+${guildDiff}` : guildDiff}</span>
                                <span className="text-slate-300 hidden md:inline">/</span>
                                <span className={serverDiff >= 0 ? "text-emerald-500" : "text-red-500"}>{serverDiff > 0 ? `+${serverDiff}` : serverDiff}</span>
                              </div>
                            )
                          })() : null}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {row.grade && !isAbsent && (
                            <span className={`px-2 py-1 rounded-full text-[12px] font-bold whitespace-nowrap ${
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
                    );
                  }
                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-3 font-bold text-slate-700 dark:text-slate-300 text-center">
                        {row.power_rank ?? '-'}
                      </td>
                      <td className="px-6 py-3">
                        <span className="font-bold text-slate-900 dark:text-white text-[16px] pl-1">{row.character_name}</span>
                      </td>
                      <td className="px-6 py-3 border-l border-slate-200 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-900/5">
                        <input
                          type="number"
                          data-row={idx}
                          onKeyDown={(e) => handleKeyDown(e, idx)}
                          value={isAbsent ? '' : (row.content_rank ?? '')}
                          onChange={(e) => handleRowChange(idx, 'content_rank', e.target.value)}
                          placeholder="수동 입력"
                          className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-blue-600 dark:text-blue-400 font-bold text-center"
                        />
                      </td>
                      <td className="px-6 py-3 text-center font-bold">
                        {row.rank_diff !== null && !isAbsent && (
                          <span className={row.rank_diff >= 0 ? "text-emerald-500" : "text-red-500"}>
                            {row.rank_diff > 0 ? `+${row.rank_diff}` : row.rank_diff}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.grade && !isAbsent && (
                          <span className={`px-3 py-1 rounded-full text-[13px] font-bold whitespace-nowrap ${
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
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <EasyRankModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        rows={rows.filter(r => r.character_name.trim() !== '')}
        onApply={handleApplyEasyRank}
      />
    </div>
  );
}

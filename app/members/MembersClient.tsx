"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, AlertTriangle, Plus, Trash2, Edit3, Save, X } from "lucide-react";
import { getTierImage } from "@/lib/tier";

interface Member {
  power_rank: number | string | null;
  character_name: string;
}

interface TierEntry {
  contentName: string;
  recordTitle: string;
  contentRank: number;
  recordCreatedAt: string;
}

type TierMap = Record<string, TierEntry[]>;

function TierBadge({ entry }: { entry: TierEntry }) {
  const img = getTierImage(entry.contentRank);
  if (!img) return null;
  return (
    <div
      className="relative group/tier flex-shrink-0"
      title={`[${entry.contentName}] ${entry.recordTitle} — ${entry.contentRank}위`}
    >
      <img
        src={img}
        alt={`${entry.contentRank}위`}
        className="w-7 h-7 object-contain"
      />
      {/* 호버 툴팁 */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 hidden group-hover/tier:flex flex-col items-center pointer-events-none">
        <div className="bg-slate-900 text-white text-[11px] font-bold rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl leading-snug text-center">
          <div className="text-slate-300 text-[10px]">{entry.contentName}</div>
          <div>{entry.recordTitle}</div>
          <div className="text-blue-400">{entry.contentRank}위</div>
        </div>
        <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
      </div>
    </div>
  );
}

export default function MembersClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [tierMap, setTierMap] = useState<TierMap>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [editMode, setEditMode] = useState(false);
  const [draftMembers, setDraftMembers] = useState<Member[]>([]);
  const [savingManual, setSavingManual] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [membersRes, tiersRes] = await Promise.all([
      fetch('/api/members'),
      fetch('/api/members/tiers'),
    ]);
    const membersJson = await membersRes.json();
    const tiersJson = await tiersRes.json();

    if (membersJson.success && membersJson.data.length > 0) {
      setMembers(membersJson.data);
      setLastUpdated(new Date(membersJson.data[0].updated_at).toLocaleString('ko-KR'));
    }
    if (tiersJson.success) {
      setTierMap(tiersJson.data);
    }
    setLoading(false);
  };

  const handleUpdate = async () => {
    if (!confirm("외부 스크래핑 갱신을 진행하시겠습니까? (약 15초 소요)")) return;
    setUpdating(true);
    try {
      const res = await fetch('/api/members', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || "업데이트 실패");
      } else {
        alert("기록 갱신 성공!");
        setMembers(json.data);
        setLastUpdated(new Date(json.data[0].updated_at).toLocaleString('ko-KR'));
      }
    } catch(e: any) {
      alert(e.message);
    }
    setUpdating(false);
  };

  const startEditMode = () => {
    setDraftMembers([...members]);
    setEditMode(true);
  };

  const cancelEditMode = () => {
    if (!confirm("수정 중인 내용이 잃게 됩니다. 취소하시겠습니까?")) return;
    setDraftMembers([]);
    setEditMode(false);
  };

  const handleDraftChange = (index: number, field: keyof Member, value: any) => {
    const newDrafts = [...draftMembers];
    newDrafts[index] = { ...newDrafts[index], [field]: value };
    setDraftMembers(newDrafts);
  };

  const addRow = () => {
    const pr = draftMembers.length > 0 ? Number(draftMembers[draftMembers.length - 1].power_rank) + 1 : 1;
    setDraftMembers([...draftMembers, { power_rank: isNaN(pr) ? null : pr, character_name: "" }]);
  };

  const removeRow = (index: number) => {
    const newDrafts = [...draftMembers];
    newDrafts.splice(index, 1);
    setDraftMembers(newDrafts);
  };

  const saveManualEdits = async () => {
    if (!confirm("이대로 캐싱된 데이터를 덮어씌워 저장하시겠습니까?")) return;
    setSavingManual(true);
    try {
      const res = await fetch('/api/members/manual', {
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: draftMembers })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "저장 실패");
      }
      setMembers(json.data);
      setLastUpdated(new Date(json.data[0].updated_at).toLocaleString('ko-KR'));
      setEditMode(false);
      alert("수동 변경사항이 저장되었습니다.");
    } catch(e: any) {
      alert(e.message);
    }
    setSavingManual(false);
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto py-4">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-6 gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            길드원 관리 (캐싱)
            {isLoggedIn && !editMode && members.length > 0 && (
              <button onClick={startEditMode} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 rounded-lg transition-colors group relative" title="수동 편집 모드">
                <Edit3 className="w-5 h-5" />
              </button>
            )}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-[15px]">
            기록지 작성 시 불러올 길드원 명단입니다. <br/>
            <span className="text-blue-500 font-bold mt-1 inline-block">마지막 업데이트: {lastUpdated || '설정 전'}</span>
          </p>
        </div>
        
        {!editMode ? (
          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            {isLoggedIn ? (
              <>
                <button 
                  onClick={handleUpdate} 
                  disabled={updating || loading}
                  className="w-full md:w-auto flex justify-center items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 text-white text-[15px] font-bold hover:bg-amber-600 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                  <span>외부 서버 강제 갱신하기 (약 15초)</span>
                </button>
                <div className="flex items-center gap-1.5 text-[12px] text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg w-full md:w-auto">
                  <AlertTriangle className="w-3.5 h-3.5 flex-none" />
                  초기화 버튼 연타 시 IP가 영구차단 당할 수 있습니다. (10분 제한)
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 text-[12px] text-slate-500 font-bold bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg w-full md:w-auto">
                <AlertTriangle className="w-3.5 h-3.5 flex-none" />
                관리자 로그인이 필요합니다.
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <div className="flex items-center gap-3 w-full justify-end">
               <button onClick={cancelEditMode} disabled={savingManual} className="px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2">
                 <X className="w-4 h-4"/> 취소
               </button>
               <button onClick={saveManualEdits} disabled={savingManual} className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm shadow-blue-500/20">
                 {savingManual ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} 변경사항 저장
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
           <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
        ) : editMode ? (
           <>
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 text-[14px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-5 w-32 text-center">전투력 순위</th>
                    <th className="px-6 py-5">캐릭터명</th>
                    <th className="px-6 py-5 w-24 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[15px]">
                  {draftMembers.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3">
                        <input type="number" value={m.power_rank ?? ''} onChange={(e) => handleDraftChange(idx, 'power_rank', e.target.value)} className="w-full text-center px-3 py-2 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-blue-600 dark:text-blue-400 font-bold outline-none transition-all" />
                      </td>
                      <td className="px-6 py-3">
                        <input type="text" value={m.character_name} onChange={(e) => handleDraftChange(idx, 'character_name', e.target.value)} className="w-full px-3 py-2 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-bold outline-none transition-all" />
                      </td>
                      <td className="px-6 py-3 text-center">
                         <button onClick={() => removeRow(idx)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                           <Trash2 className="w-4 h-4"/>
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                 <button onClick={addRow} className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-blue-600 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-bold text-[14px]">
                   <Plus className="w-4 h-4" /> 수동으로 멤버 한 명 추가
                 </button>
              </div>
           </>
        ) : members.length === 0 ? (
           <div className="py-20 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl m-10">우측 상단의 외부 갱신하기 버튼을 눌러 최초 1회 길드원 정보를 스크래핑해주세요.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 text-[14px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-5 w-28 text-center whitespace-nowrap">전투력<br/>순위</th>
                <th className="px-6 py-5 whitespace-nowrap">캐릭터명</th>
                <th className="px-4 py-5">
                  <div className="flex items-center gap-1.5">
                    <span>컨텐츠 티어 기록</span>
                    <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500 normal-case">(최신순 · 호버 시 상세)</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[15px]">
              {members.map((m, idx) => {
                const tiers = tierMap[m.character_name] ?? [];
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-center text-blue-600 dark:text-blue-400 font-bold">{m.power_rank}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 dark:text-white text-[16px]">{m.character_name}</span>
                    </td>
                    <td className="px-4 py-3">
                      {tiers.length === 0 ? (
                        <span className="text-slate-300 dark:text-slate-600 text-[13px] font-medium">기록 없음</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {tiers.map((entry, i) => (
                            <TierBadge key={i} entry={entry} />
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

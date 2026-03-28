"use client";

import { SheetData, Record } from "@/types";

export default function RecordViewer({ 
  contentName,
  record, 
  sheetData, 
  isServerContent,
  actions
}: { 
  contentName: string;
  record: Record;
  sheetData: SheetData[];
  isServerContent: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto py-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between px-1">
          <span className="text-lg font-bold text-blue-500 dark:text-blue-400">📁 {contentName}</span>
          <div className="flex gap-3">
            {actions}
          </div>
        </div>
        <h2 className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-2xl font-bold text-slate-900 dark:text-white shadow-sm">
          {record.title}
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 text-[14px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isServerContent ? (
                  <>
                    <th className="px-3 py-4 w-16 text-center leading-tight">전체<br/>랭킹</th>
                    <th className="px-4 py-4 min-w-[120px]">캐릭터명</th>
                    <th className="px-3 py-4 w-16 text-center leading-tight border-l border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-900/10">매왕<br/>등수</th>
                    <th className="px-3 py-4 w-20 text-center leading-tight bg-blue-50/50 dark:bg-blue-900/10">컨텐츠<br/>등수</th>
                    <th className="px-2 py-4 w-28 text-center leading-tight">등수 차이<br/><span className="text-[10px] opacity-80 decoration-none font-medium">(매왕/컨텐츠)</span></th>
                    <th className="px-3 py-4 w-16 text-center">판정</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-5 w-20 text-center leading-tight">길드<br/>순위</th>
                    <th className="px-6 py-5 min-w-[120px]">캐릭터명</th>
                    <th className="px-6 py-5 w-32 border-l border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-900/10">매왕 등수</th>
                    <th className="px-4 py-5 w-28 text-center whitespace-nowrap">등수 차이</th>
                    <th className="px-4 py-5 w-24 text-center">판정</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[15px]">
              {(() => {
                const validRanks = sheetData
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

                return sheetData.map((row, idx) => {
                  const isAbsent = row.content_rank === -1;

                  if (isServerContent) {
                    return (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-3 py-3 text-center text-slate-700 dark:text-slate-300 font-bold">{row.power_rank ?? '-'}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 dark:text-white text-[16px]">{row.character_name}</span>
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-blue-600 dark:text-blue-400 border-l border-slate-200 dark:border-slate-800 bg-blue-50/10 dark:bg-blue-900/5">
                          {isAbsent ? <span className="text-slate-400 text-[13px] font-medium">미참여</span> : (getGuildContentRank(row.content_rank) ?? '-')}
                        </td>
                        <td className="px-3 py-3 text-center font-bold text-blue-600 dark:text-blue-400 bg-blue-50/10 dark:bg-blue-900/5">
                          {isAbsent ? '-' : (row.content_rank ?? '-')}
                        </td>
                        <td className="px-2 py-3 text-center font-bold text-[14px]">
                          {!isAbsent ? (() => {
                            const guildRank = idx + 1;
                            const guildContentRank = getGuildContentRank(row.content_rank)!;
                            const guildDiff = guildRank - guildContentRank;
                            const serverDiff = (row.power_rank !== null && row.content_rank !== null && row.content_rank !== -1)
                              ? row.power_rank - row.content_rank
                              : null;
                            return (
                              <div className="flex flex-col md:flex-row items-center justify-center gap-1">
                                <span className={guildDiff >= 0 ? "text-emerald-500" : "text-red-500"}>{guildDiff > 0 ? `+${guildDiff}` : guildDiff}</span>
                                <span className="text-slate-300 hidden md:inline">/</span>
                                {serverDiff !== null && (
                                  <span className={serverDiff >= 0 ? "text-emerald-500" : "text-red-500"}>{serverDiff > 0 ? `+${serverDiff}` : serverDiff}</span>
                                )}
                              </div>
                            )
                          })() : '-'}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {isAbsent ? (
                            <span className="px-3 py-1.5 rounded-full text-[13px] font-bold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">-</span>
                          ) : row.grade && (
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
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 text-center">
                        {row.power_rank ?? '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 dark:text-white text-[16px]">{row.character_name}</span>
                      </td>
                      <td className="px-6 py-4 border-l border-slate-100 dark:border-slate-800 bg-blue-50/10 dark:bg-blue-900/5 font-bold text-center text-[16px]">
                        {isAbsent
                          ? <span className="text-slate-400 text-[13px] font-medium">미참여</span>
                          : <span className="text-blue-600 dark:text-blue-400">{row.content_rank ?? '-'}</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        {(() => {
                           const rankDiff = (row.power_rank !== null && row.content_rank !== null && row.content_rank !== -1)
                             ? row.power_rank - row.content_rank
                             : null;
                           return rankDiff !== null && !isAbsent ? (
                             <span className={rankDiff >= 0 ? "text-emerald-500" : "text-red-500"}>
                               {rankDiff > 0 ? `+${rankDiff}` : rankDiff}
                             </span>
                           ) : null;
                        })()}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {isAbsent ? (
                          <span className="px-4 py-1.5 rounded-full text-[14px] font-bold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 whitespace-nowrap">-</span>
                        ) : row.grade && (
                          <span className={`px-4 py-1.5 rounded-full text-[14px] font-bold whitespace-nowrap ${
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
    </div>
  );
}

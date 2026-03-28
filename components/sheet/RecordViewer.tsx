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
                <th className="px-6 py-5 w-16 text-center">#</th>
                <th className="px-4 py-5 w-20 text-center leading-tight">
                  전투력<br/>순위
                </th>
                <th className="px-6 py-5">캐릭터명</th>
                <th className="px-6 py-5 w-32 border-l border-slate-200 dark:border-slate-800 bg-blue-50/50 dark:bg-blue-900/10">컨텐츠 등수</th>
                <th className="px-6 py-5 w-28 text-center">등수 차이</th>
                <th className="px-6 py-5 w-32 text-center">판정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[15px]">
              {sheetData.map((row, idx) => {
                const rankDiff = (row.power_rank !== null && row.content_rank !== null && row.content_rank !== -1)
                  ? row.power_rank - row.content_rank
                  : null;
                const isAbsent = row.content_rank === -1;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-center text-slate-400 font-medium">{idx + 1}</td>
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
                      {rankDiff !== null && (
                        <span className={rankDiff >= 0 ? "text-emerald-500" : "text-red-500"}>
                          {rankDiff > 0 ? `+${rankDiff}` : rankDiff}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isAbsent ? (
                        <span className="px-4 py-1.5 rounded-full text-[14px] font-bold bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">-</span>
                      ) : row.grade && (
                        <span className={`px-4 py-1.5 rounded-full text-[14px] font-bold ${
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

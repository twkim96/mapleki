"use client";

import Link from 'next/link';
import { List, Trash2, ChevronDown, ChevronRight, FilePlus2, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SidebarContentLink({ content, records, isLoggedIn }: any) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = prompt(`이 컨텐츠와 관련된 모든 시트 기록이 완전히 삭제됩니다.\n삭제하시려면 "삭제한다" 라고 정확히 입력해주세요.`);
    if (result === "삭제한다") {
      try {
        await fetch(`/api/contents?id=${content.id}`, { method: 'DELETE' });
        router.refresh();
      } catch(err) {
        alert("삭제 실패");
      }
    } else {
      alert("삭제가 취소되었습니다.");
    }
  };

  const toggleExpand = () => setExpanded(!expanded);

  return (
    <div className="flex flex-col">
      <button onClick={toggleExpand} className="group relative flex items-center justify-between px-4 py-3.5 rounded-2xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all w-full">
        <div className="flex items-center gap-4">
           {expanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          <span className="font-semibold text-[15px] truncate max-w-[130px]">{content.name}</span>
        </div>
        {isLoggedIn && (
          <div 
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-50 hover:text-red-500 text-slate-400 transition-all z-10"
            title="컨텐츠 삭제"
          >
            <Trash2 className="w-[15px] h-[15px]" />
          </div>
        )}
      </button>

      {expanded && (
        <div className="flex flex-col ml-8 mr-2 mt-1 space-y-1 mb-2">
          {/* 게시판 홈 / 새기록지 */}
          <Link href={`/${content.id}`} className="flex items-center gap-2 py-2 px-3 text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <LayoutDashboard className="w-3.5 h-3.5" /> 전체 기록 게시판
          </Link>

          {isLoggedIn && (
            <Link href={`/${content.id}/new`} className="flex items-center gap-2 py-2 px-3 text-[13px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors">
              <FilePlus2 className="w-3.5 h-3.5" /> 새 기록 추가하기
            </Link>
          )}

          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />

          {/* Records List */}
          {records && records.map((r: any) => (
            <Link key={r.id} href={`/${content.id}/${r.id}`} className="flex items-center gap-2 py-2 px-3 text-[13px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors truncate">
              {r.title}
            </Link>
          ))}
          {records && records.length === 0 && (
            <div className="py-2 px-3 text-[12px] text-slate-400 pl-4">등록된 시트가 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}

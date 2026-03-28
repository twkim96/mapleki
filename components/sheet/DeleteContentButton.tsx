"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteContentButton({ contentId, contentName }: { contentId: string; contentName: string }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    const result = prompt(`"${contentName}" 컨텐츠와 모든 기록이 완전히 삭제됩니다.\n삭제하시려면 "삭제한다" 라고 정확히 입력해주세요.`);
    if (result !== "삭제한다") {
      alert("삭제가 취소되었습니다.");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/contents?id=${contentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("삭제 실패");
      router.push('/');
      router.refresh();
    } catch (e: any) {
      alert(e.message);
      setDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      title="컨텐츠 삭제"
      className="group flex items-center h-[42px] max-w-[42px] hover:max-w-[200px] px-[11px] rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-all duration-300 overflow-hidden disabled:opacity-50"
    >
      {deleting ? <Loader2 className="w-5 h-5 flex-shrink-0 animate-spin" /> : <Trash2 className="w-5 h-5 flex-shrink-0" />}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap text-[14px] font-bold ml-2">컨텐츠 삭제</span>
    </button>
  );
}

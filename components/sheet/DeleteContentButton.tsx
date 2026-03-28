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
      disabled={deleting}
      className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors font-bold text-[14px] disabled:opacity-50"
    >
      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      컨텐츠 삭제
    </button>
  );
}

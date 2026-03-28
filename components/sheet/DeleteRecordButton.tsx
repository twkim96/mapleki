"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DeleteRecordButton({ recordId, contentId }: { recordId: string; contentId: string }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("이 기록을 삭제하시겠습니까? 삭제 후 복구가 불가합니다.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/records?recordId=${recordId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "삭제 실패");
      router.push(`/${contentId}`);
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
      title="기록 삭제"
      className="flex items-center justify-center w-[42px] h-[42px] rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
    >
      {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
    </button>
  );
}

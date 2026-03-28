"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Download, Copy, X, Loader2, Check } from "lucide-react";
import html2canvas from "html2canvas";
import { Record, SheetData } from "@/types";

function getGradeStyle(grade: string): React.CSSProperties {
  if (grade === "양호") return { backgroundColor: "#d1fae5", color: "#047857", fontWeight: "bold" };
  if (grade === "주의") return { backgroundColor: "#fef3c7", color: "#b45309", fontWeight: "bold" };
  if (grade === "위험") return { backgroundColor: "#fee2e2", color: "#b91c1c", fontWeight: "bold" };
  return { color: "#94a3b8" };
}

function getDiffStyle(diff: number): React.CSSProperties {
  return diff >= 0
    ? { color: "#10b981", fontWeight: "bold" }
    : { color: "#ef4444", fontWeight: "bold" };
}

export default function ShareButton({ 
  contentName, 
  record, 
  sheetData,
  isServerContent
}: { 
  contentName: string;
  record: Record;
  sheetData: SheetData[];
  isServerContent?: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const getCanvas = useCallback(async () => {
    if (!captureRef.current) throw new Error("캡처 대상 없음");
    await new Promise(resolve => setTimeout(resolve, 300));
    return html2canvas(captureRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());
      }
    });
  }, []);

  const handleDownload = async () => {
    setCapturing(true);
    try {
      const canvas = await getCanvas();
      const image = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = image;
      a.download = `${contentName}_${record.title}_리포트.png`;
      a.click();
    } catch (e) {
      console.error(e);
      alert("이미지 캡처 중 오류가 발생했습니다.");
    } finally {
      setCapturing(false);
    }
  };

  const handleCopy = async () => {
    setCapturing(true);
    try {
      const canvas = await getCanvas();
      canvas.toBlob(async (blob) => {
        if (!blob) { alert("클립보드 복사 실패"); setCapturing(false); return; }
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          alert("클립보드 복사가 지원되지 않는 브라우저입니다.\n다운로드를 이용해주세요.");
        }
        setCapturing(false);
      }, "image/png");
    } catch (e) {
      console.error(e);
      alert("이미지 캡처 중 오류가 발생했습니다.");
      setCapturing(false);
    }
  };

  const displayTitle = record.title || "기록";
  const powerLabel = isServerContent ? "전투력 순위 (서버)" : "전투력 순위 (길드)";

  // RecordViewer와 동일한 row 데이터 구성 (빈 row 제거)
  const rows = sheetData.map((row, idx) => {
    const rankDiff = (row.power_rank !== null && row.content_rank !== null && row.content_rank !== -1)
      ? row.power_rank - row.content_rank
      : null;
    const isAbsent = row.content_rank === -1;
    return {
      idx: idx + 1,
      powerRank: row.power_rank,
      characterName: row.character_name,
      contentRank: row.content_rank,
      rankDiff,
      isAbsent,
      grade: row.grade
    };
  });

  // 가로 모드: 절반으로 나누기
  const half = Math.ceil(rows.length / 2);
  const leftRows = isWide ? rows.slice(0, half) : rows;
  const rightRows = isWide ? rows.slice(half) : [];

  const thStyle: React.CSSProperties = { padding: '8px 6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 'bold' };
  const tdStyle: React.CSSProperties = { padding: '7px 6px', border: '1px solid #e2e8f0', fontSize: '13px' };

  const renderTable = (tableRows: typeof rows) => (
    <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse', color: '#000000' }}>
      <thead>
        <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #94a3b8' }}>
          <th style={{ ...thStyle, width: '36px', backgroundColor: '#e2e8f0' }}>#</th>
          <th style={{ ...thStyle }}>{powerLabel}</th>
          <th style={{ ...thStyle }}>캐릭터명</th>
          <th style={{ ...thStyle, backgroundColor: '#eff6ff' }}>컨텐츠 등수</th>
          <th style={{ ...thStyle, width: '64px' }}>등수 차이</th>
          <th style={{ ...thStyle, width: '56px' }}>판정</th>
        </tr>
      </thead>
      <tbody>
        {tableRows.map((row) => (
          <tr key={row.idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ ...tdStyle, backgroundColor: '#f1f5f9', fontWeight: 'bold', color: '#94a3b8' }}>{row.idx}</td>
            <td style={{ ...tdStyle, fontWeight: 'bold', color: '#334155' }}>{row.powerRank ?? '-'}</td>
            <td style={{ ...tdStyle, fontWeight: 'bold', color: '#0f172a', textAlign: 'left', paddingLeft: '10px' }}>{row.characterName}</td>
            <td style={{ ...tdStyle, backgroundColor: '#f0f9ff', fontWeight: 'bold', color: row.isAbsent ? '#94a3b8' : '#2563eb' }}>
              {row.isAbsent ? '미참여' : (row.contentRank ?? '-')}
            </td>
            <td style={{ ...tdStyle, ...(row.rankDiff !== null ? getDiffStyle(row.rankDiff) : { color: '#cbd5e1' }) }}>
              {row.rankDiff !== null ? (row.rankDiff > 0 ? `+${row.rankDiff}` : row.rankDiff) : '-'}
            </td>
            <td style={{ ...tdStyle, ...(row.grade ? getGradeStyle(row.grade) : { color: '#cbd5e1' }), borderRadius: '0' }}>
              {row.isAbsent ? '-' : (row.grade || '-')}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400 dark:hover:bg-blue-900/60 transition-colors font-bold text-[14px]"
      >
        <Camera className="w-4 h-4" />
        공유용 이미지
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5" /> 공유 이미지 미리보기
              </h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsWide(!isWide)} 
                  className="px-3 py-1.5 rounded-lg text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  {isWide ? "세로 모드" : "가로 모드"}
                </button>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className={`p-6 bg-slate-100 dark:bg-slate-950 flex-1 ${isWide ? 'overflow-auto' : 'overflow-y-auto'}`}>
              <div className="flex justify-center min-h-max pb-4">
                {/* ⚠️ CAPTURE ZONE: Tailwind 금지, 100% inline style ⚠️ */}
                <div 
                  ref={captureRef}
                  style={{ 
                    width: isWide ? '1100px' : '620px',
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    backgroundColor: '#ffffff'
                  }}
                >
                  {/* Header */}
                  <div style={{ 
                    backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'center', 
                    padding: '14px 0', fontSize: '22px', fontWeight: 'bold', letterSpacing: '0.03em' 
                  }}>
                    📁 {contentName} — {displayTitle}
                  </div>

                  {/* Table */}
                  <div style={{ 
                    display: isWide ? 'grid' : 'block',
                    gridTemplateColumns: isWide ? '1fr 1fr' : undefined,
                    gap: isWide ? '0' : undefined,
                    backgroundColor: '#ffffff', 
                    border: '2px solid #cbd5e1'
                  }}>
                    <div style={{ width: '100%', borderRight: isWide ? '2px solid #cbd5e1' : undefined }}>
                      {renderTable(leftRows)}
                    </div>
                    {rightRows.length > 0 && (
                      <div style={{ width: '100%' }}>
                        {renderTable(rightRows)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-3 bg-white dark:bg-slate-900">
              <button 
                onClick={handleCopy} disabled={capturing}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-[15px] hover:bg-emerald-700 active:scale-[0.98] transition-all flex-1 max-w-xs justify-center shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {capturing ? <><Loader2 className="w-5 h-5 animate-spin" /> 복사 중...</> : copied ? <><Check className="w-5 h-5" /> 복사 완료!</> : <><Copy className="w-5 h-5" /> 클립보드 복사</>}
              </button>
              <button 
                onClick={handleDownload} disabled={capturing}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold text-[15px] hover:bg-blue-700 active:scale-[0.98] transition-all flex-1 max-w-xs justify-center shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {capturing ? <><Loader2 className="w-5 h-5 animate-spin" /> 저장 중...</> : <><Download className="w-5 h-5" /> 이미지 저장</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

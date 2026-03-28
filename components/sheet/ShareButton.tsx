"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Download, Copy, X, Loader2, Check } from "lucide-react";
import html2canvas from "html2canvas";
import { Record, SheetData } from "@/types";

// changeClass를 Tailwind 대신 순수 inline style 객체로 반환
function getChangeStyle(change: string): React.CSSProperties {
  if (change.startsWith("▲")) {
    return { backgroundColor: "#22c55e", color: "#000000", fontWeight: "bold" };
  } else if (change.startsWith("▼")) {
    return { backgroundColor: "#fca5a5", color: "#000000", fontWeight: "bold" };
  }
  return { backgroundColor: "#ffffff", color: "#000000" };
}

export default function ShareButton({ 
  contentName, 
  record, 
  sheetData 
}: { 
  contentName: string;
  record: Record;
  sheetData: SheetData[];
}) {
  const [showModal, setShowModal] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  // 캡처 공통 로직 (canvas 반환)
  const getCanvas = useCallback(async () => {
    if (!captureRef.current) throw new Error("캡처 대상 없음");
    await new Promise(resolve => setTimeout(resolve, 300));
    return html2canvas(captureRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (clonedDoc) => {
        // 핵심 수정: html2canvas는 부모 요소의 computed style도 전부 파싱함.
        // Tailwind CSS v4는 lab() 색상 함수를 사용하는데 html2canvas가 이를 지원하지 않음.
        // 클론된 문서에서 모든 스타일시트를 제거하면 lab() 파싱 자체가 발생하지 않음.
        // 캡처 영역은 100% inline style이므로 스타일시트 없이도 정상 렌더링됨.
        clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());
      }
    });
  }, []);

  // 다운로드
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

  // 클립보드 복사
  const handleCopy = async () => {
    setCapturing(true);
    try {
      const canvas = await getCanvas();
      canvas.toBlob(async (blob) => {
        if (!blob) { alert("클립보드 복사 실패"); setCapturing(false); return; }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ]);
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

  // 날짜 포맷
  const dateObj = new Date(record.created_at);
  const formattedDate = `${String(dateObj.getFullYear()).slice(2)}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
  const displayTitle = record.title || "기록";

  // 실제 데이터가 있는 row 수만큼만 (빈 row 제거)
  const actualMemberCount = sheetData.length;
  const maxRows = actualMemberCount > 0 ? actualMemberCount : 1;

  // 행 생성: sheetData를 power_rank 순으로 정렬 후 1~N 매핑
  const sortedByPower = [...sheetData].sort((a, b) => (a.power_rank || 999) - (b.power_rank || 999));

  const rows = sortedByPower.map((row, idx) => {
    const rank = idx + 1;
    let change = "=";

    if (row.content_rank && row.power_rank !== null) {
      if (row.power_rank !== row.content_rank) {
        const diff = row.power_rank - row.content_rank;
        if (diff > 0) {
          change = `▲${diff}`;
        } else if (diff < 0) {
          change = `▼${Math.abs(diff)}`;
        }
      }
    } else if (!row.content_rank) {
      change = "-";
    }

    // content_rank로 최종 순위 칸에 들어갈 이름 찾기
    const contentRankHolder = sheetData.find(d => d.content_rank === rank);

    return {
      rank,
      powerName: row.character_name || "-",
      change,
      finalName: contentRankHolder?.character_name || "-",
      grade: row.grade || "-"
    };
  });

  // 가로 모드용 분할
  const half = Math.ceil(rows.length / 2);
  const leftRows = isWide ? rows.slice(0, half) : rows;
  const rightRows = isWide ? rows.slice(half) : [];

  const renderTable = (tableRows: typeof rows) => (
    <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse', color: '#000000', fontSize: '14px' }}>
      <thead>
        <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', borderBottom: '2px solid #000000' }}>
          <th style={{ padding: '8px 4px', border: '1px solid #cbd5e1', backgroundColor: '#000000', color: '#ffffff', width: '50px', letterSpacing: '0.05em', fontSize: '13px' }}>
            {formattedDate}
          </th>
          <th style={{ padding: '8px 4px', border: '1px solid #cbd5e1', fontSize: '13px' }}>전투력 순위</th>
          <th style={{ padding: '8px 4px', border: '1px solid #cbd5e1', width: '70px', fontSize: '13px' }}>순위 변동</th>
          <th style={{ padding: '8px 4px', border: '1px solid #cbd5e1', fontSize: '13px' }}>최종 순위</th>
          <th style={{ padding: '8px 4px', border: '1px solid #cbd5e1', width: '60px', fontSize: '13px' }}>판정</th>
        </tr>
      </thead>
      <tbody>
        {tableRows.map((row) => (
          <tr key={row.rank} style={{ borderBottom: '1px solid #e2e8f0' }}>
            <td style={{ padding: '8px 4px', border: '1px solid #cbd5e1', backgroundColor: '#e2e8f0', fontWeight: 'bold', fontSize: '13px' }}>
              {row.rank}
            </td>
            <td style={{ padding: '8px 6px', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>
              {row.powerName}
            </td>
            <td style={{ padding: '4px 4px', border: '1px solid #cbd5e1', ...getChangeStyle(row.change) }}>
              {row.change}
            </td>
            <td style={{ padding: '8px 6px', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap' }}>
              {row.finalName}
            </td>
            <td style={{ padding: '8px 4px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 'bold' }}>
              {row.grade}
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
            
            {/* Modal Header */}
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

            {/* Preview Area */}
            <div className={`p-6 bg-slate-100 dark:bg-slate-950 flex-1 ${isWide ? 'overflow-auto' : 'overflow-y-auto'}`}>
              <div className="flex justify-center min-h-max pb-4">
                {/* 
                  ⚠️ CAPTURE ZONE ⚠️
                  html2canvas 호환성을 위해 이 안에서는 Tailwind className을 절대 사용하지 않음.
                  모든 스타일은 inline style(Hex 색상 코드)로만 적용.
                */}
                <div 
                  ref={captureRef}
                  style={{ 
                    width: isWide ? '1100px' : '580px',
                    fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
                    backgroundColor: '#ffffff'
                  }}
                >
                  {/* Header Bar */}
                  <div style={{ 
                    backgroundColor: '#0f172a', 
                    color: '#ffffff', 
                    textAlign: 'center', 
                    padding: '16px 0', 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    letterSpacing: '0.03em' 
                  }}>
                    {contentName} - {displayTitle}
                  </div>

                  {/* Table Area */}
                  <div style={{ 
                    display: isWide ? 'grid' : 'block',
                    gridTemplateColumns: isWide ? '1fr 1fr' : undefined,
                    gap: isWide ? '2px' : undefined,
                    backgroundColor: '#ffffff', 
                    color: '#000000', 
                    border: '2px solid #cbd5e1'
                  }}>
                    <div style={{ width: '100%' }}>
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

            {/* Action Buttons */}
            <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex justify-center gap-3 bg-white dark:bg-slate-900">
              <button 
                onClick={handleCopy}
                disabled={capturing}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-[15px] hover:bg-emerald-700 active:scale-[0.98] transition-all flex-1 max-w-xs justify-center shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {capturing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 복사 중...</>
                ) : copied ? (
                  <><Check className="w-5 h-5" /> 복사 완료!</>
                ) : (
                  <><Copy className="w-5 h-5" /> 클립보드 복사</>
                )}
              </button>
              <button 
                onClick={handleDownload}
                disabled={capturing}
                className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold text-[15px] hover:bg-blue-700 active:scale-[0.98] transition-all flex-1 max-w-xs justify-center shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {capturing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> 저장 중...</>
                ) : (
                  <><Download className="w-5 h-5" /> 이미지 저장</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

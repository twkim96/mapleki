"use client";

import { useState, useRef } from "react";
import { Camera, Download, X, Loader2 } from "lucide-react";
import html2canvas from "html2canvas";
import { Record, SheetData } from "@/types";

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
  const [isWide, setIsWide] = useState(false); // 가로 모드 (폰/웹용)
  const captureRef = useRef<HTMLDivElement>(null);

  const handleCapture = async () => {
    if (!captureRef.current) return;
    setCapturing(true);
    try {
      // 대기 시간을 줘서 렌더링을 완전히 보장
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(captureRef.current, {
        scale: 2, // 해상도 2배 (레티나, 고화질용)
        useCORS: true,
        backgroundColor: "#ffffff", // 이미지 백그라운드 색을 흰색으로 고정
        logging: false
      });
      
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

  // 날짜 파싱 (26.03.21 포맷)
  const dateObj = new Date(record.created_at);
  const formattedDate = `${String(dateObj.getFullYear()).slice(2)}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
  
  // Title (Record.title or Date)
  const displayTitle = record.title || "기록";

  // Data join by Index (1 to 30)
  const maxRows = Math.max(
    ...sheetData.map(d => d.power_rank || 1), 
    ...sheetData.map(d => d.content_rank || 1), 
    30
  );

  const rows = Array.from({ length: maxRows }, (_, i) => {
    const rank = i + 1;
    const powerRow = sheetData.find(d => d.power_rank === rank);
    const contentRow = sheetData.find(d => d.content_rank === rank);
    
    let change = "=";
    let changeClass = "bg-[#ffffff] text-[#000000] font-medium";
    
    if (powerRow) {
      if (powerRow.content_rank && powerRow.power_rank !== null && powerRow.power_rank !== powerRow.content_rank) {
        const diff = powerRow.power_rank - powerRow.content_rank;
        if (diff > 0) {
          change = `▲${diff}`;
          changeClass = "bg-[#22c55e] text-[#000] font-bold"; // 진한 초록색
        } else if (diff < 0) {
          change = `▼${Math.abs(diff)}`;
          changeClass = "bg-[#fca5a5] text-[#000] font-bold"; // 연한 빨간/핑크
        }
      } else if (!powerRow.content_rank) {
         change = "-";
      }
    }

    return {
      rank,
      powerName: powerRow?.character_name || "-",
      change,
      changeClass,
      finalName: contentRow?.character_name || "-",
      grade: powerRow?.grade || "-" // 전순위자 기준의 판정 (양호/주의/위험 등)
    };
  });

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
                  {isWide ? "세로 모드 (스크롤)" : "가로 모드 (한 눈에)"}
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
               <div className="flex justify-center min-h-max pb-8">
                {/* 
                  Capture Area: 
                  html2canvas 오류(lab 등 미지원 색상 함수) 방지를 위해 철저히 Hex 코드 inline-style 사용 
                */}
                <div 
                  ref={captureRef}
                  style={{ 
                    width: isWide ? '1200px' : '650px',
                    fontFamily: "'Nanum Gothic', 'Malgun Gothic', sans-serif",
                    backgroundColor: '#ffffff'
                  }}
                >
                  {/* Header */}
                  <div style={{ backgroundColor: '#000000', color: '#ffffff', textAlign: 'center', padding: '20px 0', fontSize: '32px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                    {contentName} - {displayTitle}
                  </div>

                  {/* Table Wrapper (Grid) */}
                  <div style={{ display: 'grid', gridTemplateColumns: isWide ? '1fr 1fr' : '1fr', gap: isWide ? '4px' : '0', padding: isWide ? '8px' : '0', backgroundColor: '#ffffff', color: '#000000', border: '2px solid #e2e8f0' }}>
                    
                    {/* Table Render Logic: Split rows if wide mode */}
                    {[(isWide ? rows.slice(0, Math.ceil(maxRows/2)) : rows), (isWide ? rows.slice(Math.ceil(maxRows/2)) : [])].map((colRows, colIndex) => {
                      if (colRows.length === 0) return null;
                      return (
                        <div key={colIndex} style={{ width: '100%' }}>
                          <table style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse', color: '#000000', fontSize: '15px' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f1f5f9', fontWeight: 'bold', borderBottom: '1px solid #000000' }}>
                                <th style={{ padding: '8px 0', border: '1px solid #cbd5e1', backgroundColor: '#000000', color: '#ffffff', width: '80px', letterSpacing: '0.05em', fontSize: '14px' }}>
                                  {formattedDate}
                                </th>
                                <th style={{ padding: '8px 0', border: '1px solid #cbd5e1', width: '144px', fontSize: '15px' }}>전투력 순위</th>
                                <th style={{ padding: '8px 0', border: '1px solid #cbd5e1', width: '96px', fontSize: '15px' }}>순위 변동</th>
                                <th style={{ padding: '8px 0', border: '1px solid #cbd5e1', width: '144px', fontSize: '15px' }}>최종 순위</th>
                                <th style={{ padding: '8px 0', border: '1px solid #cbd5e1', width: '96px', fontSize: '15px' }}>판정</th>
                              </tr>
                            </thead>
                            <tbody>
                              {colRows.map((row) => (
                                <tr key={row.rank} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                  {/* Rank Index */}
                                  <td style={{ padding: '10px 0', border: '1px solid #cbd5e1', backgroundColor: '#e2e8f0', fontWeight: 'bold', fontSize: '14px' }}>
                                    {row.rank}
                                  </td>
                                  
                                  {/* Power Name */}
                                  <td style={{ padding: '10px 0', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '15px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <span style={{ padding: '0 8px' }}>{row.powerName}</span>
                                  </td>
                                  
                                  {/* Rank Change (Colored Box) */}
                                  <td style={{ padding: '4px 0', border: '1px solid #cbd5e1' }} className={row.changeClass}>
                                    {row.change}
                                  </td>
                                  
                                  {/* Final Content Name */}
                                  <td style={{ padding: '10px 0', border: '1px solid #cbd5e1', fontWeight: 'bold', fontSize: '15px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <span style={{ padding: '0 8px' }}>{row.finalName}</span>
                                  </td>
                                  
                                  {/* Grade / Tier */}
                                  <td style={{ padding: '10px 0', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold' }}>
                                    {row.grade}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )
                    })}
                  </div>
                </div>
               </div>
            </div>

            <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 flex justify-center bg-white dark:bg-slate-900">
               <button 
                 onClick={handleCapture}
                 disabled={capturing}
                 className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-bold text-[16px] hover:bg-blue-700 active:scale-[0.98] transition-all w-full max-w-sm justify-center shadow-lg shadow-blue-500/20 disabled:opacity-50"
               >
                 {capturing ? <><Loader2 className="w-5 h-5 animate-spin" /> 사진 찍는 중...</> : <><Download className="w-5 h-5" /> 고화질 이미지로 저장하기</>}
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

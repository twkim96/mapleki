"use client";
import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

interface RankItem {
  id: string;
  character_name: string;
  absent: boolean;
}

interface RowData {
  character_name: string;
  content_rank: number | null;
  power_rank: number | null;
  rank_diff: number | null;
  grade: string | null;
}

function SortableItem({ id, character_name, index, onMoveUp, onMoveDown, onToggleAbsent, isFirst, isLast, absent, absentCount }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id, disabled: absent });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(absent ? {} : { ...attributes, ...listeners })}
      className={`flex items-center gap-3 p-2.5 rounded-xl border shadow-sm mb-2 group touch-none select-none ${
        absent
          ? 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60 cursor-default'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* 미참여(X) 토글 버튼 */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onToggleAbsent(id)}
        title={absent ? '참여 복원' : '미참여 처리'}
        className={`p-1.5 rounded-lg transition-colors flex-none ${
          absent
            ? 'bg-red-100 text-red-500 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-500 dark:bg-slate-700 dark:text-slate-500 dark:hover:bg-red-900/30 dark:hover:text-red-400'
        }`}
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* 드래그 핸들 */}
      <div className={`p-1 ${absent ? 'text-slate-300 dark:text-slate-600' : 'text-slate-400 hover:text-blue-500'}`}>
        <GripVertical className="w-5 h-5" />
      </div>

      {/* 등수 배지 */}
      <div className={`font-bold w-10 text-center py-1 rounded-lg text-sm flex-none ${
        absent
          ? 'text-slate-400 bg-slate-200 dark:bg-slate-700 dark:text-slate-500'
          : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
      }`}>
        {absent ? '-' : `${index - absentCount + 1}위`}
      </div>

      {/* 이름 */}
      <div className={`flex-1 font-bold text-[15px] pl-1 pointer-events-none ${
        absent ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-200'
      }`}>
        {character_name}
        {absent && <span className="ml-2 text-[11px] font-normal text-red-400 no-underline">[미참여]</span>}
      </div>

      {/* 위/아래 버튼 (참여자만) */}
      {!absent && (
        <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button disabled={isFirst} onPointerDown={(e) => e.stopPropagation()} onClick={() => onMoveUp(index)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 rounded disabled:opacity-30 transition-colors"><ChevronUp className="w-4 h-4" /></button>
          <button disabled={isLast} onPointerDown={(e) => e.stopPropagation()} onClick={() => onMoveDown(index)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 rounded disabled:opacity-30 transition-colors"><ChevronDown className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

export default function EasyRankModal({ isOpen, onClose, rows, onApply }: { isOpen: boolean, onClose: () => void, rows: RowData[], onApply: (ordered: string[], absentNames: string[]) => void }) {
  const [items, setItems] = useState<RankItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      // 기 입력된 content_rank 기준으로 정렬:
      // 1) content_rank 있는 참여자 → content_rank 오름차순
      // 2) content_rank 없는 (null) 참여자 → 전투력 순위(원래 순서) 유지
      // 3) 미참여(-1) → 맨 아래
      const participants = rows
        .filter(r => r.content_rank !== -1)
        .sort((a, b) => {
          const aRank = a.content_rank;
          const bRank = b.content_rank;
          if (aRank !== null && bRank !== null) return aRank - bRank;
          if (aRank !== null) return -1; // a가 설정됨 → 앞으로
          if (bRank !== null) return 1;  // b가 설정됨 → 앞으로
          return 0; // 둘 다 null → 원래 순서 유지
        });
      const absentees = rows.filter(r => r.content_rank === -1);
      const sorted = [...participants, ...absentees];
      setItems(sorted.map(r => ({ id: r.character_name, character_name: r.character_name, absent: r.content_rank === -1 })));
    }
  }, [isOpen, rows]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex(i => i.id === active.id);
        const newIndex = items.findIndex(i => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const moveUp = (idx: number) => {
    // 참여자 중에서만 위로 이동
    if (idx > 0) setItems(items => arrayMove(items, idx, idx - 1));
  };
  const moveDown = (idx: number) => {
    // 마지막 참여자 이하로만 이동
    const lastParticipant = items.findLastIndex(i => !i.absent);
    if (idx < lastParticipant) setItems(items => arrayMove(items, idx, idx + 1));
  };

  const toggleAbsent = (id: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      // 미참여로 만들면 맨 아래로 이동
      if (!item.absent) {
        const filtered = prev.filter(i => i.id !== id);
        return [...filtered, { ...item, absent: true }];
      }
      // 참여 복원: 미참여 목록 앞(참여자 뒤)으로 이동
      const participants = prev.filter(i => !i.absent && i.id !== id);
      const absentOthers = prev.filter(i => i.absent && i.id !== id);
      return [...participants, { ...item, absent: false }, ...absentOthers];
    });
  };

  if (!isOpen) return null;

  const participants = items.filter(i => !i.absent);
  const absentees = items.filter(i => i.absent);
  // 인덱스: 전체 items 기준이지만 위/아래 버튼은 참여자 내부 순서
  const absentCount = 0; // 참여자 기준 표시용 (idx 자체가 참여자 인덱스)

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] w-full max-w-lg flex flex-col h-[85vh] shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">✨ 편하게 순위 배정하기</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              드래그하거나 화살표로 순위 조정 · X 버튼으로 미참여 처리 ({participants.length}명 참여 / {absentees.length}명 미참여)
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"><X className="w-6 h-6"/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-slate-50 dark:bg-slate-950/50">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {items.map((item, idx) => (
                <SortableItem
                  key={item.id}
                  id={item.id}
                  character_name={item.character_name}
                  index={idx}
                  absent={item.absent}
                  absentCount={items.slice(0, idx).filter(i => i.absent).length}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                  onToggleAbsent={toggleAbsent}
                  isFirst={idx === 0 || items[idx - 1]?.absent}
                  isLast={idx === items.findLastIndex(i => !i.absent)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="px-8 py-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">취소</button>
          <button
            onClick={() => {
              const orderedParticipants = items.filter(i => !i.absent).map(i => i.character_name);
              const absentNames = items.filter(i => i.absent).map(i => i.character_name);
              onApply(orderedParticipants, absentNames);
              onClose();
            }}
            className="px-8 py-3 rounded-2xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all active:scale-[0.98]"
          >
            적용 ({participants.length}명 참여, {absentees.length}명 미참여)
          </button>
        </div>
      </div>
    </div>
  );
}

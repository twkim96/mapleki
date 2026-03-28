"use client";
import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { X, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';

interface RankItem {
  id: string; // character_name
  character_name: string;
}

function SortableItem({ id, character_name, index, onMoveUp, onMoveDown, isFirst, isLast }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-2 group cursor-grab active:cursor-grabbing touch-none">
      <div className="p-1 text-slate-400 hover:text-blue-500">
        <GripVertical className="w-5 h-5" />
      </div>
      <div className="font-bold text-blue-600 dark:text-blue-400 w-10 text-center bg-blue-50 dark:bg-blue-900/30 py-1 rounded-lg">{index + 1}위</div>
      <div className="flex-1 font-bold text-[15px] pl-2 text-slate-700 dark:text-slate-200 pointer-events-none">{character_name}</div>
      <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button disabled={isFirst} onPointerDown={(e) => e.stopPropagation()} onClick={() => onMoveUp(index)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 rounded disabled:opacity-30 transition-colors"><ChevronUp className="w-4 h-4" /></button>
        <button disabled={isLast} onPointerDown={(e) => e.stopPropagation()} onClick={() => onMoveDown(index)} className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-700 dark:hover:bg-slate-600 rounded disabled:opacity-30 transition-colors"><ChevronDown className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

export default function EasyRankModal({ isOpen, onClose, sortedNames, onApply }: { isOpen: boolean, onClose: () => void, sortedNames: string[], onApply: (ordered: string[]) => void }) {
  const [items, setItems] = useState<RankItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setItems(sortedNames.map(name => ({ id: name, character_name: name })));
    }
  }, [isOpen, sortedNames]);

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
    if (idx > 0) setItems(items => arrayMove(items, idx, idx - 1));
  };
  const moveDown = (idx: number) => {
    if (idx < items.length - 1) setItems(items => arrayMove(items, idx, idx + 1));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] w-full max-w-lg flex flex-col h-[85vh] shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">✨ 편하게 순위 배정하기</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 font-medium">드래그하거나 화살표를 눌러 {items.length}명의 등수를 맞춰주세요.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"><X className="w-6 h-6"/></button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-slate-50 dark:bg-slate-950/50">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
              {items.map((item, idx) => (
                <SortableItem key={item.id} id={item.id} character_name={item.character_name} index={idx} onMoveUp={moveUp} onMoveDown={moveDown} isFirst={idx === 0} isLast={idx === items.length - 1} />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <div className="px-8 py-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <button onClick={onClose} className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">취소</button>
          <button onClick={() => { onApply(items.map(i => i.character_name)); onClose(); }} className="px-8 py-3 rounded-2xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all active:scale-[0.98]">순위 최종 적용 (1위~{items.length}위)</button>
        </div>
      </div>
    </div>
  );
}

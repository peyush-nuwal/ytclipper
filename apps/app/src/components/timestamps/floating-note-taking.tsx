import { cn, formatTimestamp } from '@/lib/utils';
import '@uiw/react-markdown-preview/markdown.css';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import { motion } from 'framer-motion';
import {
  Clock,
  Maximize2,
  Minimize2,
  Move,
  Plus,
  StickyNote,
  Tag,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface FloatingNoteTakerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTimestamp: number;
  onAddTimestamp: (data: {
    title: string;
    note: string;
    tags: string[];
    timestamp: number;
  }) => Promise<void>;
  isCreating?: boolean;
}

interface DragState {
  isDragging: boolean;
  dragStart: { x: number; y: number };
  elementStart: { x: number; y: number };
}

export const FloatingNoteTaker: React.FC<FloatingNoteTakerProps> = ({
  isOpen,
  onClose,
  currentTimestamp,
  onAddTimestamp,
  isCreating = false,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: -1, y: -1 }); // Use -1 to indicate uninitialized
  const [panelSize, setPanelSize] = useState({ width: 420, height: 480 });
  const [isResizing, setIsResizing] = useState(false);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    elementStart: { x: 0, y: 0 },
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(null);

  const [noteData, setNoteData] = useState({
    title: '',
    note: '',
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');

  // Initialize position only once when opened
  useEffect(() => {
    if (isOpen && panelPosition.x === -1 && panelPosition.y === -1) {
      const centerX = Math.max(0, (window.innerWidth - panelSize.width) / 2);
      const centerY = Math.max(0, (window.innerHeight - panelSize.height) / 2);
      setPanelPosition({ x: centerX, y: centerY });
    }
  }, [isOpen, panelSize.width, panelSize.height]);

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) {
        return;
      }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const width = Math.max(320, e.clientX - panelPosition.x);
        const height = Math.max(300, e.clientY - panelPosition.y);
        setPanelSize({ width, height });
      });
    },
    [isResizing, panelPosition.x, panelPosition.y],
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  // Resize event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Optimized drag handler with RAF
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState.isDragging) {
        return;
      }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - dragState.dragStart.x;
        const deltaY = e.clientY - dragState.dragStart.y;

        const newX = Math.max(
          0,
          Math.min(
            window.innerWidth - panelSize.width,
            dragState.elementStart.x + deltaX,
          ),
        );
        const newY = Math.max(
          0,
          Math.min(
            window.innerHeight - (isMinimized ? 60 : panelSize.height),
            dragState.elementStart.y + deltaY,
          ),
        );

        setPanelPosition({ x: newX, y: newY });
      });
    },
    [
      dragState.isDragging,
      dragState.dragStart.x,
      dragState.dragStart.y,
      dragState.elementStart.x,
      dragState.elementStart.y,
      panelSize.width,
      panelSize.height,
      isMinimized,
    ],
  );

  const handleDragEnd = useCallback(() => {
    setDragState((prev) => ({ ...prev, isDragging: false }));
    document.body.style.userSelect = '';
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  // Drag event listeners
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [dragState.isDragging, handleDragMove, handleDragEnd]);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (
        e.target !== dragHandleRef.current &&
        !dragHandleRef.current?.contains(e.target as Node)
      ) {
        return;
      }

      e.preventDefault();
      setDragState({
        isDragging: true,
        dragStart: { x: e.clientX, y: e.clientY },
        elementStart: panelPosition,
      });
    },
    [panelPosition],
  );

  // Tag management
  const addTag = useCallback(() => {
    if (tagInput.trim() && !noteData.tags.includes(tagInput.trim())) {
      setNoteData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  }, [tagInput, noteData.tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setNoteData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  }, []);

  const handleTagInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      }
    },
    [addTag],
  );

  const handleSaveNote = useCallback(async () => {
    if (!noteData.title.trim()) {
      return;
    }

    try {
      await onAddTimestamp({
        title: noteData.title,
        note: noteData.note,
        tags: noteData.tags,
        timestamp: currentTimestamp,
      });

      // Reset form
      setNoteData({
        title: '',
        note: '',
        tags: [],
      });
      setTagInput('');
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  }, [
    noteData.title,
    noteData.note,
    noteData.tags,
    currentTimestamp,
    onAddTimestamp,
  ]);

  const handleClose = useCallback(() => {
    // Reset form when closing
    setNoteData({
      title: '',
      note: '',
      tags: [],
    });
    setTagInput('');
    onClose();
  }, [onClose]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  if (!isOpen) {
    return null;
  }

  // Don't render until position is initialized
  if (panelPosition.x === -1 || panelPosition.y === -1) {
    return null;
  }

  return (
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }} // Reduced duration
      className={cn(
        'fixed bg-white border border-gray-200 shadow-2xl rounded-2xl overflow-hidden',
        dragState.isDragging && 'select-none',
      )}
      style={{
        zIndex: 9999,
        left: panelPosition.x,
        top: panelPosition.y,
        width: isMinimized ? 320 : panelSize.width,
        height: isMinimized ? 'auto' : panelSize.height,
        // Remove CSS transitions that conflict with JS updates
      }}
    >
      {/* Panel Header */}
      <div
        ref={dragHandleRef}
        className='flex items-center justify-between p-3 border-b border-gray-200 cursor-move bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg'
        onMouseDown={handleDragStart}
      >
        <div className='flex items-center gap-2'>
          <Move size={16} className='text-gray-400' />
          <StickyNote size={16} className='text-blue-600' />
          <h3 className='font-semibold text-gray-800'>Quick Note</h3>
          <div className='flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs'>
            <Clock size={12} />
            {formatTimestamp(currentTimestamp)}
          </div>
        </div>
        <div className='flex items-center gap-1'>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className='p-1 hover:bg-blue-100 rounded transition-colors'
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={handleClose}
            className='p-1 hover:bg-red-100 text-red-600 rounded transition-colors'
            title='Close'
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className='p-4 space-y-4'>
          <div>
            <label
              htmlFor='note-input'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Note Title *
            </label>
            <input
              id='note-input'
              type='text'
              placeholder='Enter note title...'
              value={noteData.title}
              onChange={(e) =>
                setNoteData((prev) => ({ ...prev, title: e.target.value }))
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors'
            />
          </div>

          {/* Tags Section */}
          <div>
            <label
              htmlFor='tags'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              <Tag size={14} className='inline mr-1' />
              Tags
            </label>

            {/* Existing Tags */}
            {noteData.tags.length > 0 && (
              <div className='flex flex-wrap gap-1 mb-2'>
                {noteData.tags.map((tag) => (
                  <span
                    key={tag}
                    className='inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium'
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className='hover:bg-blue-200 rounded-full p-0.5 transition-colors'
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag Input */}
            <div className='flex gap-2'>
              <input
                type='text'
                id='tags'
                placeholder='Add tag...'
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className='flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors'
              />
              <button
                onClick={addTag}
                className='px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors disabled:opacity-50'
                disabled={!tagInput.trim()}
              >
                Add
              </button>
            </div>
          </div>

          {/* Note Content Editor */}
          <div>
            <label
              htmlFor='note-editor'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Note Content
            </label>
            <div data-color-mode='light'>
              <MDEditor
                id='note-editor'
                value={noteData.note}
                onChange={(val) =>
                  setNoteData((prev) => ({ ...prev, note: val || '' }))
                }
                preview='edit'
                height={200}
                data-testid='md-editor'
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-2 pt-2 border-t border-gray-100'>
            <button
              onClick={handleSaveNote}
              className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50'
              disabled={!noteData.title.trim() || isCreating}
            >
              <Plus size={16} />
              {isCreating ? 'Saving...' : 'Save Note'}
            </button>
            <button
              onClick={handleClose}
              className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm'
            >
              Cancel
            </button>
          </div>

          {/* Helper Text */}
          <div className='text-xs text-gray-500 bg-gray-50 p-2 rounded'>
            💡 <strong>Tip:</strong> This note will be saved at timestamp{' '}
            {formatTimestamp(currentTimestamp)}. You can drag this panel around
            and minimize it while taking notes.
          </div>
        </div>
      )}

      {/* Resize Handle */}
      {!isMinimized && (
        <button
          onMouseDown={handleResizeStart}
          className='absolute bottom-1 right-1 w-3 h-3 cursor-nwse-resize z-10 opacity-30 hover:opacity-60 transition-opacity'
        >
          <div className='w-full h-full bg-gray-400 rounded-sm' />
        </button>
      )}
    </motion.div>
  );
};

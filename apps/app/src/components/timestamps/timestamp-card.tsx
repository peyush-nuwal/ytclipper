import { formatDistance } from 'date-fns';
import { Edit3, MoreVertical, Play, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface TimestampCardProps {
  timestamp: {
    id: string;
    timestamp: number;
    title: string;
    note: string;
    created_at: string;
    updated_at: string;
  };
  isEditing: boolean;
  onSeek: (seconds: number) => void;
  onEditStart: (id: string) => void;
  onEditSave: (id: string, newNote: string) => void;
  onEditCancel: () => void;
  onDelete: (id: string) => void;
  editNoteValue: string;
  onEditNoteChange: (value: string) => void;
}

export const TimestampCard = ({
  timestamp,
  isEditing,
  onSeek,
  onEditStart,
  onEditSave,
  onEditCancel,
  onDelete,
  editNoteValue,
  onEditNoteChange,
}: TimestampCardProps) => {
  const [showOptions, setShowOptions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistance(date, new Date(), { addSuffix: true });
  };

  return (
    <div className='border rounded-lg p-4 hover:bg-gray-50 transition-colors relative'>
      <div className='flex items-start justify-between mb-2'>
        <div className='flex items-center gap-3'>
          <button
            className='flex items-center gap-1 text-blue-600 font-medium hover:text-blue-800 transition-colors'
            onClick={() => onSeek(timestamp.timestamp)}
          >
            <Play size={14} />
            <span className='font-mono'>{formatTime(timestamp.timestamp)}</span>
          </button>
          <h5 className='font-semibold text-gray-900'>{timestamp.title}</h5>
        </div>

        <div className='relative'>
          <button
            onClick={() => setShowOptions(!showOptions)}
            className='p-1 text-gray-500 hover:bg-gray-200 rounded-full transition-colors'
          >
            <MoreVertical size={16} />
          </button>

          {showOptions ? (
            <div className='absolute right-0 top-8 bg-white rounded-md shadow-lg border z-10 w-40'>
              <button
                onClick={() => {
                  onEditStart(timestamp.id);
                  setShowOptions(false);
                }}
                className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2'
              >
                <Edit3 size={14} /> Edit
              </button>
              <button
                onClick={() => {
                  setConfirmDelete(true);
                  setShowOptions(false);
                }}
                className='w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-600'
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <div className='space-y-3 mt-2'>
          <textarea
            value={editNoteValue}
            onChange={(e) => onEditNoteChange(e.target.value)}
            className='w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
            rows={3}
          />
          <div className='flex gap-2 justify-end'>
            <button
              onClick={() => onEditSave(timestamp.id, editNoteValue)}
              className='flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors'
            >
              <Save size={14} /> Save
            </button>
            <button
              onClick={onEditCancel}
              className='flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors'
            >
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className='text-gray-700 mb-3'>{timestamp.note}</p>
          <div className='flex justify-between items-center text-xs text-gray-500'>
            <span>Created {formatDate(timestamp.created_at)}</span>
            {timestamp.updated_at !== timestamp.created_at && (
              <span>Updated {formatDate(timestamp.updated_at)}</span>
            )}
          </div>
        </div>
      )}

      {confirmDelete ? (
        <div className='absolute inset-0 bg-white bg-opacity-95 rounded-lg flex flex-col items-center justify-center p-4'>
          <p className='text-center mb-3 font-medium'>Delete this timestamp?</p>
          <div className='flex gap-2'>
            <button
              onClick={() => setConfirmDelete(false)}
              className='px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors'
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete(timestamp.id)}
              className='px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center gap-1'
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

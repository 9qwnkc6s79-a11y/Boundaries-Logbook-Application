import React, { useState, useMemo } from 'react';
import { FileText, Plus, Trash2, Pin, Search, Tag, ArrowLeft } from 'lucide-react';
import { Note, generateId } from '../types';

interface NotesViewProps {
  notes: Note[];
  selectedNoteId?: string;
  onSave: (note: Note) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelectNote: (id: string) => void;
}

const NotesView: React.FC<NotesViewProps> = ({
  notes,
  selectedNoteId,
  onSave,
  onDelete,
  onSelectNote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const selectedNote = selectedNoteId ? notes.find(n => n.id === selectedNoteId) : null;

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => note.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [notes]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesTitle = note.title.toLowerCase().includes(query);
          const matchesContent = note.content.toLowerCase().includes(query);
          const matchesTags = note.tags.some(t => t.toLowerCase().includes(query));
          if (!matchesTitle && !matchesContent && !matchesTags) return false;
        }
        if (selectedTag) {
          if (!note.tags.includes(selectedTag)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Pinned first, then by date
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, searchQuery, selectedTag]);

  const createNewNote = (): Note => ({
    id: generateId(),
    title: 'Untitled Note',
    content: '',
    tags: [],
    isPinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleCreateNote = async () => {
    const newNote = createNewNote();
    await onSave(newNote);
    onSelectNote(newNote.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this note?')) {
      await onDelete(id);
      if (selectedNoteId === id) {
        onSelectNote('');
      }
    }
  };

  const togglePin = async (note: Note) => {
    await onSave({ ...note, isPinned: !note.isPinned });
  };

  // Note Detail View
  if (selectedNote) {
    return (
      <NoteDetail
        note={selectedNote}
        allTags={allTags}
        onSave={onSave}
        onDelete={() => handleDelete(selectedNote.id)}
        onBack={() => onSelectNote('')}
        onTogglePin={() => togglePin(selectedNote)}
      />
    );
  }

  // Notes List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-amber-200 pb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-amber-700" />
            Notes
          </h1>
          <p className="text-sm opacity-60 mt-1">
            Unlimited notes with full-text search
          </p>
        </div>

        <button
          onClick={handleCreateNote}
          className="flex items-center gap-2 bg-amber-700 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors touch-manipulation"
        >
          <Plus className="w-5 h-5" />
          New Note
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="w-full bg-amber-50 border border-amber-200 rounded-lg pl-10 pr-4 py-2 focus:border-amber-500 outline-none"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                !selectedTag
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredNotes.map(note => (
            <button
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className="planner-card p-4 text-left hover:shadow-lg transition-shadow touch-manipulation"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg line-clamp-1">{note.title}</h3>
                {note.isPinned && <Pin className="w-4 h-4 text-amber-600 flex-shrink-0" />}
              </div>

              <p className="text-sm opacity-60 line-clamp-3 mb-3">
                {note.content || 'No content'}
              </p>

              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {note.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                      #{tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-xs opacity-50">+{note.tags.length - 3}</span>
                  )}
                </div>
              )}

              <div className="text-xs opacity-50">
                {new Date(note.updatedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 text-amber-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">
            {searchQuery || selectedTag ? 'No Notes Found' : 'No Notes Yet'}
          </h3>
          <p className="opacity-60 mb-6">
            {searchQuery || selectedTag ? 'Try adjusting your search' : 'Create your first note'}
          </p>
          {!searchQuery && !selectedTag && (
            <button
              onClick={handleCreateNote}
              className="inline-flex items-center gap-2 bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-800"
            >
              <Plus className="w-5 h-5" />
              Create Note
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Note Detail Component
const NoteDetail: React.FC<{
  note: Note;
  allTags: string[];
  onSave: (note: Note) => Promise<void>;
  onDelete: () => void;
  onBack: () => void;
  onTogglePin: () => void;
}> = ({ note, allTags, onSave, onDelete, onBack, onTogglePin }) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState(note.tags);
  const [newTag, setNewTag] = useState('');
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSave = async (updates: Partial<Note>) => {
    const updated = { ...note, ...updates, updatedAt: new Date().toISOString() };
    await onSave(updated);
  };

  const autoSave = (updates: Partial<Note>) => {
    if (saveTimeout) clearTimeout(saveTimeout);
    const timeout = setTimeout(() => handleSave(updates), 1000);
    setSaveTimeout(timeout);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    autoSave({ title: value });
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    autoSave({ content: value });
  };

  const addTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    const updatedTags = [...tags, newTag.trim()];
    setTags(updatedTags);
    handleSave({ tags: updatedTags });
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    const updatedTags = tags.filter(t => t !== tag);
    setTags(updatedTags);
    handleSave({ tags: updatedTags });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 border-b border-amber-200 pb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-amber-100 transition-colors touch-manipulation mt-1"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Note title..."
            className="text-2xl lg:text-3xl font-bold w-full bg-transparent border-none outline-none"
          />
          <div className="text-sm opacity-50 mt-1">
            Last updated: {new Date(note.updatedAt).toLocaleString()}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePin}
            className={`p-2 rounded-lg transition-colors ${
              note.isPinned
                ? 'bg-amber-100 text-amber-700'
                : 'hover:bg-amber-100 text-gray-400'
            }`}
            title={note.isPinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-5 h-5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="planner-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-4 h-4 opacity-50" />
          <span className="text-sm font-semibold">Tags</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm"
            >
              #{tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-red-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add tag..."
            className="flex-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1 text-sm focus:border-amber-500 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && addTag()}
            list="tag-suggestions"
          />
          <datalist id="tag-suggestions">
            {allTags.filter(t => !tags.includes(t)).map(tag => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
          <button
            onClick={addTag}
            className="px-3 py-1 bg-amber-700 text-white rounded-lg text-sm hover:bg-amber-800"
          >
            Add
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="planner-card p-6">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing..."
          className="w-full min-h-[500px] bg-transparent border-none outline-none resize-y font-mono text-sm leading-relaxed"
          style={{ lineHeight: '1.8' }}
        />
      </div>
    </div>
  );
};

export default NotesView;

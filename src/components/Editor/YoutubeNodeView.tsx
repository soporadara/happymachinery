import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { 
  GripVertical, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, 
  Trash2, AlignLeft, AlignCenter, AlignRight, 
  Maximize2, ExternalLink, RefreshCw, X, Check, AlertCircle, Video
} from 'lucide-react';

export const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[\w-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
};

interface YoutubeNodeViewProps {
  editor: any;
  node: any;
  selected: boolean;
  getPos: () => number | undefined;
  updateAttributes: (attrs: Record<string, any>) => void;
  deleteNode: () => void;
}

export default function YoutubeNodeView({
  editor,
  node,
  selected,
  getPos,
  updateAttributes,
  deleteNode,
}: YoutubeNodeViewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editUrl, setEditUrl] = useState(node.attrs.src || '');
  const [editCaption, setEditCaption] = useState(node.attrs.caption || '');
  const [previewError, setPreviewError] = useState(false);

  const rawSrc = node.attrs.src || '';
  const videoId = getYoutubeVideoId(rawSrc);
  const alignment = node.attrs.alignment || 'center';
  const caption = node.attrs.caption || '';

  const embedUrl = videoId 
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`
    : rawSrc;

  // Move helpers across sections in article
  const getMoveStates = () => {
    if (typeof getPos !== 'function' || !editor) return { canUp: false, canDown: false };
    try {
      const pos = getPos();
      if (typeof pos !== 'number') return { canUp: false, canDown: false };
      const $pos = editor.state.doc.resolve(pos);
      const index = $pos.index();
      const count = $pos.parent.childCount;
      return {
        canUp: index > 0,
        canDown: index < count - 1,
      };
    } catch {
      return { canUp: false, canDown: false };
    }
  };

  const { canUp, canDown } = getMoveStates();

  const handleMoveUp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof getPos !== 'function' || !editor) return;
    try {
      const pos = getPos();
      if (typeof pos !== 'number') return;
      const { doc, tr } = editor.state;
      const $pos = doc.resolve(pos);
      const index = $pos.index();
      if (index === 0) return;

      const prevSibling = $pos.parent.child(index - 1);
      const targetPos = pos - prevSibling.nodeSize;
      const currentNode = node;

      tr.delete(pos, pos + currentNode.nodeSize);
      tr.insert(targetPos, currentNode);
      editor.view.dispatch(tr);
      editor.view.focus();
    } catch (err) {
      console.error('Failed to move video up:', err);
    }
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof getPos !== 'function' || !editor) return;
    try {
      const pos = getPos();
      if (typeof pos !== 'number') return;
      const { doc, tr } = editor.state;
      const $pos = doc.resolve(pos);
      const index = $pos.index();
      if (index >= $pos.parent.childCount - 1) return;

      const nextSibling = $pos.parent.child(index + 1);
      const currentNode = node;

      tr.delete(pos, pos + currentNode.nodeSize);
      tr.insert(pos + nextSibling.nodeSize, currentNode);
      editor.view.dispatch(tr);
      editor.view.focus();
    } catch (err) {
      console.error('Failed to move video down:', err);
    }
  };

  const handleMoveToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof getPos !== 'function' || !editor) return;
    try {
      const pos = getPos();
      if (typeof pos !== 'number' || pos === 0) return;
      const { tr } = editor.state;
      const currentNode = node;
      tr.delete(pos, pos + currentNode.nodeSize);
      tr.insert(0, currentNode);
      editor.view.dispatch(tr);
      editor.view.focus();
    } catch (err) {
      console.error('Failed to move video to top:', err);
    }
  };

  const handleMoveToBottom = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof getPos !== 'function' || !editor) return;
    try {
      const pos = getPos();
      if (typeof pos !== 'number') return;
      const { tr } = editor.state;
      const currentNode = node;
      tr.delete(pos, pos + currentNode.nodeSize);
      tr.insert(tr.doc.content.size, currentNode);
      editor.view.dispatch(tr);
      editor.view.focus();
    } catch (err) {
      console.error('Failed to move video to bottom:', err);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = editUrl.trim();
    if (!cleanUrl) return;

    const extractedId = getYoutubeVideoId(cleanUrl);
    if (!extractedId) {
      setPreviewError(true);
      return;
    }

    setPreviewError(false);
    updateAttributes({
      src: cleanUrl,
      caption: editCaption.trim(),
    });
    setIsEditModalOpen(false);
  };

  // Alignment classes
  const alignmentClass = {
    left: 'mr-auto max-w-2xl',
    center: 'mx-auto max-w-4xl',
    right: 'ml-auto max-w-2xl',
    full: 'w-full max-w-none',
  }[alignment as 'left' | 'center' | 'right' | 'full'] || 'mx-auto max-w-4xl';

  const isBarVisible = isHovered || selected || isEditModalOpen;

  return (
    <NodeViewWrapper 
      className="relative my-8 group/yt select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`transition-all duration-200 ${alignmentClass}`}>
        
        {/* Floating Action Bar */}
        <div 
          className={`mb-2 flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md rounded-xl text-white shadow-xl border border-slate-700/80 transition-all duration-200 ${
            isBarVisible ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
          }`}
        >
          {/* Left Brand Badge */}
          <div className="flex items-center gap-2 pl-2 pr-1">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-600 text-white font-bold text-[11px] tracking-wider uppercase shadow-xs">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              YouTube Video
            </span>
            {videoId && (
              <span className="text-[11px] text-slate-300 font-mono hidden sm:inline-block max-w-[140px] truncate opacity-80">
                ID: {videoId}
              </span>
            )}
          </div>

          {/* Center Actions: Move Section & Alignment */}
          <div className="flex items-center gap-1">
            {/* Drag Handle */}
            <div 
              data-drag-handle="" 
              title="Drag and drop YouTube video into any section" 
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-grab active:cursor-grabbing font-mono text-[11px] font-semibold select-none border border-slate-600/50 shadow-xs mr-1"
            >
              <GripVertical size={14} className="text-red-400" />
              <span>Drag</span>
            </div>

            {/* Move Section Up */}
            <button
              onClick={handleMoveUp}
              disabled={!canUp}
              title="Move Section Up (Move above previous paragraph/section)"
              type="button"
              className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-200 transition-colors"
            >
              <ArrowUp size={14} />
            </button>

            {/* Move Section Down */}
            <button
              onClick={handleMoveDown}
              disabled={!canDown}
              title="Move Section Down (Move below next paragraph/section)"
              type="button"
              className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-200 transition-colors"
            >
              <ArrowDown size={14} />
            </button>

            {/* Move to Top */}
            <button
              onClick={handleMoveToTop}
              title="Move Video to Top of Article"
              type="button"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors hidden sm:inline-flex"
            >
              <ChevronsUp size={14} />
            </button>

            {/* Move to Bottom */}
            <button
              onClick={handleMoveToBottom}
              title="Move Video to Bottom of Article"
              type="button"
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors hidden sm:inline-flex"
            >
              <ChevronsDown size={14} />
            </button>

            <div className="w-px h-4 bg-slate-700 mx-0.5"></div>

            {/* Alignment: Left */}
            <button
              onClick={() => updateAttributes({ alignment: 'left' })}
              title="Align Left"
              type="button"
              className={`p-1.5 rounded-lg transition-colors ${
                alignment === 'left' ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <AlignLeft size={14} />
            </button>

            {/* Alignment: Center */}
            <button
              onClick={() => updateAttributes({ alignment: 'center' })}
              title="Center (Default)"
              type="button"
              className={`p-1.5 rounded-lg transition-colors ${
                alignment === 'center' ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <AlignCenter size={14} />
            </button>

            {/* Alignment: Right */}
            <button
              onClick={() => updateAttributes({ alignment: 'right' })}
              title="Align Right"
              type="button"
              className={`p-1.5 rounded-lg transition-colors ${
                alignment === 'right' ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <AlignRight size={14} />
            </button>

            {/* Alignment: Full */}
            <button
              onClick={() => updateAttributes({ alignment: 'full' })}
              title="Full Width"
              type="button"
              className={`p-1.5 rounded-lg transition-colors ${
                alignment === 'full' ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Maximize2 size={14} />
            </button>
          </div>

          {/* Right Actions: Edit, Open, Delete */}
          <div className="flex items-center gap-1 pl-1">
            <button
              onClick={() => {
                setEditUrl(rawSrc);
                setEditCaption(caption);
                setIsEditModalOpen(true);
              }}
              title="Edit YouTube Video URL or Caption"
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              <RefreshCw size={12} />
              <span>Change URL</span>
            </button>

            {rawSrc && (
              <a
                href={rawSrc.startsWith('http') ? rawSrc : `https://www.youtube.com/watch?v=${videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Watch on YouTube (New Tab)"
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                <ExternalLink size={14} />
              </a>
            )}

            <button
              onClick={deleteNode}
              title="Remove YouTube Video"
              type="button"
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Video Player Box with Real Preview */}
        <div className={`relative w-full rounded-2xl overflow-hidden shadow-2xl border-2 transition-all ${
          selected ? 'border-red-500 ring-4 ring-red-500/20' : 'border-slate-800 bg-slate-950'
        }`}>
          {/* Floating Drag Badge */}
          <div 
            data-drag-handle=""
            title="Click and drag to move YouTube video into any section"
            className={`absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/90 text-white backdrop-blur-md shadow-xl border border-slate-700/80 cursor-grab active:cursor-grabbing select-none transition-all duration-200 ${
              isHovered || selected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            <GripVertical size={14} className="text-red-400" />
            <span className="text-[11px] font-semibold tracking-wide">Drag Video</span>
          </div>

          {videoId ? (
            <div className="relative w-full aspect-video bg-black">
              <iframe
                src={embedUrl}
                title={caption || 'YouTube video preview'}
                className="w-full h-full border-0 rounded-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-900 text-slate-300 aspect-video rounded-2xl">
              <Video className="w-12 h-12 text-red-500 mb-3" />
              <p className="font-semibold text-sm mb-1 text-slate-200">No Valid YouTube URL Configured</p>
              <p className="text-xs text-slate-400 mb-4 text-center max-w-sm">
                Paste a YouTube watch or share URL to preview and embed the video into this section.
              </p>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                Configure YouTube URL
              </button>
            </div>
          )}
        </div>

        {/* Caption Display & Quick Input */}
        {caption ? (
          <div className="mt-2 text-center">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 italic">
              {caption}
            </span>
          </div>
        ) : (
          <div className="mt-1 text-center opacity-0 group-hover/yt:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => {
                setEditUrl(rawSrc);
                setEditCaption('');
                setIsEditModalOpen(true);
              }}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline decoration-dotted"
            >
              + Add video caption
            </button>
          </div>
        )}
      </div>

      {/* Edit URL & Caption Modal */}
      {isEditModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div 
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Edit YouTube Video</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Update the video source link or caption
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                type="button" 
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                  e.preventDefault();
                  handleSaveEdit(e);
                }
              }} 
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  YouTube Video URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => {
                    setEditUrl(e.target.value);
                    setPreviewError(false);
                  }}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  autoFocus
                />
                {previewError && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={13} />
                    Please enter a valid YouTube video link (watch, share, or embed).
                  </p>
                )}
              </div>

              {/* Live Preview inside modal */}
              {getYoutubeVideoId(editUrl) && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Live Video Preview
                  </label>
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-md border border-slate-700 bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${getYoutubeVideoId(editUrl)}?rel=0`}
                      title="Modal preview"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Caption / Description (Optional)
                </label>
                <input
                  type="text"
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="e.g. Demonstration of SpaceX cold-gas thrusters flight hop"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all cursor-pointer"
                >
                  <Check size={14} />
                  <span>Update Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}

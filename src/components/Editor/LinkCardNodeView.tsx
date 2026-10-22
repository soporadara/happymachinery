import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { 
  GripVertical, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, 
  Trash2, ExternalLink, Edit3, X, Check, Link as LinkIcon, Globe
} from 'lucide-react';

interface LinkCardNodeViewProps {
  editor: any;
  node: any;
  selected: boolean;
  getPos: () => number | undefined;
  updateAttributes: (attrs: Record<string, any>) => void;
  deleteNode: () => void;
}

export default function LinkCardNodeView({
  editor,
  node,
  selected,
  getPos,
  updateAttributes,
  deleteNode,
}: LinkCardNodeViewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const url = node.attrs.url || '';
  const title = node.attrs.title || url;
  const description = node.attrs.description || '';
  const siteName = node.attrs.siteName || '';

  const [editUrl, setEditUrl] = useState(url);
  const [editTitle, setEditTitle] = useState(title);
  const [editDescription, setEditDescription] = useState(description);
  const [editSiteName, setEditSiteName] = useState(siteName);

  const displaySite = siteName || (() => {
    try {
      return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
    } catch {
      return 'LINK';
    }
  })();

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
      console.error('Failed to move link card up:', err);
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
      console.error('Failed to move link card down:', err);
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
      console.error('Failed to move link card to top:', err);
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
      console.error('Failed to move link card to bottom:', err);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAttributes({
      url: editUrl.trim(),
      title: editTitle.trim() || editUrl.trim(),
      description: editDescription.trim(),
      siteName: editSiteName.trim(),
    });
    setIsEditing(false);
  };

  const isBarVisible = isHovered || selected;

  return (
    <NodeViewWrapper 
      className="relative my-6 group/linkcard transition-all select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Action Bar */}
      <div 
        className={`absolute -top-11 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2.5 py-1.5 rounded-2xl bg-slate-950/95 dark:bg-slate-900/98 text-white backdrop-blur-xl shadow-2xl border border-slate-700/80 transition-all duration-200 pointer-events-auto ${
          isBarVisible 
            ? 'opacity-100 translate-y-0 visible scale-100' 
            : 'opacity-0 -translate-y-2 invisible scale-95 pointer-events-none'
        }`}
      >
        {/* Drag Handle */}
        <div 
          data-drag-handle="" 
          title="Drag and drop Link Card into any section" 
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-grab active:cursor-grabbing font-mono text-[11px] font-semibold select-none border border-slate-600/50 shadow-xs mr-1"
        >
          <GripVertical size={14} className="text-blue-400" />
          <span>Drag</span>
        </div>

        {/* Section Move Group */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-slate-700/80">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleMoveUp}
            disabled={!canUp}
            title={canUp ? 'Move link card up (above previous paragraph)' : 'Already at the top of this section'}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUp size={15} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleMoveDown}
            disabled={!canDown}
            title={canDown ? 'Move link card down (below next paragraph)' : 'Already at the bottom of this section'}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDown size={15} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleMoveToTop}
            title="Move to top of article"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors hidden sm:inline-flex"
          >
            <ChevronsUp size={15} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleMoveToBottom}
            title="Move to bottom of article"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors hidden sm:inline-flex"
          >
            <ChevronsDown size={15} />
          </button>
        </div>

        {/* Edit Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setEditUrl(url);
            setEditTitle(title);
            setEditDescription(description);
            setEditSiteName(siteName);
            setIsEditing(true);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          title="Edit Link Card"
        >
          <Edit3 size={13} />
          <span>Edit</span>
        </button>

        {/* External Link */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-blue-400 hover:text-blue-300 text-xs font-medium transition-colors"
          title="Open in New Tab"
        >
          <ExternalLink size={13} />
          <span>Open</span>
        </a>

        {/* Delete */}
        <div className="pl-1 border-l border-slate-700/80">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={deleteNode}
            title="Delete Link Card"
            className="p-1.5 rounded-lg hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Rich Link Card Body */}
      <div 
        data-drag-handle=""
        className={`w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md transition-all hover:border-blue-500/50 cursor-grab active:cursor-grabbing ${
          selected ? 'ring-2 ring-blue-500 shadow-blue-500/20' : ''
        }`}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold text-[11px] uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                <Globe size={11} />
                <span>{displaySite}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                ⠿ Drag to move section
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate hover:text-blue-600 transition-colors">
              {title || url}
            </h4>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {description}
              </p>
            )}
            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-2 truncate">
              {url}
            </div>
          </div>

          <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0">
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              <ExternalLink size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <LinkIcon size={16} className="text-blue-500" />
                <span>Edit Link Card</span>
              </h3>
              <button 
                type="button"
                onClick={() => setIsEditing(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination URL *
                </label>
                <input
                  type="text"
                  required
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Card Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Official Website or Documentation..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Site / Brand Name
                </label>
                <input
                  type="text"
                  value={editSiteName}
                  onChange={(e) => setEditSiteName(e.target.value)}
                  placeholder="e.g. Tesla, Hostinger, GitHub..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Brief summary or context about this link..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs cursor-pointer"
                >
                  <Check size={14} />
                  <span>Update Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}

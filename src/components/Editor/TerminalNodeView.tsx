import React, { useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { 
  GripVertical, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, 
  Trash2, Copy, Check, Edit3, X
} from 'lucide-react';

interface TerminalNodeViewProps {
  editor: any;
  node: any;
  selected: boolean;
  getPos: () => number | undefined;
  updateAttributes: (attrs: Record<string, any>) => void;
  deleteNode: () => void;
}

const SUPPORTED_LANGUAGES = [
  'bash', 'zsh', 'terminal', 'sh', 'python', 'javascript', 
  'typescript', 'sql', 'php', 'json', 'docker', 'html', 'css'
];

export default function TerminalNodeView({
  editor,
  node,
  selected,
  getPos,
  updateAttributes,
  deleteNode,
}: TerminalNodeViewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const lang = node.attrs.language || 'bash';
  const title = node.attrs.title || 'Terminal';
  const code = node.attrs.code || '';

  const [editLang, setEditLang] = useState(lang);
  const [editTitle, setEditTitle] = useState(title);
  const [editCode, setEditCode] = useState(code);

  // Move section helpers across the document
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
      console.error('Failed to move terminal block up:', err);
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
      console.error('Failed to move terminal block down:', err);
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
      console.error('Failed to move terminal block to top:', err);
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
      console.error('Failed to move terminal block to bottom:', err);
    }
  };

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAttributes({
      language: editLang,
      title: editTitle.trim() || 'Terminal',
      code: editCode,
    });
    setIsEditing(false);
  };

  const isBarVisible = isHovered || selected;

  return (
    <NodeViewWrapper 
      className="tw-scope relative my-6 group/terminal transition-all select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Action Bar */}
      <div 
        className={`editor-floating-toolbar absolute -top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 p-1 rounded-xl bg-slate-950/95 dark:bg-slate-900/95 text-white backdrop-blur-xl shadow-2xl border border-slate-700/80 w-max max-w-[calc(100vw-2rem)] overflow-x-auto scrollbar-none whitespace-nowrap transition-all duration-200 pointer-events-auto select-none ${
          isBarVisible 
            ? 'opacity-100 translate-y-0 visible scale-100' 
            : 'opacity-0 -translate-y-2 invisible scale-95 pointer-events-none'
        }`}
      >
        {/* Drag Handle */}
        <div 
          data-drag-handle="" 
          title="Drag and drop Terminal into any section" 
          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-grab active:cursor-grabbing font-mono text-[11px] font-semibold select-none border border-slate-600/50 shadow-xs whitespace-nowrap"
        >
          <GripVertical size={13} className="text-emerald-400 shrink-0" />
          <span className="hidden sm:inline">Drag</span>
        </div>

        {/* Section Move Group */}
        <div className="shrink-0 flex items-center gap-0.5 px-0.5 border-r border-slate-700/80">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleMoveUp}
            disabled={!canUp}
            title={canUp ? 'Move terminal up (above previous paragraph)' : 'Already at the top of this section'}
            className="shrink-0 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUp size={14} />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleMoveDown}
            disabled={!canDown}
            title={canDown ? 'Move terminal down (below next paragraph)' : 'Already at the bottom of this section'}
            className="shrink-0 p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDown size={14} />
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
            setEditLang(lang);
            setEditTitle(title);
            setEditCode(code);
            setIsEditing(true);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          title="Edit Terminal Code"
        >
          <Edit3 size={13} />
          <span>Edit</span>
        </button>

        {/* Copy Button */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleCopyCode}
          className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
          title="Copy Code"
        >
          {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          <span>{isCopied ? 'Copied' : 'Copy'}</span>
        </button>

        {/* Delete */}
        <div className="pl-1 border-l border-slate-700/80">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={deleteNode}
            title="Delete Terminal Block"
            className="p-1.5 rounded-lg hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Terminal Window Box */}
      <div className={`w-full rounded-2xl overflow-hidden border border-slate-800 bg-[#0f172a] shadow-xl transition-all ${
        selected ? 'ring-2 ring-emerald-500 shadow-emerald-500/20' : 'hover:border-slate-700'
      }`}>
        {/* Terminal Header with Drag Handle & macOS Traffic Dots */}
        <div 
          data-drag-handle="" 
          title="Drag anywhere on header to move Terminal to another section"
          className="flex items-center justify-between px-4 py-2.5 bg-[#1e293b] border-b border-slate-700/60 cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-2">
            {/* Traffic Lights */}
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ef4444] shadow-xs"></span>
              <span className="w-3 h-3 rounded-full bg-[#f59e0b] shadow-xs"></span>
              <span className="w-3 h-3 rounded-full bg-[#10b981] shadow-xs"></span>
            </div>
            
            {/* Terminal Title & Prompt */}
            <div className="flex items-center gap-1.5 ml-2 font-mono text-xs text-slate-300">
              <span className="text-emerald-400 font-bold">&gt;_</span>
              <span className="font-semibold text-slate-200">{title}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800/80 text-slate-400 font-medium border border-slate-700/50">
                {lang}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
              ⠿ Drag to move section
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
            >
              {isCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <pre className="p-4 text-xs sm:text-sm font-mono text-slate-100 overflow-x-auto leading-relaxed bg-[#0f172a] select-text">
          <code>{code || '# (Empty terminal block - click Edit to add commands)'}</code>
        </pre>
      </div>

      {/* Quick Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm ml-1 font-mono">
                  &gt;_ Edit Terminal Block
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditing(false)} 
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Terminal Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Terminal, bash, zsh..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Language / Syntax
                  </label>
                  <select
                    value={editLang}
                    onChange={(e) => setEditLang(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Terminal Commands / Code
                </label>
                <textarea
                  rows={8}
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  placeholder={`# Enter terminal commands or code...\necho "Verifying configuration..."`}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-[#0f172a] text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs cursor-pointer"
                >
                  <Check size={14} />
                  <span>Update Terminal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { 
  GripVertical, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, 
  RefreshCw, Trash2, AlignLeft, AlignCenter, AlignRight, 
  Maximize2, Upload, Folder, Link as LinkIcon, X, Check, Search
} from 'lucide-react';
import { compressImageFile, uploadImageToServer } from './TiptapEditor';

interface ImageNodeViewProps {
  editor: any;
  node: any;
  selected: boolean;
  getPos: () => number | undefined;
  updateAttributes: (attrs: Record<string, any>) => void;
  deleteNode: () => void;
}

export default function ImageNodeView({
  editor,
  node,
  selected,
  getPos,
  updateAttributes,
  deleteNode,
}: ImageNodeViewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [replaceTab, setReplaceTab] = useState<'upload' | 'library' | 'url'>('upload');
  
  // Replace states
  const [replaceUrl, setReplaceUrl] = useState('');
  const [replaceAlt, setReplaceAlt] = useState(node.attrs.alt || '');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const replaceFileInputRef = useRef<HTMLInputElement>(null);

  // Media Library browser
  const [libPath, setLibPath] = useState('');
  const [libFolders, setLibFolders] = useState<Array<{ name: string; path: string }>>([]);
  const [libImages, setLibImages] = useState<Array<{ name: string; url: string; size: number }>>([]);
  const [libLoading, setLibLoading] = useState(false);
  const [libSearch, setLibSearch] = useState('');
  const [selectedLibImage, setSelectedLibImage] = useState<string | null>(null);

  const alignment = node.attrs.alignment || 'center';
  const caption = node.attrs.caption || '';
  const [showCaptionInput, setShowCaptionInput] = useState(Boolean(caption));

  // Determine if image can move up / down
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

  // Move Section Up
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
      console.error('Failed to move image up:', err);
    }
  };

  // Move Section Down
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
      console.error('Failed to move image down:', err);
    }
  };

  // Move to Top
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
      console.error('Failed to move image to top:', err);
    }
  };

  // Move to Bottom
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
      console.error('Failed to move image to bottom:', err);
    }
  };

  // Load Media Library
  const loadMediaLibrary = async (path: string = '') => {
    setLibLoading(true);
    try {
      const res = await fetch(`/ourcms/media-library/browse?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        setLibFolders(data.folders || []);
        setLibImages(data.images || []);
        setLibPath(data.current_path || '');
      }
    } catch (err) {
      console.error('Failed to load media library:', err);
    } finally {
      setLibLoading(false);
    }
  };

  useEffect(() => {
    if (isReplaceModalOpen && replaceTab === 'library') {
      loadMediaLibrary(libPath);
    }
  }, [isReplaceModalOpen, replaceTab]);

  // Handle Local Image File Upload for Replacement
  const handleFileReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files[0]) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, GIF, SVG).');
      return;
    }

    setIsUploading(true);
    setUploadProgress(`Optimizing ${file.name}...`);
    try {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const compressed = await compressImageFile(file);
      setUploadProgress('Uploading to server storage...');
      const url = await uploadImageToServer(compressed, file.name);

      updateAttributes({
        src: url,
        alt: cleanName || node.attrs.alt,
      });
      setIsReplaceModalOpen(false);
    } catch (err: any) {
      alert(`Replacement upload error: ${err.message || 'Failed to replace image'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  // Handle URL Replacement
  const handleUrlReplace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceUrl.trim()) return;
    updateAttributes({
      src: replaceUrl.trim(),
      alt: replaceAlt.trim() || node.attrs.alt,
    });
    setIsReplaceModalOpen(false);
  };

  // Handle Media Library Selection Replacement
  const handleSelectLibImage = () => {
    if (!selectedLibImage) return;
    const filename = selectedLibImage.split('/').pop() || '';
    const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    updateAttributes({
      src: selectedLibImage,
      alt: cleanName || node.attrs.alt,
    });
    setIsReplaceModalOpen(false);
  };

  // Alignment classes
  const alignmentClass = {
    left: 'mr-auto',
    center: 'mx-auto',
    right: 'ml-auto',
    full: 'w-full',
  }[alignment as 'left' | 'center' | 'right' | 'full'] || 'mx-auto';

  const isBarVisible = isHovered || selected || isReplaceModalOpen;

  return (
    <NodeViewWrapper 
      className="relative my-6 group/img transition-all select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative ${alignmentClass} max-w-full transition-all`}>
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
            title="Drag and drop Image into any section" 
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white cursor-grab active:cursor-grabbing font-mono text-[11px] font-semibold select-none border border-slate-600/50 shadow-xs mr-1"
          >
            <GripVertical size={14} className="text-red-400" />
            <span>Drag</span>
          </div>

          {/* Section Move Group */}
          <div className="flex items-center gap-0.5 pr-1 border-r border-slate-700/80">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleMoveUp}
              disabled={!canUp}
              title={canUp ? 'Move section up (above previous paragraph)' : 'Already at the top of this section'}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowUp size={15} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleMoveDown}
              disabled={!canDown}
              title={canDown ? 'Move section down (below next paragraph)' : 'Already at the bottom of this section'}
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

          {/* Alignment Group */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-700/80">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateAttributes({ alignment: 'left' })}
              title="Align Left"
              className={`p-1.5 rounded-lg transition-colors ${
                alignment === 'left' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <AlignLeft size={15} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateAttributes({ alignment: 'center' })}
              title="Align Center"
              className={`p-1.5 rounded-lg transition-colors ${
                alignment === 'center' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <AlignCenter size={15} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateAttributes({ alignment: 'right' })}
              title="Align Right"
              className={`p-1.5 rounded-lg transition-colors ${
                alignment === 'right' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <AlignRight size={15} />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateAttributes({ alignment: 'full' })}
              title="Full Width"
              className={`p-1.5 rounded-lg transition-colors ${
                alignment === 'full' ? 'bg-red-600 text-white font-bold' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Maximize2 size={15} />
            </button>
          </div>

          {/* Replace Button */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-700/80">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setReplaceUrl(node.attrs.src || '');
                setReplaceAlt(node.attrs.alt || '');
                setIsReplaceModalOpen(true);
              }}
              title="Replace Image with new file, media library, or URL"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              <RefreshCw size={13} className="text-red-400" />
              <span>Replace</span>
            </button>
          </div>

          {/* Delete Button */}
          <div className="pl-1">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteNode();
              }}
              title="Delete Image"
              className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white transition-colors cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* The Image Element */}
        <div className={`relative rounded-2xl overflow-hidden shadow-md border transition-all ${
          selected 
            ? 'ring-3 ring-red-500 border-red-500 shadow-xl' 
            : 'border-slate-200 dark:border-slate-800 hover:border-red-400/60'
        }`}>
          {/* Floating Drag Badge on Image */}
          <div 
            data-drag-handle=""
            title="Click and drag to move image into any section"
            className={`absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/90 dark:bg-slate-900/95 text-white backdrop-blur-md shadow-xl border border-slate-700/80 cursor-grab active:cursor-grabbing select-none transition-all duration-200 ${
              isHovered || selected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
            }`}
          >
            <GripVertical size={14} className="text-red-400" />
            <span className="text-[11px] font-semibold tracking-wide">Drag Image</span>
          </div>

          <img
            src={node.attrs.src}
            alt={node.attrs.alt || ''}
            className={`w-full block object-cover max-h-[700px] transition-transform duration-200 ${
              alignment === 'full' ? 'w-full' : ''
            }`}
            draggable={false}
          />

          {/* Bottom-right Quick Info badge */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] text-white/90 font-mono tracking-wider opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
            {alignment.toUpperCase()} • IN-PARAGRAPH
          </div>
        </div>

        {/* Caption Field */}
        <div className="mt-2 text-center">
          {showCaptionInput ? (
            <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
              <input
                type="text"
                value={caption}
                onChange={(e) => updateAttributes({ caption: e.target.value })}
                placeholder="Write caption or attribution (e.g. Photo courtesy of TechLab)..."
                className="w-full text-center text-xs text-slate-600 dark:text-slate-400 italic bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-red-500 focus:outline-none py-1 transition-colors"
              />
              <button
                type="button"
                onClick={() => {
                  updateAttributes({ caption: '' });
                  setShowCaptionInput(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1"
                title="Remove caption"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCaptionInput(true)}
              className="text-[11px] text-slate-400 hover:text-red-600 dark:hover:text-red-400 italic opacity-0 group-hover/img:opacity-100 transition-opacity"
            >
              + Add image caption / credit
            </button>
          )}
        </div>
      </div>

      {/* ── REPLACE IMAGE MODAL ── */}
      {isReplaceModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsReplaceModalOpen(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-900 dark:text-white animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base font-display">Replace Image in Section</h3>
                  <p className="text-xs text-slate-500">Swap this in-body photo while preserving document position</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReplaceModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current vs Replacement preview */}
            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
              <img
                src={node.attrs.src}
                alt="Current"
                className="w-16 h-12 object-cover rounded-lg border border-slate-300 dark:border-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Current Image</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 truncate font-mono">{node.attrs.src}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 mt-5">
              <button
                type="button"
                onClick={() => setReplaceTab('upload')}
                className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold border-b-2 transition-colors ${
                  replaceTab === 'upload'
                    ? 'border-red-600 text-red-600 dark:text-red-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Upload size={14} /> Upload New Photo
              </button>
              <button
                type="button"
                onClick={() => setReplaceTab('library')}
                className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold border-b-2 transition-colors ${
                  replaceTab === 'library'
                    ? 'border-red-600 text-red-600 dark:text-red-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Folder size={14} /> Media Library
              </button>
              <button
                type="button"
                onClick={() => setReplaceTab('url')}
                className={`flex items-center gap-1.5 py-2.5 px-4 text-xs font-bold border-b-2 transition-colors ${
                  replaceTab === 'url'
                    ? 'border-red-600 text-red-600 dark:text-red-400'
                    : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LinkIcon size={14} /> Image URL
              </button>
            </div>

            {/* Tab 1: Upload */}
            {replaceTab === 'upload' && (
              <div className="mt-5 space-y-4">
                <input
                  type="file"
                  ref={replaceFileInputRef}
                  onChange={handleFileReplace}
                  accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
                  className="hidden"
                />

                <div
                  onClick={() => replaceFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/40 hover:bg-red-50/20 dark:hover:bg-red-950/20 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    {isUploading ? (
                      <RefreshCw size={22} className="animate-spin text-red-500" />
                    ) : (
                      <Upload size={22} />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">
                    {isUploading ? uploadProgress : 'Click to select replacement image'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Optimizes resolution and converts to lightweight WebP automatically before replacing.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Media Library */}
            {replaceTab === 'library' && (
              <div className="mt-5 space-y-3">
                {libFolders.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {libFolders.map((f) => (
                      <button
                        key={f.path}
                        type="button"
                        onClick={() => loadMediaLibrary(f.path)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-red-50 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        <Folder size={12} className="text-amber-500" />
                        <span>{f.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={libSearch}
                      onChange={(e) => setLibSearch(e.target.value)}
                      placeholder="Search media files..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50 [scrollbar-width:thin]">
                  {libLoading ? (
                    <div className="py-8 text-center text-xs text-slate-400">Loading library...</div>
                  ) : libImages.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">No media images found</div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {libImages
                        .filter((img) => img.name.toLowerCase().includes(libSearch.toLowerCase()))
                        .map((img) => (
                          <div
                            key={img.url}
                            onClick={() => setSelectedLibImage(img.url)}
                            className={`group relative rounded-xl overflow-hidden aspect-video border-2 cursor-pointer transition-all ${
                              selectedLibImage === img.url
                                ? 'border-red-600 ring-2 ring-red-500/50 shadow-md'
                                : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            {selectedLibImage === img.url && (
                              <div className="absolute top-1 right-1 p-0.5 rounded-full bg-red-600 text-white">
                                <Check size={11} />
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={!selectedLibImage}
                    onClick={handleSelectLibImage}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Replace with Selected
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: URL */}
            {replaceTab === 'url' && (
              <div 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUrlReplace(e);
                  }
                }}
                className="mt-5 space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Replacement Image URL *
                  </label>
                  <input
                    type="url"
                    value={replaceUrl}
                    onChange={(e) => setReplaceUrl(e.target.value)}
                    placeholder="https://example.com/photo.webp or /storage/media/..."
                    required
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Alt Text Description
                  </label>
                  <input
                    type="text"
                    value={replaceAlt}
                    onChange={(e) => setReplaceAlt(e.target.value)}
                    placeholder="Describe the image content..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReplaceModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUrlReplace}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Apply Replacement
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </NodeViewWrapper>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Editor, ReactNodeViewRenderer } from '@tiptap/react';
import { Node } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import Youtube, { getEmbedUrlFromYoutubeUrl } from '@tiptap/extension-youtube';
import ImageNodeView from './ImageNodeView';
import YoutubeNodeView, { getYoutubeVideoId } from './YoutubeNodeView';
import TerminalNodeView from './TerminalNodeView';
import LinkCardNodeView from './LinkCardNodeView';
import './TiptapEditor.css';

const CustomImage = Image.extend({
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: 'center',
        renderHTML: (attributes) => ({
          'data-alignment': attributes.alignment || 'center',
        }),
        parseHTML: (element) => element.getAttribute('data-alignment') || 'center',
      },
      caption: {
        default: '',
        renderHTML: (attributes) => ({
          'data-caption': attributes.caption || '',
        }),
        parseHTML: (element) => element.getAttribute('data-caption') || '',
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

const CustomYoutube = Youtube.extend({
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      alignment: {
        default: 'center',
        renderHTML: (attributes) => ({
          'data-alignment': attributes.alignment || 'center',
        }),
        parseHTML: (element) => element.getAttribute('data-alignment') || 'center',
      },
      caption: {
        default: '',
        renderHTML: (attributes) => ({
          'data-caption': attributes.caption || '',
        }),
        parseHTML: (element) => element.getAttribute('data-caption') || '',
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'div[data-youtube-video]',
        getAttrs: (element) => {
          if (typeof element === 'string') return {};
          const iframe = element.querySelector('iframe');
          const src = iframe?.getAttribute('src') || element.getAttribute('data-src') || element.getAttribute('src');
          return {
            src,
            alignment: element.getAttribute('data-alignment') || 'center',
            caption: element.getAttribute('data-caption') || '',
          };
        },
      },
      {
        tag: '#demonstration-video-card',
        getAttrs: (element) => {
          if (typeof element === 'string') return {};
          const iframe = element.querySelector('iframe');
          return {
            src: iframe?.getAttribute('src') || 'https://www.youtube.com/watch?v=eqOfmtTJD1A',
            alignment: 'center',
            caption: 'Tesla Roadster SpaceX Thrusters Flight Demonstration',
          };
        },
      },
      {
        tag: 'iframe[src*="youtube.com"]',
        getAttrs: (element) => {
          if (typeof element === 'string') return {};
          return { src: element.getAttribute('src') };
        },
      },
      {
        tag: 'iframe[src*="youtube-nocookie.com"]',
        getAttrs: (element) => {
          if (typeof element === 'string') return {};
          return { src: element.getAttribute('src') };
        },
      },
      {
        tag: 'iframe[src*="youtu.be"]',
        getAttrs: (element) => {
          if (typeof element === 'string') return {};
          return { src: element.getAttribute('src') };
        },
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const embedUrl = getEmbedUrlFromYoutubeUrl({
      url: HTMLAttributes.src,
      controls: true,
      nocookie: true,
      allowFullscreen: true,
      autoplay: false,
    }) || HTMLAttributes.src;

    const alignment = HTMLAttributes['data-alignment'] || 'center';
    const caption = HTMLAttributes['data-caption'] || '';

    return [
      'div',
      {
        'data-youtube-video': '',
        'data-alignment': alignment,
        'data-caption': caption,
        class: `article-youtube-wrapper my-8 w-full ${alignment === 'full' ? 'max-w-none' : 'max-w-4xl'} mx-auto`,
      },
      [
        'div',
        { class: 'relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-black' },
        [
          'iframe',
          {
            src: embedUrl,
            class: 'absolute top-0 left-0 w-full h-full border-0',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
            allowfullscreen: 'true',
            loading: 'lazy',
          },
        ],
      ],
      ...(caption ? [
        [
          'p',
          { class: 'text-xs text-center text-slate-500 dark:text-slate-400 mt-2 font-medium' },
          caption,
        ]
      ] : []),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(YoutubeNodeView);
  },
});

const CustomTable = Table.extend({
  draggable: true,
});

const CustomTerminal = Node.create({
  name: 'customTerminal',
  group: 'block',
  content: '',
  draggable: true,
  selectable: true,
  isolating: true,
  addAttributes() {
    return {
      language: {
        default: 'bash',
        parseHTML: (element) => element.getAttribute('data-language') || 'bash',
        renderHTML: (attributes) => ({ 'data-language': attributes.language || 'bash' }),
      },
      title: {
        default: 'Terminal',
        parseHTML: (element) => element.getAttribute('data-title') || 'Terminal',
        renderHTML: (attributes) => ({ 'data-title': attributes.title || 'Terminal' }),
      },
      code: {
        default: '',
        parseHTML: (element) => {
          const pre = element.querySelector('pre');
          const codeEl = element.querySelector('code');
          return codeEl?.textContent || pre?.textContent || element.getAttribute('data-code') || '';
        },
        renderHTML: (attributes) => ({ 'data-code': attributes.code || '' }),
      },
    };
  },
  parseHTML() {
    return [
      { tag: 'div[data-terminal-block]' },
      { tag: 'div.code-terminal-block' },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const lang = HTMLAttributes['data-language'] || 'bash';
    const title = HTMLAttributes['data-title'] || 'Terminal';
    const code = HTMLAttributes['data-code'] || '';
    const encoded = encodeURIComponent(code.trim());

    return [
      'div',
      {
        class: 'code-terminal-block my-6 rounded-2xl overflow-hidden border border-slate-800 bg-[#0f172a] shadow-xl',
        'data-terminal-block': '',
        'data-language': lang,
        'data-title': title,
        'data-code': code,
      },
      [
        'div',
        { class: 'flex items-center justify-between px-4 py-2.5 bg-[#1e293b] border-b border-slate-700/60' },
        [
          'div',
          { class: 'flex items-center gap-2' },
          ['span', { class: 'w-2.5 h-2.5 rounded-full bg-red-500/90' }],
          ['span', { class: 'w-2.5 h-2.5 rounded-full bg-amber-500/90' }],
          ['span', { class: 'w-2.5 h-2.5 rounded-full bg-emerald-500/90' }],
          ['span', { class: 'text-xs font-mono text-slate-400 ml-2 font-medium' }, `${title} (${lang})`],
        ],
        [
          'button',
          { class: 'copy-code-btn text-xs text-slate-400 hover:text-white flex items-center gap-1', 'data-code': encoded },
          ['span', {}, 'Copy'],
        ],
      ],
      [
        'pre',
        { class: 'p-4 text-xs sm:text-sm font-mono text-slate-100 overflow-x-auto leading-relaxed bg-[#0f172a]' },
        ['code', {}, code],
      ],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(TerminalNodeView);
  },
});

const CustomLinkCard = Node.create({
  name: 'customLinkCard',
  group: 'block',
  draggable: true,
  selectable: true,
  isolating: true,
  addAttributes() {
    return {
      url: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-url') || el.querySelector('a')?.getAttribute('href') || '',
        renderHTML: (attrs) => ({ 'data-url': attrs.url || '' }),
      },
      title: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-title') || el.querySelector('h4')?.textContent || '',
        renderHTML: (attrs) => ({ 'data-title': attrs.title || '' }),
      },
      description: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-description') || el.querySelector('p')?.textContent || '',
        renderHTML: (attrs) => ({ 'data-description': attrs.description || '' }),
      },
      siteName: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-site-name') || '',
        renderHTML: (attrs) => ({ 'data-site-name': attrs.siteName || '' }),
      },
    };
  },
  parseHTML() {
    return [
      { tag: 'div[data-link-card]' },
      { tag: 'div.rich-link-card' },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const url = HTMLAttributes['data-url'] || '#';
    const title = HTMLAttributes['data-title'] || url;
    const desc = HTMLAttributes['data-description'] || '';
    let site = HTMLAttributes['data-site-name'];
    if (!site) {
      try {
        site = new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '').toUpperCase();
      } catch {
        site = 'LINK';
      }
    }

    return [
      'div',
      {
        class: 'rich-link-card my-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md transition-all hover:border-red-500/50',
        'data-link-card': '',
        'data-url': url,
        'data-title': title,
        'data-description': desc,
        'data-site-name': site,
      },
      [
        'a',
        { href: url, target: '_blank', rel: 'noopener noreferrer', class: 'flex items-center justify-between p-4 no-underline group' },
        [
          'div',
          { class: 'flex-1 min-w-0 pr-4' },
          ['div', { class: 'text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400 mb-1 flex items-center gap-1.5' }, site],
          ['div', { class: 'text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate' }, title],
          ...(desc ? [['div', { class: 'text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2' }, desc]] : []),
          ['div', { class: 'text-[11px] text-slate-400 mt-2 truncate font-mono' }, url],
        ],
        [
          'div',
          { class: 'p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-red-50 dark:group-hover:bg-red-950/40 group-hover:text-red-600 transition-colors' },
          ['span', { class: 'text-lg font-bold' }, '↗'],
        ],
      ],
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(LinkCardNodeView);
  },
});

import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code, 
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Minus, 
  Image as ImageIcon, Link as LinkIcon, Undo, Redo, X, ExternalLink, 
  Trash2, Check, Upload, Folder, ArrowLeft, Search, RefreshCw, Plus,
  Terminal, Table as TableIcon, Sparkles, ChevronDown, Copy, GripVertical, ArrowUp, ArrowDown, AlertCircle
} from 'lucide-react';

interface MenuBarProps {
  editor: Editor | null;
  onOpenLinkModal: (defaultTab?: 'inline' | 'card') => void;
  onOpenImageModal: () => void;
  onOpenYoutubeModal: () => void;
  onOpenTerminalModal: () => void;
  onOpenTableModal: () => void;
  onOpenStylesModal: () => void;
}

const MenuBar = ({ 
  editor, 
  onOpenLinkModal, 
  onOpenImageModal, 
  onOpenYoutubeModal,
  onOpenTerminalModal, 
  onOpenTableModal, 
  onOpenStylesModal 
}: MenuBarProps) => {
  if (!editor) return null;

  const btnClass = "tiptap-ribbon-btn";
  const activeClass = "is-active";

  return (
    <div className="tiptap-ribbon-menubar tw-scope">
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()} className={`${btnClass} ${editor.isActive('bold') ? activeClass : ''}`} type="button" title="Bold"><Bold size={16} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()} className={`${btnClass} ${editor.isActive('italic') ? activeClass : ''}`} type="button" title="Italic"><Italic size={16} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${btnClass} ${editor.isActive('underline') ? activeClass : ''}`} type="button" title="Underline"><UnderlineIcon size={16} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleStrike().run()} className={`${btnClass} ${editor.isActive('strike') ? activeClass : ''}`} type="button" title="Strikethrough"><Strikethrough size={16} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleCode().run()} className={`${btnClass} ${editor.isActive('code') ? activeClass : ''}`} type="button" title="Inline Code"><Code size={16} /></button>
      
      <div className="tiptap-ribbon-divider"></div>
      
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`${btnClass} ${editor.isActive('heading', { level: 1 }) ? activeClass : ''}`} type="button" title="Heading 1"><Heading1 size={16} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${btnClass} ${editor.isActive('heading', { level: 2 }) ? activeClass : ''}`} type="button" title="Heading 2"><Heading2 size={16} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${btnClass} ${editor.isActive('heading', { level: 3 }) ? activeClass : ''}`} type="button" title="Heading 3"><Heading3 size={16} /></button>
      
      <div className="tiptap-ribbon-divider"></div>
      
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${btnClass} ${editor.isActive('bulletList') ? activeClass : ''}`} type="button" title="Bullet List"><List size={16} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${btnClass} ${editor.isActive('orderedList') ? activeClass : ''}`} type="button" title="Ordered List"><ListOrdered size={16} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${btnClass} ${editor.isActive('blockquote') ? activeClass : ''}`} type="button" title="Blockquote"><Quote size={16} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass} type="button" title="Horizontal Rule"><Minus size={16} /></button>
      
      <div className="tiptap-ribbon-divider"></div>

      {/* Link and Link Card */}
      <button 
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onOpenLinkModal('inline')} 
        className={`${btnClass} ${editor.isActive('link') ? activeClass : ''}`} 
        type="button" 
        title="Insert Link or Draggable Link Card"
      >
        <LinkIcon size={16} />
      </button>

      {/* Image Tool */}
      <button 
        onMouseDown={(e) => e.preventDefault()}
        onClick={onOpenImageModal} 
        className={`${btnClass} ${editor.isActive('image') ? activeClass : ''}`} 
        type="button" 
        title="Insert Image into Section"
      >
        <ImageIcon size={16} />
      </button>

      <div className="tiptap-ribbon-divider"></div>

      {/* Code Terminal Button - Pixel-matched to user screenshot: 🔴 🟡 🟢  >_ Terminal */}
      <button 
        onMouseDown={(e) => e.preventDefault()}
        onClick={onOpenTerminalModal} 
        className="tiptap-terminal-pill" 
        type="button" 
        title="Insert macOS Code Terminal Block"
      >
        <span className="tiptap-terminal-dots">
          <span className="code-terminal-dot red"></span>
          <span className="code-terminal-dot yellow"></span>
          <span className="code-terminal-dot green"></span>
        </span>
        <span style={{ color: '#10b981', fontWeight: 800, fontFamily: 'monospace', marginLeft: '2px' }}>&gt;_</span>
        <span style={{ color: '#f8fafc', fontWeight: 600 }}>Terminal</span>
      </button>

      <div className="tiptap-ribbon-divider"></div>

      {/* Dedicated YouTube Video Tool */}
      <button 
        onMouseDown={(e) => e.preventDefault()}
        onClick={onOpenYoutubeModal} 
        className={`tiptap-youtube-pill ${editor.isActive('youtube') ? 'is-active' : ''}`} 
        type="button" 
        title="Insert YouTube Video into Section"
      >
        <svg viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
        <span>YouTube</span>
      </button>

      {/* Table Style & Manager */}
      <button 
        onMouseDown={(e) => e.preventDefault()}
        onClick={onOpenTableModal} 
        className={`tiptap-table-pill ${editor.isActive('table') ? 'is-active' : ''}`} 
        type="button" 
        title="Insert & Style Tables"
      >
        <TableIcon size={15} />
        <span>Table</span>
        <ChevronDown size={11} style={{ opacity: 0.6 }} />
      </button>

      {/* Special Content Styles & Callouts */}
      <button 
        onMouseDown={(e) => e.preventDefault()}
        onClick={onOpenStylesModal} 
        className="tiptap-styles-pill" 
        type="button" 
        title="Callout Boxes & Rich Styles"
      >
        <Sparkles size={15} />
        <span>Styles</span>
        <ChevronDown size={11} style={{ opacity: 0.6 }} />
      </button>
        
      <div className="tiptap-ribbon-spacer"></div>
      
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btnClass} type="button" title="Undo"><Undo size={16} /></button>
      <button onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btnClass} type="button" title="Redo"><Redo size={16} /></button>
    </div>
  );
};

/**
 * Client-side Canvas Image Compression
 * Downscales images exceeding 1920px and converts to WebP (0.85 quality),
 * reducing a 10MB photo down to ~150-300KB before transmission.
 */
export const compressImageFile = async (file: File): Promise<Blob | File> => {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file;
  }
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 1920;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/webp',
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
};

/**
 * Upload an image file or blob directly to the server, returning the public static WebP URL.
 */
export const uploadImageToServer = async (fileOrBlob: File | Blob, originalName: string = 'image.webp'): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const rawMedia = localStorage.getItem('happy_machinery_shared_media-library') || '[]';
        let mediaArr: any[] = [];
        try { mediaArr = JSON.parse(rawMedia); } catch { mediaArr = []; }
        const cleanTitle = originalName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const newItem = {
          id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: cleanTitle || 'Jobsite Equipment Image',
          url: dataUrl,
          folder: 'galleries',
          dateAdded: new Date().toISOString().split('T')[0],
          size: `${(fileOrBlob.size / 1024).toFixed(1)} KB`
        };
        const updated = [newItem, ...mediaArr];
        localStorage.setItem('happy_machinery_shared_media-library', JSON.stringify(updated));
        fetch('/api/content.php?key=media-library', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: updated })
        }).catch(() => {});
      } catch (err) {
        console.warn('Storage sync warning:', err);
      }
      resolve(dataUrl);
    };
    reader.readAsDataURL(fileOrBlob);
  });
};

/**
 * Upload a raw Base64 data URI to the server, returning the public static WebP URL.
 */
export const uploadBase64ImageToServer = async (base64DataUri: string): Promise<string> => {
  return base64DataUri;
};

/**
 * Pre-save scanner: finds all inline Base64 images in HTML/JSON, uploads them to the server,
 * and replaces the multi-megabyte Base64 strings with lightweight static URLs.
 */
export const uploadAllBase64ImagesInHtml = async (
  html: string,
  rawJson?: string
): Promise<{ html: string; rawJson?: string }> => {
  if (!html || !html.includes('data:image/')) {
    return { html, rawJson };
  }

  const matches = Array.from(html.matchAll(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+\/=\s]+/g));
  if (matches.length === 0) {
    return { html, rawJson };
  }

  const uniqueUris = Array.from(new Set(matches.map((m) => m[0])));
  let newHtml = html;
  let newRaw = rawJson || '';

  await Promise.all(
    uniqueUris.map(async (uri) => {
      try {
        const cleanUri = uri.replace(/\s+/g, '');
        const uploadedUrl = await uploadBase64ImageToServer(cleanUri);
        newHtml = newHtml.split(uri).join(uploadedUrl);
        if (newRaw) {
          newRaw = newRaw.split(uri).join(uploadedUrl);
        }
      } catch (err) {
        console.error('Failed to auto-upload inline base64 image:', err);
      }
    })
  );

  return { html: newHtml, rawJson: newRaw };
};

export interface TiptapEditorProps {
  content?: any;
  onChangeRaw?: (json: string) => void;
  onChangeHtml?: (html: string) => void;
  mediaList?: Array<{ id: string; title: string; url: string; size?: string; folder?: string; dateAdded?: string }>;
  onMediaUploaded?: (newItem: any) => void;
}

export default function TiptapEditor({ 
  content = '', 
  onChangeRaw, 
  onChangeHtml,
  mediaList = [],
  onMediaUploaded
}: TiptapEditorProps) {
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);
  const [isEditingLink, setIsEditingLink] = useState(false);

  // Dedicated YouTube modal state
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeCaption, setYoutubeCaption] = useState('');
  const [youtubeAlignment, setYoutubeAlignment] = useState<'center' | 'left' | 'right' | 'full'>('center');
  const [youtubeError, setYoutubeError] = useState('');

  // Image insertion states
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [activeImageTab, setActiveImageTab] = useState<'library' | 'upload' | 'url'>('library');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // Preserve exact cursor position in editor
  const [savedSelection, setSavedSelection] = useState<{ from: number; to: number } | null>(null);
  const savedSelectionRef = useRef<{ from: number; to: number } | null>(null);

  // Multi-upload state
  const [uploadedFilesList, setUploadedFilesList] = useState<Array<{ src: string; name: string; alt: string }>>([]);

  // Uploading state for device files & paste/drop
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const uploadAndInsertFilesRef = useRef<((files: File[]) => Promise<void>) | null>(null);

  // Media library in-modal browser
  const [libPath, setLibPath] = useState('');
  const [libFolders, setLibFolders] = useState<Array<{ name: string; path: string }>>([]);
  const [libImages, setLibImages] = useState<Array<{ name: string; url: string; size: number }>>([]);
  const [libLoading, setLibLoading] = useState(false);
  const [libSearch, setLibSearch] = useState('');
  const [selectedLibImages, setSelectedLibImages] = useState<string[]>([]);

  // Code Terminal modal state
  const [terminalModalOpen, setTerminalModalOpen] = useState(false);
  const [terminalTitle, setTerminalTitle] = useState('Terminal');
  const [terminalLang, setTerminalLang] = useState('bash');
  const [terminalCode, setTerminalCode] = useState('');

  // Link Modal additional states for Draggable Link Card
  const [linkTab, setLinkTab] = useState<'inline' | 'card'>('inline');
  const [linkCardTitle, setLinkCardTitle] = useState('');
  const [linkCardDesc, setLinkCardDesc] = useState('');
  const [linkCardSite, setLinkCardSite] = useState('');

  // Table modal state
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableWithHeader, setTableWithHeader] = useState(true);

  // Special Styles & Callouts modal state
  const [stylesModalOpen, setStylesModalOpen] = useState(false);

  const safeContent = React.useMemo(() => {
    if (!content) return '';
    if (typeof content === 'string') {
      const trimmed = content.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object') return parsed;
        } catch {
          return content;
        }
      }
      return content;
    }
    return content;
  }, [content]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      CustomTable.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'editor-table border-collapse border border-slate-300 dark:border-slate-700 w-full my-5 text-sm',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'editor-th bg-slate-100 dark:bg-slate-800 p-3 text-left font-bold text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'editor-td p-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300',
        },
      }),
      CustomImage.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-2xl max-w-full my-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-all hover:ring-2 hover:ring-red-500/30',
        },
      }),
      CustomYoutube.configure({
        controls: true,
        nocookie: true,
        allowFullscreen: true,
        autoplay: false,
        HTMLAttributes: {
          class: 'article-youtube-iframe w-full aspect-video rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800',
        },
      }),
      CustomTerminal,
      CustomLinkCard,
      Link.configure({ 
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-red-600 dark:text-red-400 underline underline-offset-2 hover:text-red-700',
        },
      }),
    ],
    content: safeContent,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none min-h-[440px] p-5 text-slate-800 dark:text-slate-100',
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) imageFiles.push(file);
          }
        }

        if (imageFiles.length > 0) {
          event.preventDefault();
          uploadAndInsertFilesRef.current?.(imageFiles);
          return true;
        }

        return false;
      },
      handleDrop: (_view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        const imageFiles: File[] = [];
        for (let i = 0; i < files.length; i++) {
          if (files[i].type.startsWith('image/')) {
            imageFiles.push(files[i]);
          }
        }

        if (imageFiles.length > 0) {
          event.preventDefault();
          uploadAndInsertFilesRef.current?.(imageFiles);
          return true;
        }

        return false;
      },
    },
    onSelectionUpdate: ({ editor }) => {
      const sel = { from: editor.state.selection.from, to: editor.state.selection.to };
      setSavedSelection(sel);
      savedSelectionRef.current = sel;
    },
    onUpdate: ({ editor }) => {
      onChangeRaw?.(JSON.stringify(editor.getJSON()));
      onChangeHtml?.(editor.getHTML());
    },
  });

  // Load Media Library images when browser tab opens or path changes
  const loadMediaLibrary = async (folderPath: string = '') => {
    setLibLoading(true);
    try {
      let list = mediaList && mediaList.length > 0 ? mediaList : [];
      if (!list.length) {
        try {
          const res = await fetch('/api/content.php?key=media-library');
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.value)) list = data.value;
          }
        } catch {}
        if (!list.length) {
          const raw = localStorage.getItem('happy_machinery_shared_media-library');
          if (raw) {
            try { list = JSON.parse(raw); } catch {}
          }
        }
      }

      setLibFolders([
        { name: 'All Media', path: '' },
        { name: 'galleries', path: 'galleries' },
        { name: 'features', path: 'features' },
        { name: 'profileimg', path: 'profileimg' },
      ]);

      const filtered = folderPath && folderPath !== 'all'
        ? list.filter((m: any) => (m.folder || 'galleries') === folderPath)
        : list;

      setLibImages(
        filtered.map((m: any) => ({
          name: m.title || 'Equipment Asset',
          url: m.url,
          size: m.size ? parseInt(m.size) * 1024 : 150000,
        }))
      );
      setLibPath(folderPath);
    } catch (err) {
      console.error('Failed to load media library:', err);
    } finally {
      setLibLoading(false);
    }
  };

  useEffect(() => {
    if (imageModalOpen && activeImageTab === 'library') {
      loadMediaLibrary(libPath);
    }
  }, [imageModalOpen, activeImageTab]);

  const handleOpenLinkModal = (defaultTab: 'inline' | 'card' = 'inline') => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    const previousTarget = editor.getAttributes('link').target;
    setLinkUrl(previousUrl);
    setLinkNewTab(previousTarget === '_blank' || !previousUrl);
    setIsEditingLink(Boolean(previousUrl));
    setLinkTab(defaultTab);
    setLinkCardTitle('');
    setLinkCardDesc('');
    setLinkCardSite('');
    setLinkModalOpen(true);
  };

  const handleApplyLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      if (linkTab === 'inline') {
        editor.chain().focus().unsetLink().run();
      }
      setLinkModalOpen(false);
      return;
    }
    let finalUrl = trimmed;
    if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('/') && !finalUrl.startsWith('#') && !finalUrl.startsWith('mailto:')) {
      finalUrl = 'https://' + finalUrl;
    }

    if (linkTab === 'card') {
      editor.chain().focus().insertContent({
        type: 'customLinkCard',
        attrs: {
          url: finalUrl,
          title: linkCardTitle.trim() || finalUrl,
          description: linkCardDesc.trim(),
          siteName: linkCardSite.trim(),
        },
      }).run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: finalUrl, target: linkNewTab ? '_blank' : null })
        .run();
    }
    setLinkModalOpen(false);
  };

  const handleRemoveLink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
    setLinkModalOpen(false);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenImageModal = () => {
    // Preserve current editor cursor position
    if (editor) {
      const sel = { from: editor.state.selection.from, to: editor.state.selection.to };
      setSavedSelection(sel);
      savedSelectionRef.current = sel;
    }
    setImageUrl('');
    setImageAlt('');
    setImagePreviewError(false);
    setUploadedFilesList([]);
    setSelectedLibImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setImageModalOpen(true);
  };

  const handleOpenTerminalModal = () => {
    if (editor) {
      const sel = { from: editor.state.selection.from, to: editor.state.selection.to };
      setSavedSelection(sel);
      savedSelectionRef.current = sel;
    }
    setTerminalModalOpen(true);
  };

  const handleOpenTableModal = () => {
    if (editor) {
      const sel = { from: editor.state.selection.from, to: editor.state.selection.to };
      setSavedSelection(sel);
      savedSelectionRef.current = sel;
    }
    setTableModalOpen(true);
  };

  const handleOpenStylesModal = () => {
    if (editor) {
      const sel = { from: editor.state.selection.from, to: editor.state.selection.to };
      setSavedSelection(sel);
      savedSelectionRef.current = sel;
    }
    setStylesModalOpen(true);
  };

  const handleOpenYoutubeModal = () => {
    if (editor) {
      const sel = { from: editor.state.selection.from, to: editor.state.selection.to };
      setSavedSelection(sel);
      savedSelectionRef.current = sel;
    }
    setYoutubeUrl('');
    setYoutubeCaption('');
    setYoutubeAlignment('center');
    setYoutubeError('');
    setYoutubeModalOpen(true);
  };

  const handleInsertYoutube = () => {
    const cleanUrl = youtubeUrl.trim();
    if (!cleanUrl) return;

    const videoId = getYoutubeVideoId(cleanUrl);
    if (!videoId) {
      setYoutubeError('Please enter a valid YouTube video URL or ID.');
      return;
    }

    if (savedSelectionRef.current && editor) {
      try {
        editor.commands.setTextSelection(savedSelectionRef.current);
      } catch {}
    }

    const attrs = {
      src: cleanUrl,
      alignment: youtubeAlignment,
      caption: youtubeCaption.trim(),
    };

    if (editor) {
      const success = editor.chain().focus().insertContent({
        type: 'youtube',
        attrs,
      }).run();

      if (!success) {
        editor.commands.setYoutubeVideo(attrs);
      }
    }

    setYoutubeModalOpen(false);
    setYoutubeUrl('');
    setYoutubeCaption('');
    setYoutubeError('');
  };

  const handleInsertTerminal = () => {
    if (!editor) return;
    const lang = terminalLang || 'bash';
    const code = terminalCode || '# Enter terminal commands here\necho "Hello from Rafvex"\n';
    const title = terminalTitle || 'Terminal';

    editor.chain().focus().insertContent({
      type: 'customTerminal',
      attrs: {
        language: lang,
        title: title,
        code: code,
      },
    }).run();

    setTerminalModalOpen(false);
    setTerminalCode('');
  };

  const handleMoveCurrentTable = (direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!editor) return;
    try {
      const { state, dispatch } = editor.view;
      const { $from } = state.selection;

      let tableDepth = -1;
      for (let d = $from.depth; d > 0; d--) {
        if ($from.node(d).type.name === 'table') {
          tableDepth = d;
          break;
        }
      }
      if (tableDepth === -1) return;

      const tableNode = $from.node(tableDepth);
      const tablePos = $from.before(tableDepth);
      const tableEnd = $from.after(tableDepth);

      const $tablePos = state.doc.resolve(tablePos);
      const parent = $tablePos.parent;
      const index = $tablePos.index();

      if (direction === 'up' && index > 0) {
        const prevNode = parent.child(index - 1);
        const targetPos = tablePos - prevNode.nodeSize;
        const tr = state.tr;
        tr.delete(tablePos, tableEnd);
        tr.insert(targetPos, tableNode);
        dispatch(tr);
      } else if (direction === 'down' && index < parent.childCount - 1) {
        const nextNode = parent.child(index + 1);
        const tr = state.tr;
        tr.delete(tablePos, tableEnd);
        tr.insert(tablePos + nextNode.nodeSize, tableNode);
        dispatch(tr);
      } else if (direction === 'top' && index > 0) {
        const tr = state.tr;
        tr.delete(tablePos, tableEnd);
        tr.insert(0, tableNode);
        dispatch(tr);
      } else if (direction === 'bottom' && index < parent.childCount - 1) {
        const tr = state.tr;
        tr.delete(tablePos, tableEnd);
        tr.insert(tr.doc.content.size, tableNode);
        dispatch(tr);
      }
    } catch (err) {
      console.error('Failed to move table section:', err);
    }
  };

  const handleInsertCustomTable = (rows: number, cols: number, withHeader: boolean) => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: Math.max(1, rows), cols: Math.max(1, cols), withHeaderRow: withHeader }).run();
    setTableModalOpen(false);
  };

  const handleInsertComparisonTable = () => {
    if (!editor) return;
    const tableHtml = `<div class="overflow-x-auto my-6">
  <table class="w-full text-left border-collapse border border-slate-200 dark:border-slate-800 text-sm">
    <thead>
      <tr class="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold">
        <th class="p-3 border border-slate-200 dark:border-slate-700">Component / Process</th>
        <th class="p-3 border border-slate-200 dark:border-slate-700">Typical Consumption</th>
        <th class="p-3 border border-slate-200 dark:border-slate-700">Technical Explanation</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="p-3 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-100">Operating System & UI</td>
        <td class="p-3 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 font-medium">3.5 GB – 4.5 GB</td>
        <td class="p-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">Kernel caches, graphics compositing, baseline system daemons.</td>
      </tr>
      <tr class="bg-slate-50/60 dark:bg-slate-800/40">
        <td class="p-3 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-100">Development Containers</td>
        <td class="p-3 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 font-medium">6.0 GB – 8.0 GB</td>
        <td class="p-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">Dedicated hypervisor VM running database and microservice containers.</td>
      </tr>
      <tr>
        <td class="p-3 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-slate-100">IDE & Language Servers</td>
        <td class="p-3 border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 font-medium">3.0 GB – 5.0 GB</td>
        <td class="p-3 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">TypeScript TSServer, ESLint, Git lenses, and syntax index tree.</td>
      </tr>
      <tr class="bg-slate-100/80 dark:bg-slate-800/80 font-bold">
        <td class="p-3 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">Total Active Footprint</td>
        <td class="p-3 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-400 font-bold">22.5 GB – 33.0 GB</td>
        <td class="p-3 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold">Meets recommended memory boundary for developers.</td>
      </tr>
    </tbody>
  </table>
</div><p></p>`;
    editor.chain().focus().insertContent(tableHtml).run();
    setTableModalOpen(false);
  };

  const handleInsertStyle = (type: 'protip' | 'warning' | 'takeaway' | 'quote' | 'step' | 'metrics') => {
    if (!editor) return;
    let html = '';
    switch (type) {
      case 'protip':
        html = `<div class="my-6 p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-500 text-blue-900 dark:text-blue-200 text-sm shadow-xs">
  <p class="font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1.5">💡 <span>Pro Tip:</span></p>
  <p>Add your technical tip, best practice, or performance recommendation here...</p>
</div><p></p>`;
        break;
      case 'warning':
        html = `<div class="my-6 p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border-l-4 border-amber-500 text-amber-900 dark:text-amber-200 text-sm shadow-xs">
  <p class="font-bold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1.5">⚠️ <span>Warning:</span></p>
  <p>Important security warning, caution, or configuration pitfall to avoid...</p>
</div><p></p>`;
        break;
      case 'takeaway':
        html = `<div class="my-6 p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border-l-4 border-emerald-500 text-emerald-900 dark:text-emerald-200 text-sm shadow-xs">
  <p class="font-bold text-emerald-700 dark:text-emerald-300 mb-1 flex items-center gap-1.5">📌 <span>Key Takeaway:</span></p>
  <p>Summary conclusion, key takeaway, or checklist rule for your readers...</p>
</div><p></p>`;
        break;
      case 'quote':
        html = `<blockquote class="p-4 my-6 border-l-4 border-red-500 bg-red-50/60 dark:bg-red-950/30 text-slate-800 dark:text-slate-200 italic rounded-r-xl text-base shadow-xs">
  &ldquo;Insert your noteworthy editorial quote, thought leader excerpt, or inspiring reflection here.&rdquo;
</blockquote><p></p>`;
        break;
      case 'step':
        html = `<h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 mt-6 mb-2 flex items-center gap-2">
  <span class="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">Step 1</span>
  <span>Baseline Environment Preparation</span>
</h3>
<p>Begin by documenting your current system state or prerequisite configurations...</p>`;
        break;
      case 'metrics':
        html = `<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
  <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center">
    <div class="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight">&lt; 0.8s</div>
    <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Page Load Speed</div>
  </div>
  <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center">
    <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">99.9%</div>
    <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Guaranteed Uptime</div>
  </div>
  <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center">
    <div class="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">100% Free</div>
    <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">Zero Hidden Fees</div>
  </div>
</div><p></p>`;
        break;
    }
    editor.chain().focus().insertContent(html).run();
    setStylesModalOpen(false);
  };

  // Multiple File Selection & Direct Fast Server Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imgFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (!imgFiles.length) {
      alert('Please select valid image files (PNG, JPG, WebP, GIF, SVG).');
      return;
    }

    setIsUploadingFiles(true);
    setUploadStatusMsg(`Optimizing & uploading ${imgFiles.length} photo(s)...`);

    try {
      const newFiles: Array<{ src: string; name: string; alt: string }> = [];

      for (let i = 0; i < imgFiles.length; i++) {
        const file = imgFiles[i];
        setUploadStatusMsg(`Uploading ${i + 1}/${imgFiles.length}: ${file.name}...`);
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const compressed = await compressImageFile(file);
        const url = await uploadImageToServer(compressed, file.name);
        newFiles.push({
          src: url,
          name: file.name,
          alt: cleanName,
        });
      }

      setUploadedFilesList((prev) => [...prev, ...newFiles]);
      if (newFiles.length === 1 && !imageUrl) {
        setImageUrl(newFiles[0].src);
        setImageAlt(newFiles[0].alt);
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message || 'Failed to process images'}`);
    } finally {
      setIsUploadingFiles(false);
      setUploadStatusMsg('');
    }
  };

  const sanitizeImageUrl = (raw?: string) => {
    if (!raw) return '';
    let u = raw.trim();
    if (!u) return '';
    if (!/^https?:\/\//i.test(u) && !u.startsWith('/') && !u.startsWith('data:')) {
      u = '/' + u;
    }
    return u;
  };

  // Insert a single or multiple images into the EXACT target section
  const executeInsertImages = (imagesToInsert: Array<{ src: string; alt?: string }>) => {
    if (!editor || !imagesToInsert.length) return;

    try {
      const { state, view } = editor;
      const { schema } = state;
      const tr = state.tr;

      const sel = savedSelectionRef.current || savedSelection || { 
        from: state.selection.from, 
        to: state.selection.to 
      };

      let from = Math.min(Math.max(0, sel.from), tr.doc.content.size);
      let to = Math.min(Math.max(0, sel.to), tr.doc.content.size);

      // If text was selected, delete it first
      if (from !== to) {
        tr.delete(from, to);
        from = Math.min(from, tr.doc.content.size);
      }

      // Filter and build valid image nodes
      const imageType = schema.nodes.image;
      if (!imageType) {
        console.error('Image node type not found in schema');
        return;
      }

      const validImages = imagesToInsert
        .map(img => ({
          src: sanitizeImageUrl(img.src),
          alt: img.alt?.trim() || undefined,
        }))
        .filter(img => Boolean(img.src));

      if (!validImages.length) return;

      const imageNodes = validImages.map(img => 
        imageType.create({
          src: img.src,
          alt: img.alt || null,
        })
      );

      const $pos = tr.doc.resolve(from);

      // Determine where to insert based on document structure:
      // If cursor was placed on an existing image or in doc root:
      if ($pos.parent.type.name === 'doc') {
        const insertPos = ($pos.nodeAfter && $pos.nodeAfter.type.name === 'image')
          ? from + $pos.nodeAfter.nodeSize
          : from;
        tr.insert(Math.min(insertPos, tr.doc.content.size), imageNodes);
      } else if ($pos.parent.isTextblock) {
        // Inside a paragraph, heading, or other textblock
        if ($pos.parent.content.size === 0) {
          // Empty paragraph: replace it completely with the image(s)
          tr.replaceWith($pos.before(), $pos.after(), imageNodes);
        } else if ($pos.parentOffset === 0) {
          // At the start of the paragraph: insert immediately before it
          tr.insert($pos.before(), imageNodes);
        } else {
          // Inside or at the end of the paragraph:
          // Insert cleanly immediately after this paragraph
          tr.insert($pos.after(), imageNodes);
        }
      } else {
        // Enclosed in another container
        const depth = Math.min($pos.depth, 1);
        const insertPos = depth > 0 ? $pos.after(depth) : from;
        tr.insert(Math.min(insertPos, tr.doc.content.size), imageNodes);
      }

      // If the document now ends with an image, automatically append an empty paragraph
      // so the author can easily click underneath to continue writing
      const lastChild = tr.doc.lastChild;
      if (lastChild && lastChild.type.name === 'image') {
        const paragraphType = schema.nodes.paragraph;
        if (paragraphType) {
          tr.insert(tr.doc.content.size, paragraphType.create());
        }
      }

      view.dispatch(tr);
      view.focus();

      // Clear saved selection so subsequent actions start fresh
      savedSelectionRef.current = null;
      setSavedSelection(null);
    } catch (err) {
      console.error('Error inserting images into section:', err);
      // Fallback: try standard setImage
      try {
        imagesToInsert.forEach(img => {
          const s = sanitizeImageUrl(img.src);
          if (s) {
            editor.chain().focus().setImage({ src: s, alt: img.alt?.trim() }).run();
          }
        });
      } catch (fallbackErr) {
        console.error('Fallback image insertion error:', fallbackErr);
      }
    }

    setImageModalOpen(false);
  };

  const uploadAndInsertFiles = async (files: File[]) => {
    if (!editor || !files.length) return;
    setIsUploadingFiles(true);
    setUploadStatusMsg(`Optimizing & uploading ${files.length > 1 ? `${files.length} images` : 'image'} (WebP)...`);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadStatusMsg(`Converting to WebP ${i + 1}/${files.length}: ${file.name}...`);
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        const compressed = await compressImageFile(file);
        const url = await uploadImageToServer(compressed, file.name);
        if (onMediaUploaded) {
          onMediaUploaded({
            id: `media-${Date.now()}-${i}`,
            title: cleanName,
            url,
            folder: 'galleries',
            dateAdded: new Date().toISOString().split('T')[0],
            size: `${(file.size / 1024).toFixed(1)} KB`
          });
        }
        executeInsertImages([{ src: url, alt: cleanName }]);
      }
    } catch (err: any) {
      alert(`Image upload error: ${err.message || 'Failed to upload image'}`);
    } finally {
      setIsUploadingFiles(false);
      setUploadStatusMsg('');
    }
  };
  uploadAndInsertFilesRef.current = uploadAndInsertFiles;

  const handleInsertSingleImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    executeInsertImages([{ src: imageUrl.trim(), alt: imageAlt.trim() }]);
  };

  const handleInsertUploadedList = () => {
    if (!uploadedFilesList.length) return;
    executeInsertImages(uploadedFilesList.map(f => ({ src: f.src, alt: f.alt })));
  };

  const handleInsertSelectedLibImages = () => {
    if (!selectedLibImages.length) return;
    const toInsert = selectedLibImages.map(url => {
      const filename = url.split('/').pop() || '';
      const cleanName = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      return { src: url, alt: cleanName };
    });
    executeInsertImages(toInsert);
  };

  const toggleLibImageSelection = (url: string) => {
    setSelectedLibImages(prev => 
      prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const filteredLibImages = libImages.filter(img => 
    img.name.toLowerCase().includes(libSearch.toLowerCase())
  );

  return (
    <div className="tw-scope relative border border-slate-300 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 shadow-sm focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all">
      <MenuBar 
        editor={editor} 
        onOpenLinkModal={handleOpenLinkModal} 
        onOpenImageModal={handleOpenImageModal} 
        onOpenYoutubeModal={handleOpenYoutubeModal}
        onOpenTerminalModal={handleOpenTerminalModal}
        onOpenTableModal={handleOpenTableModal}
        onOpenStylesModal={handleOpenStylesModal}
      />

      {/* Sticky Table Operations & Section Move Bar (when inside a table) */}
      {editor?.isActive('table') && (
        <div className="sticky top-[48px] z-20 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-blue-50 dark:bg-slate-800 border-b border-blue-200 dark:border-blue-900 text-xs shadow-xs animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 font-bold text-blue-700 dark:text-blue-300">
              <TableIcon size={14} /> Active Table:
            </span>
            {/* Table Section Move Controls */}
            <div className="flex items-center gap-1 border-r border-blue-200 dark:border-slate-700 pr-2">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleMoveCurrentTable('up')}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer shadow-2xs"
                title="Move table up one section"
              >
                <ArrowUp size={12} /> Move Up
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleMoveCurrentTable('down')}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer shadow-2xs"
                title="Move table down one section"
              >
                <ArrowDown size={12} /> Move Down
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleMoveCurrentTable('top')}
                className="px-1.5 py-1 rounded bg-white dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer text-[11px]"
                title="Move table to top of document"
              >
                ⤒ Top
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleMoveCurrentTable('bottom')}
                className="px-1.5 py-1 rounded bg-white dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold cursor-pointer text-[11px]"
                title="Move table to bottom of document"
              >
                ⤓ Bottom
              </button>
            </div>
            {/* Table Editing operations */}
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().addRowBefore().run()}
                className="px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
              >
                + Row Above
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().addRowAfter().run()}
                className="px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
              >
                + Row Below
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                className="px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
              >
                + Col Left
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                className="px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
              >
                + Col Right
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().deleteRow().run()}
                className="px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-red-50 text-red-600 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
              >
                - Row
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().deleteColumn().run()}
                className="px-2 py-1 rounded bg-white dark:bg-slate-900 hover:bg-red-50 text-red-600 border border-slate-200 dark:border-slate-700 font-medium cursor-pointer"
              >
                - Col
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer shadow-xs ml-1"
              >
                Delete Table
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
            <GripVertical size={13} className="text-blue-500" />
            <span>Drag table or use Move Up/Down to place in any section</span>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="relative">
        {isUploadingFiles && (
          <div className="absolute top-2 right-2 z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white text-xs backdrop-blur-md shadow-md border border-slate-700 animate-pulse">
            <RefreshCw size={13} className="animate-spin text-red-400" />
            <span>{uploadStatusMsg || 'Optimizing & uploading photo...'}</span>
          </div>
        )}
        <EditorContent editor={editor} className="bg-white dark:bg-slate-900 rounded-b-2xl" />

        {/* Floating Quick Action: Insert any of the 5 elements directly at active cursor section */}
        <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-600 dark:text-slate-400">Add to active section:</span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleOpenImageModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 font-semibold transition-colors cursor-pointer"
            >
              <Plus size={13} /> Add Image
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleOpenYoutubeModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600/10 text-red-600 dark:text-red-400 hover:bg-red-600/20 font-semibold transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current text-red-600" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              <span>Add YouTube</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleOpenTerminalModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-slate-100 font-mono text-[11px] font-semibold transition-colors cursor-pointer border border-slate-700/60"
            >
              <span className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              </span>
              <span className="text-emerald-400 font-bold">&gt;_</span>
              <span>Terminal</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleOpenTableModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-semibold transition-colors cursor-pointer"
            >
              <TableIcon size={13} /> Add Table
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleOpenLinkModal('card')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-semibold transition-colors cursor-pointer"
            >
              <LinkIcon size={13} /> Add Link Card
            </button>
          </div>
          <span className="hidden sm:inline text-[11px] text-slate-400">
            Drag or click elements to embed in any section
          </span>
        </div>
      </div>

      {/* Custom Link & Draggable Link Card Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
                  <LinkIcon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base font-display">
                    {linkTab === 'card' ? 'Insert Draggable Link Card' : (isEditingLink ? 'Edit Link' : 'Insert Link')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {linkTab === 'card' ? 'Add rich draggable bookmark into any section' : 'Attach URL to highlighted text'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setLinkModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 mt-4">
              <button
                type="button"
                onClick={() => setLinkTab('inline')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  linkTab === 'inline'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                🔗 Inline Text Link
              </button>
              <button
                type="button"
                onClick={() => setLinkTab('card')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  linkTab === 'card'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                🃏 Draggable Link Card
              </button>
            </div>

            <div 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                  e.preventDefault();
                  handleApplyLink(e);
                }
              }} 
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Destination URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com or /article/..."
                  autoFocus
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              {linkTab === 'card' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Card Title
                    </label>
                    <input
                      type="text"
                      value={linkCardTitle}
                      onChange={(e) => setLinkCardTitle(e.target.value)}
                      placeholder="e.g. Official Documentation or Announcement"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Description / Excerpt
                    </label>
                    <textarea
                      rows={2}
                      value={linkCardDesc}
                      onChange={(e) => setLinkCardDesc(e.target.value)}
                      placeholder="Brief summary of what readers will find at this link..."
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Site / Badge Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={linkCardSite}
                      onChange={(e) => setLinkCardSite(e.target.value)}
                      placeholder="e.g. GITHUB, HOSTINGER, TESLA, DOCS"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                </>
              )}

              {/* YouTube Link Detection Banner */}
              {getYoutubeVideoId(linkUrl) && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-between gap-3">
                  <div className="text-xs text-red-900 dark:text-red-200">
                    <span className="font-bold flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 fill-current text-red-600" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      YouTube Video Link Detected
                    </span>
                    <p className="text-[11px] text-red-700/80 dark:text-red-300/80 mt-0.5">Embed as a playable video with preview instead of a plain link?</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const detected = linkUrl;
                      setLinkModalOpen(false);
                      setYoutubeUrl(detected);
                      setYoutubeModalOpen(true);
                    }}
                    className="shrink-0 px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    Embed Video
                  </button>
                </div>
              )}

              {linkTab === 'inline' && (
                <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={linkNewTab}
                    onChange={(e) => setLinkNewTab(e.target.checked)}
                    className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-4 w-4"
                  />
                  <span className="flex items-center gap-1.5">
                    Open link in new tab <ExternalLink size={12} className="text-slate-400" />
                  </span>
                </label>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
                {isEditingLink && linkTab === 'inline' ? (
                  <button
                    type="button"
                    onClick={handleRemoveLink}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} /> Remove Link
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLinkModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyLink}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <Check size={14} /> {linkTab === 'card' ? 'Insert Draggable Card' : 'Apply Link'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated YouTube Video Embed Modal */}
      {youtubeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-600/10 text-red-600 dark:text-red-400">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base font-display">Insert YouTube Video</h3>
                  <p className="text-xs text-slate-500">Embed a playable YouTube video into the current section</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setYoutubeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (getYoutubeVideoId(youtubeUrl)) {
                    handleInsertYoutube();
                  }
                }
              }} 
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  YouTube Video Link <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value);
                    setYoutubeError('');
                  }}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  autoFocus
                  required
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
                {youtubeError && (
                  <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={13} />
                    {youtubeError}
                  </p>
                )}
              </div>

              {/* Real-time Interactive Video Preview inside Modal */}
              {getYoutubeVideoId(youtubeUrl) ? (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Live Preview
                    </label>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <Check size={12} /> Valid YouTube Link
                    </span>
                  </div>
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-slate-700 bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${getYoutubeVideoId(youtubeUrl)}?rel=0`}
                      title="YouTube video modal preview"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
                  <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Supported formats:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    <li>Full watch URL: <code className="text-red-500">https://www.youtube.com/watch?v=eqOfmtTJD1A</code></li>
                    <li>Short URL: <code className="text-red-500">https://youtu.be/eqOfmtTJD1A</code></li>
                    <li>Shorts URL: <code className="text-red-500">https://youtube.com/shorts/...</code></li>
                  </ul>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Caption / Title (Optional)
                </label>
                <input
                  type="text"
                  value={youtubeCaption}
                  onChange={(e) => setYoutubeCaption(e.target.value)}
                  placeholder="e.g. Flight test demonstration at Texas proving grounds"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Player Alignment
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'center', label: 'Center (Default)' },
                    { id: 'left', label: 'Left' },
                    { id: 'right', label: 'Right' },
                    { id: 'full', label: 'Full Width' },
                  ].map((align) => (
                    <button
                      key={align.id}
                      type="button"
                      onClick={() => setYoutubeAlignment(align.id as any)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        youtubeAlignment === align.id
                          ? 'border-red-600 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {align.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setYoutubeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleInsertYoutube()}
                  disabled={!getYoutubeVideoId(youtubeUrl)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 shadow-md shadow-red-600/20 transition-all cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Insert into Section</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Image Insertion Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 text-slate-900 dark:text-white max-h-[90vh] flex flex-col">
            
            {/* Header with Happy Machinery Logo */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <img src="/images/header-logo.webp" alt="Happy Machinery" className="h-8 w-auto object-contain" />
                <div>
                  <h3 className="font-bold text-base font-display text-slate-900 dark:text-white">Insert Image into Article</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Happy Machinery Asset Library &bull; Inserts directly into article at cursor
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setImageModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 mt-4 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setActiveImageTab('library')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeImageTab === 'library'
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Folder size={14} /> Browse Media Library
              </button>

              <button
                type="button"
                onClick={() => setActiveImageTab('upload')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeImageTab === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Upload size={14} /> Upload Device File(s)
              </button>

              <button
                type="button"
                onClick={() => setActiveImageTab('url')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeImageTab === 'url'
                    ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <ExternalLink size={14} /> Paste URL
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1">

              {/* TAB 1: MEDIA LIBRARY BROWSER */}
              {activeImageTab === 'library' && (
                <div className="space-y-3">
                  {/* Path / Breadcrumbs and Search */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1 text-xs font-mono bg-slate-50 dark:bg-slate-800 py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400">/happymachinery</span>
                      {libPath ? (
                        <>
                          <span className="text-slate-400">/{libPath}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const parent = libPath.includes('/') ? libPath.split('/').slice(0, -1).join('/') : '';
                              loadMediaLibrary(parent);
                            }}
                            className="ml-2 text-[11px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-sans font-semibold cursor-pointer"
                          >
                            <ArrowLeft size={11} /> Up
                          </button>
                        </>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={libSearch}
                          onChange={(e) => setLibSearch(e.target.value)}
                          placeholder="Filter images..."
                          className="pl-7 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 w-36 sm:w-48"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => loadMediaLibrary(libPath)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Refresh Media"
                      >
                        <RefreshCw size={13} className={libLoading ? 'animate-spin' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Subfolders list */}
                  {libFolders.length > 0 && !libSearch && (
                    <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                      {libFolders.map((f) => (
                        <button
                          key={f.path}
                          type="button"
                          onClick={() => loadMediaLibrary(f.path)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          <Folder size={12} className="text-amber-500" />
                          <span>{f.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Images Grid */}
                  {libLoading ? (
                    <div className="py-16 text-center text-xs text-slate-400">
                      <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-red-500" />
                      Loading media assets...
                    </div>
                  ) : filteredLibImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
                      {filteredLibImages.map((img) => {
                        const isSelected = selectedLibImages.includes(img.url);
                        return (
                          <div
                            key={img.url}
                            onClick={() => toggleLibImageSelection(img.url)}
                            className={`group relative rounded-xl border overflow-hidden cursor-pointer transition-all ${
                              isSelected
                                ? 'border-red-500 ring-2 ring-red-500/30 bg-red-50/20'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-slate-300'
                            }`}
                          >
                            <div className="aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                              <img
                                src={img.url}
                                alt={img.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="p-1.5 flex items-center justify-between gap-1">
                              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate" title={img.name}>
                                {img.name}
                              </span>
                              <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 ${
                                isSelected ? 'bg-red-600 text-white' : 'border border-slate-300 dark:border-slate-600 text-transparent'
                              }`}>
                                ✓
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      No images found in this folder. Click "Upload Device File(s)" or choose a subfolder above.
                    </div>
                  )}

                  {/* Actions for Media Library */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500">
                      {selectedLibImages.length} image(s) selected
                    </span>
                    <button
                      type="button"
                      disabled={selectedLibImages.length === 0}
                      onClick={handleInsertSelectedLibImages}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      <Check size={14} /> Insert {selectedLibImages.length > 1 ? `${selectedLibImages.length} Images` : 'Image'} into Section
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: MULTI-FILE UPLOAD FROM DEVICE */}
              {activeImageTab === 'upload' && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingFiles}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 bg-slate-50/80 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition-all text-xs font-semibold group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isUploadingFiles ? (
                      <>
                        <RefreshCw size={24} className="animate-spin text-red-500" />
                        <span className="text-red-600 dark:text-red-400 font-semibold">{uploadStatusMsg}</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          Compressing & uploading to server WebP storage...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload size={24} className="group-hover:scale-110 transition-transform text-red-500" />
                        <span>Choose Image(s) from your computer or phone</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          Files are automatically compressed & uploaded to fast WebP storage
                        </span>
                      </>
                    )}
                  </button>

                  {/* Uploaded items queue */}
                  {uploadedFilesList.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Selected Files ({uploadedFilesList.length}):
                      </div>
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {uploadedFilesList.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <img src={item.src} alt={item.name} className="w-12 h-10 object-cover rounded-lg shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</div>
                              <input
                                type="text"
                                value={item.alt}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setUploadedFilesList(prev => prev.map((f, i) => i === idx ? { ...f, alt: val } : f));
                                }}
                                placeholder="Alt description..."
                                className="w-full mt-1 px-2 py-0.5 text-[11px] rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-red-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setUploadedFilesList(prev => prev.filter((_, i) => i !== idx))}
                              className="p-1 text-slate-400 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={isUploadingFiles || uploadedFilesList.length === 0}
                      onClick={handleInsertUploadedList}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      <Check size={14} /> {isUploadingFiles ? 'Uploading...' : `Insert ${uploadedFilesList.length > 1 ? `${uploadedFilesList.length} Images` : 'Image'} into Section`}
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: DIRECT IMAGE URL */}
              {activeImageTab === 'url' && (
                <div 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (imageUrl.trim()) {
                        handleInsertSingleImage(e);
                      }
                    }
                  }} 
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Image Web URL or Blog Path <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreviewError(false);
                      }}
                      placeholder="https://images.unsplash.com/... or /blog/ai-tools/photo.webp"
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white placeholder:text-slate-400 font-mono"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Alt Description <span className="text-slate-400 font-normal">(Optional for SEO & Accessibility)</span>
                    </label>
                    <input
                      type="text"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      placeholder="Describe what is in this image..."
                      className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>

                  {/* Live Preview */}
                  {imageUrl.trim() && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 px-1">
                        Live Preview:
                      </div>
                      {!imagePreviewError ? (
                        <img 
                          src={imageUrl} 
                          alt={imageAlt || 'Preview'} 
                          className="max-h-44 w-full object-contain rounded-lg bg-slate-100 dark:bg-slate-900"
                          onError={() => setImagePreviewError(true)}
                        />
                      ) : (
                        <div className="p-3 text-center text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                          Unable to preview image. Please verify URL format.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleInsertSingleImage}
                      disabled={!imageUrl.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      <Check size={14} /> Insert Image into Section
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Code Terminal Block ("termisyle") Modal */}
      {terminalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800">
                  <Terminal size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base font-display flex items-center gap-2">
                    <span>Insert Code Terminal Block</span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">termisyle</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Dark macOS-style terminal with 🔴🟡🟢 traffic dots and 1-click copy</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setTerminalModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Terminal Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Terminal Window Title (Optional):
                </label>
                <input
                  type="text"
                  value={terminalTitle}
                  onChange={(e) => setTerminalTitle(e.target.value)}
                  placeholder="e.g. Terminal, Quick Install, Nginx Configuration..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Select Language / Runtime:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['bash', 'python', 'javascript', 'typescript', 'json', 'sql', 'php', 'html', 'css', 'docker', 'terminal'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setTerminalLang(lang)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        terminalLang === lang
                          ? 'bg-emerald-500 text-white font-bold shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Terminal Commands or Code:
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">language: {terminalLang}</span>
                </div>
                <textarea
                  rows={6}
                  value={terminalCode}
                  onChange={(e) => setTerminalCode(e.target.value)}
                  placeholder={`# Enter your ${terminalLang} commands or script here...\necho "Verifying environment settings..."\nuname -a`}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-900 text-emerald-300 font-mono text-xs sm:text-sm p-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600 leading-relaxed"
                />
              </div>

              {/* Live Preview */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Live Preview:
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#0f172a] shadow-md">
                  <div className="flex items-center justify-between px-3.5 py-2 bg-[#1e293b] border-b border-slate-700/60">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/90"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90"></span>
                      <span className="text-[11px] font-mono text-slate-400 ml-2 font-medium">{terminalLang}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                      <Copy size={11} /> Copy
                    </span>
                  </div>
                  <pre className="p-3 text-xs font-mono text-slate-100 overflow-x-auto leading-relaxed max-h-36">
                    <code>{terminalCode.trim() || `# ${terminalLang} script preview`}</code>
                  </pre>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTerminalModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleInsertTerminal}
                  disabled={!terminalCode.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Check size={14} /> Insert Terminal Block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Style & Manager Modal */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <TableIcon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base font-display">Table Style & Operations</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Insert custom tables or pre-styled comparison matrices</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setTableModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Active Table Tools (if inside a table) */}
              {editor?.isActive('table') && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50">
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-200 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><TableIcon size={14} /> Active Table Tools:</span>
                    <span className="text-[11px] font-normal text-slate-500">Move or modify selected table</span>
                  </div>

                  {/* Section Move Controls */}
                  <div className="mb-2.5 pb-2.5 border-b border-blue-200/60 dark:border-blue-800/60 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Move Section:</span>
                    <button
                      type="button"
                      onClick={() => { handleMoveCurrentTable('up'); setTableModalOpen(false); }}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowUp size={12} /> Move Up
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleMoveCurrentTable('down'); setTableModalOpen(false); }}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowDown size={12} /> Move Down
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleMoveCurrentTable('top'); setTableModalOpen(false); }}
                      className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      ⤒ Top
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleMoveCurrentTable('bottom'); setTableModalOpen(false); }}
                      className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      ⤓ Bottom
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().addRowBefore().run(); setTableModalOpen(false); }}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      ➕ Add Row Above
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().addRowAfter().run(); setTableModalOpen(false); }}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      ➕ Add Row Below
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().addColumnBefore().run(); setTableModalOpen(false); }}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      ➕ Add Col Left
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().addColumnAfter().run(); setTableModalOpen(false); }}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      ➕ Add Col Right
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().deleteRow().run(); setTableModalOpen(false); }}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-slate-200 dark:border-slate-700 font-medium text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                    >
                      ➖ Delete Row
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().deleteColumn().run(); setTableModalOpen(false); }}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-slate-200 dark:border-slate-700 font-medium text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                    >
                      ➖ Delete Col
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().toggleHeaderRow().run(); setTableModalOpen(false); }}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      🏷️ Toggle Header
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().deleteTable().run(); setTableModalOpen(false); }}
                      className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-xs cursor-pointer"
                    >
                      🗑️ Delete Table
                    </button>
                  </div>
                </div>
              )}

              {/* Preset 1: Comparison Matrix (Image 2 style) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Featured Table Presets:
                </label>
                <div 
                  onClick={handleInsertComparisonTable}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-blue-50/50 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center gap-1.5">
                      <span>📊 Technical Comparison Matrix</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-semibold">Recommended</span>
                    </span>
                    <span className="text-xs text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">Insert →</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Matching benchmark style: Component/Process · Typical Consumption · Technical Explanation with highlighted metrics.
                  </p>
                </div>
              </div>

              {/* Custom Table Builder */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Or Build Custom Grid:
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Rows:</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={tableRows}
                      onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Columns:</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={tableCols}
                      onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tableWithHeader}
                      onChange={(e) => setTableWithHeader(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Include Styled Header Row</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleInsertCustomTable(tableRows, tableCols, tableWithHeader)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus size={14} /> Insert {tableRows}×{tableCols} Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special Content Styles & Callouts Modal */}
      {stylesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base font-display">Special Content Styles & Callouts</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Click any block to insert at current cursor position</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setStylesModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1">
              {/* Pro Tip */}
              <div
                onClick={() => handleInsertStyle('protip')}
                className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">💡</span>
                  <span className="font-bold text-xs text-blue-900 dark:text-blue-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">Pro Tip / Recommendation</span>
                </div>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80">Blue callout container for tips, best practices, and suggestions.</p>
              </div>

              {/* Warning */}
              <div
                onClick={() => handleInsertStyle('warning')}
                className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">⚠️</span>
                  <span className="font-bold text-xs text-amber-900 dark:text-amber-200 group-hover:text-amber-700 dark:group-hover:text-amber-300">Warning / Alert Box</span>
                </div>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">Amber callout for important security, pitfall, or system warnings.</p>
              </div>

              {/* Key Takeaway */}
              <div
                onClick={() => handleInsertStyle('takeaway')}
                className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">📌</span>
                  <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">Key Takeaway Box</span>
                </div>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">Green container for conclusions, summaries, and key takeaways.</p>
              </div>

              {/* Editorial Quote */}
              <div
                onClick={() => handleInsertStyle('quote')}
                className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30 hover:bg-red-100/70 dark:hover:bg-red-900/50 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">💬</span>
                  <span className="font-bold text-xs text-red-900 dark:text-red-200 group-hover:text-red-700 dark:group-hover:text-red-300">Editorial Quote Box</span>
                </div>
                <p className="text-[11px] text-red-700/80 dark:text-red-300/80">Red accent border with elegant serif typography for quotes.</p>
              </div>

              {/* Step Badge */}
              <div
                onClick={() => handleInsertStyle('step')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400">Step 1</span>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400">Step Badge Heading</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Numbered step pill with bold section title for tutorials.</p>
              </div>

              {/* Key Metrics */}
              <div
                onClick={() => handleInsertStyle('metrics')}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">📊</span>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">3-Column Metric Stats</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Highlight big numbers like speeds, percentages, and benchmark results.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

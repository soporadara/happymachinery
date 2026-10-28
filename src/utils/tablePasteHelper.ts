/**
 * Happy Machinery — Smart Table Paste & Normalization Helper
 * Accurately detects and converts tables copied from:
 * 1. Google Docs (HTML with <table> or wrapped in docs-internal-guid)
 * 2. Google Sheets / Excel / TSV (Tab-separated values)
 * 3. Markdown tables (| Col 1 | Col 2 |)
 * 4. Web page tables (HTML <table>)
 */

export interface DetectedTableResult {
  detected: boolean;
  html: string;
  rowCount: number;
  colCount: number;
  sourceType: 'google-docs-html' | 'html-table' | 'tsv' | 'markdown';
}

/**
 * Checks if a string contains Markdown inline formatting and renders to HTML
 */
function renderInlineFormatting(text: string): string {
  if (!text) return '';
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

/**
 * Check if the text contains a Tab-Separated Values (TSV) table
 * E.g., copied from Google Sheets, Excel, or Google Docs
 */
export function isTsvTable(text: string): boolean {
  if (!text || !text.includes('\t')) return false;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  
  const tabLines = lines.filter((l) => l.includes('\t'));
  // At least 2 lines must contain tabs, and at least half the non-empty lines must have tabs
  if (tabLines.length < 2 || (tabLines.length / lines.length) < 0.5) return false;

  // Verify column counts are roughly consistent (at least 2 columns)
  const colCounts = tabLines.map((l) => l.split('\t').length);
  return colCounts.every((count) => count >= 2);
}

/**
 * Convert TSV text to clean semantic HTML table for Tiptap
 */
export function convertTsvToTableHtml(tsv: string): DetectedTableResult | null {
  if (!tsv) return null;
  const lines = tsv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const rows = lines.map((l) => l.split('\t').map((c) => c.trim()));
  const maxCols = Math.max(...rows.map((r) => r.length));
  if (maxCols < 2) return null;

  const headerRow = rows[0];
  const bodyRows = rows.slice(1);

  const thHtml = headerRow
    .map((cell) => {
      const clean = cell || '&nbsp;';
      const formatted = renderInlineFormatting(clean);
      return `<th class="editor-th p-3 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-left font-bold text-slate-900 dark:text-slate-100"><p><strong>${formatted}</strong></p></th>`;
    })
    .join('');

  const trsHtml = bodyRows
    .map((row) => {
      // Pad row to maxCols if necessary
      const padded = [...row];
      while (padded.length < maxCols) padded.push('');

      const cellsHtml = padded
        .map((cell, colIdx) => {
          const clean = cell || '&nbsp;';
          // In spec comparison tables, Column 0 is usually a specification label (like Image 2)
          const isRowLabel = colIdx === 0 && !clean.includes('<strong') && !clean.startsWith('**');
          const formatted = renderInlineFormatting(clean);
          const inner = isRowLabel ? `<strong>${formatted}</strong>` : formatted;
          return `<td class="editor-td p-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"><p>${inner}</p></td>`;
        })
        .join('');
      return `<tr>${cellsHtml}</tr>`;
    })
    .join('');

  const tableHtml = `<table class="editor-table w-full border-collapse border border-slate-300 dark:border-slate-700 my-6 rounded-xl overflow-hidden text-sm"><thead><tr>${thHtml}</tr></thead><tbody>${trsHtml}</tbody></table>`;

  return {
    detected: true,
    html: tableHtml,
    rowCount: rows.length,
    colCount: maxCols,
    sourceType: 'tsv',
  };
}

/**
 * Check if text contains a Markdown table (| Col 1 | Col 2 |)
 */
export function isMarkdownTable(text: string): boolean {
  if (!text || !text.includes('|')) return false;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return false;
  const pipeLines = lines.filter((l) => l.startsWith('|') || (l.includes('|') && l.endsWith('|')));
  return pipeLines.length >= 2;
}

/**
 * Convert Markdown table text to clean semantic HTML table for Tiptap
 */
export function convertMarkdownTableToHtml(md: string): DetectedTableResult | null {
  if (!md) return null;
  const lines = md.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const tableLines = lines.filter((l) => l.includes('|'));
  if (tableLines.length < 2) return null;

  const parseRow = (line: string) =>
    line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

  const isSeparator = (line: string) => /^[:\s|—-]+$/.test(line);

  let headerRow: string[] = [];
  let bodyRows: string[][] = [];

  if (tableLines.length >= 2 && isSeparator(tableLines[1])) {
    headerRow = parseRow(tableLines[0]);
    bodyRows = tableLines.slice(2).map(parseRow);
  } else {
    headerRow = parseRow(tableLines[0]);
    bodyRows = tableLines.slice(1).map(parseRow);
  }

  const maxCols = Math.max(headerRow.length, ...bodyRows.map((r) => r.length));
  if (maxCols < 2) return null;

  const thHtml = headerRow
    .map((cell) => {
      const clean = cell || '&nbsp;';
      const formatted = renderInlineFormatting(clean);
      return `<th class="editor-th p-3 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-left font-bold text-slate-900 dark:text-slate-100"><p><strong>${formatted}</strong></p></th>`;
    })
    .join('');

  const trsHtml = bodyRows
    .map((row) => {
      const padded = [...row];
      while (padded.length < maxCols) padded.push('');

      const cellsHtml = padded
        .map((cell, colIdx) => {
          const clean = cell || '&nbsp;';
          const isRowLabel = colIdx === 0 && !clean.includes('<strong') && !clean.startsWith('**');
          const formatted = renderInlineFormatting(clean);
          const inner = isRowLabel ? `<strong>${formatted}</strong>` : formatted;
          return `<td class="editor-td p-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"><p>${inner}</p></td>`;
        })
        .join('');
      return `<tr>${cellsHtml}</tr>`;
    })
    .join('');

  const tableHtml = `<table class="editor-table w-full border-collapse border border-slate-300 dark:border-slate-700 my-6 rounded-xl overflow-hidden text-sm"><thead><tr>${thHtml}</tr></thead><tbody>${trsHtml}</tbody></table>`;

  return {
    detected: true,
    html: tableHtml,
    rowCount: 1 + bodyRows.length,
    colCount: maxCols,
    sourceType: 'markdown',
  };
}

/**
 * Extracts and cleans HTML tables (from Google Docs, Word, or Web).
 * Strips Google Docs style bloat, converts first row <td> to <th> if needed,
 * wraps cell contents in <p>, and applies modern editor classes.
 */
export function cleanHtmlTable(html: string): DetectedTableResult | null {
  if (!html || !/<table[\s>]/i.test(html)) return null;

  // Use DOMParser when available in browser, or fallback regex
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const tables = Array.from(doc.querySelectorAll('table'));
      if (tables.length === 0) return null;

      let totalRows = 0;
      let maxCols = 0;

      tables.forEach((table) => {
        table.className = 'editor-table w-full border-collapse border border-slate-300 dark:border-slate-700 my-6 rounded-xl overflow-hidden text-sm';
        table.removeAttribute('style');
        table.removeAttribute('width');
        table.removeAttribute('height');
        table.removeAttribute('border');
        table.removeAttribute('cellspacing');
        table.removeAttribute('cellpadding');

        // Remove colgroups (they contain hardcoded pixel widths from Google Docs)
        table.querySelectorAll('colgroup, col').forEach((el) => el.remove());

        const rows = Array.from(table.querySelectorAll('tr'));
        totalRows += rows.length;

        // Check if there are any explicit <th> in the table
        const hasTh = table.querySelector('th') !== null;

        // If no <th> present (very common in Google Docs tables), convert row 0 cells to <th>
        if (!hasTh && rows.length > 0) {
          const firstRow = rows[0];
          const cells = Array.from(firstRow.children);
          cells.forEach((cell) => {
            const th = doc.createElement('th');
            th.className = 'editor-th p-3 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-left font-bold text-slate-900 dark:text-slate-100';
            th.innerHTML = cell.innerHTML;
            cell.replaceWith(th);
          });
        }

        // Clean every cell in table
        rows.forEach((row) => {
          const cells = Array.from(row.querySelectorAll('th, td'));
          maxCols = Math.max(maxCols, cells.length);

          cells.forEach((cell, colIdx) => {
            const isHeader = cell.tagName.toLowerCase() === 'th';
            cell.className = isHeader
              ? 'editor-th p-3 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-left font-bold text-slate-900 dark:text-slate-100'
              : 'editor-td p-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';

            // Check if cell was bolded in Google Docs
            const hadBold =
              cell.querySelector('b, strong') !== null ||
              /font-weight\s*:\s*(?:700|bold)/i.test(cell.getAttribute('style') || '') ||
              Array.from(cell.querySelectorAll('span')).some((s) => /font-weight\s*:\s*(?:700|bold)/i.test(s.getAttribute('style') || ''));

            cell.removeAttribute('style');
            cell.removeAttribute('width');
            cell.removeAttribute('height');

            // Strip style attributes from inner spans/p tags
            cell.querySelectorAll('*').forEach((child) => {
              if (child.tagName !== 'A') {
                child.removeAttribute('style');
              }
              child.removeAttribute('dir');
            });

            // Extract inner HTML or text
            let innerHtml = cell.innerHTML.trim();
            // Remove empty spans or paragraphs
            innerHtml = innerHtml.replace(/<span[^>]*>(.*?)<\/span>/gi, '$1');
            
            // Clean up wrapping paragraph if present
            const pMatch = innerHtml.match(/^<p[^>]*>(.*?)<\/p>$/i);
            const content = pMatch ? pMatch[1].trim() : innerHtml;

            // Make sure column 0 in body rows is bold if it was bold in Google Docs or is a label
            let finalContent = content || '&nbsp;';
            if ((hadBold || isHeader || colIdx === 0) && !finalContent.includes('<strong') && !finalContent.includes('<b')) {
              finalContent = `<strong>${finalContent}</strong>`;
            }

            cell.innerHTML = `<p>${finalContent}</p>`;
          });
        });

        // Ensure <thead> exists for headers
        const headerRows = rows.filter((r) => r.querySelector('th') !== null);
        const dataRows = rows.filter((r) => r.querySelector('th') === null);

        if (headerRows.length > 0 && !table.querySelector('thead')) {
          const thead = doc.createElement('thead');
          headerRows.forEach((r) => thead.appendChild(r));
          table.prepend(thead);
        }

        if (dataRows.length > 0 && !table.querySelector('tbody')) {
          const tbody = doc.createElement('tbody');
          dataRows.forEach((r) => tbody.appendChild(r));
          table.appendChild(tbody);
        }
      });

      // If the clipboard contained only table(s) or Google Docs guid container
      const cleanedHtml = tables.map((t) => t.outerHTML).join('\n\n');
      return {
        detected: true,
        html: cleanedHtml,
        rowCount: totalRows,
        colCount: maxCols,
        sourceType: html.includes('docs-internal-guid') ? 'google-docs-html' : 'html-table',
      };
    } catch {
      // Fall through to regex
    }
  }

  // Fallback regex cleaner for non-browser/test environments
  try {
    const tableRegex = /<table[\s\S]*?<\/table>/gi;
    const match = html.match(tableRegex);
    if (!match) return null;

    const cleanedTables = match.map((tbl) => {
      let t = tbl
        .replace(/<table[^>]*>/i, '<table class="editor-table w-full border-collapse border border-slate-300 dark:border-slate-700 my-6 rounded-xl overflow-hidden text-sm">')
        .replace(/<colgroup[\s\S]*?<\/colgroup>/gi, '')
        .replace(/style="[^"]*"/gi, '')
        .replace(/dir="[^"]*"/gi, '')
        .replace(/width="[^"]*"/gi, '')
        .replace(/height="[^"]*"/gi, '');

      // If no <th> in first row, convert first <tr>'s <td> to <th>
      if (!/<th[\s>]/i.test(t)) {
        t = t.replace(/<tr[^>]*>([\s\S]*?)<\/tr>/i, (_m, firstRowInner) => {
          const ths = firstRowInner.replace(/<td[^>]*>([\s\S]*?)<\/td>/gi, '<th class="editor-th p-3 border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-left font-bold text-slate-900 dark:text-slate-100"><p><strong>$1</strong></p></th>');
          return `<thead><tr>${ths}</tr></thead>`;
        });
      }

      return t;
    });

    return {
      detected: true,
      html: cleanedTables.join('\n\n'),
      rowCount: (html.match(/<tr[\s>]/gi) || []).length,
      colCount: 3,
      sourceType: 'html-table',
    };
  } catch {
    return null;
  }
}

/**
 * Master Table Detection & Conversion:
 * Checks HTML data first (for Google Docs / Web tables), then TSV, then Markdown.
 * Returns clean HTML table or null if no table detected.
 */
export function detectAndConvertTable(htmlData: string, textData: string): DetectedTableResult | null {
  const raw = textData || htmlData || '';
  // If the content is an entire blog article with miniexcavator links or headings + images,
  // do not intercept as standalone table: let processPastedBlog handle the entire article!
  if (/img\.miniexcavator\.org/i.test(raw) || (/^(?:#+\s|<h[1-3]|title:)/im.test(raw) && /\.(webp|png|jpe?g|gif|svg)/i.test(raw))) {
    return null;
  }

  // 1. Check HTML data for Google Docs / Web <table>
  if (htmlData && /<table[\s>]/i.test(htmlData)) {
    const textOutside = htmlData.replace(/<table[\s\S]*?<\/table>/gi, '').replace(/<[^>]+>/g, '').trim();
    if (textOutside.length <= 150) {
      const res = cleanHtmlTable(htmlData);
      if (res && res.detected) return res;
    }
  }

  // 2. Check textData for Tab-Separated Values (TSV) from Google Sheets / Excel / Google Docs plain copy
  if (textData && isTsvTable(textData)) {
    const res = convertTsvToTableHtml(textData);
    if (res && res.detected) return res;
  }

  // 3. Check textData for Markdown Table
  if (textData && isMarkdownTable(textData)) {
    const res = convertMarkdownTableToHtml(textData);
    if (res && res.detected) return res;
  }

  return null;
}

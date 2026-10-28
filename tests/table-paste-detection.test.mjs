import test from 'node:test';
import assert from 'node:assert';
import {
  isTsvTable,
  convertTsvToTableHtml,
  isMarkdownTable,
  convertMarkdownTableToHtml,
  cleanHtmlTable,
  detectAndConvertTable
} from '../src/utils/tablePasteHelper.ts';
import { isStandaloneHeading, convertContentToHtml } from '../src/utils/editorContentHelper.ts';
import { processPastedBlog } from '../src/utils/blogImportHelper.ts';

test('1. TSV table copied from Google Sheets or plain-text is accurately detected and converted', () => {
  const tsvSample = `Specification\tTYPHON KUVUO 4.0 (TYPH-KUVUO)\tTYPHON KUVUO 2.7 KONSTRUCTZ (TYPH-KUVUO27)
Operating Class\t4-Ton (~8,800 lbs)\t2.7-Ton (5,300 lbs)
Engine\tEPA-certified Kubota D1703 Diesel\tKubota D1105 3-Cylinder Direct-Injection Diesel
Horsepower\t25 HP @ 2,200 RPM\t19 HP @ 2,200 RPM / up to 25 HP @ 3,000 RPM
Max Digging Depth\t3,106 mm (approx. 10.2 ft)\t7.8 ft
Hydraulic System\tLoad-sensing variable-displacement piston pump\tAxial piston variable pump`;

  assert.strictEqual(isTsvTable(tsvSample), true);

  const res = convertTsvToTableHtml(tsvSample);
  assert.ok(res !== null);
  assert.strictEqual(res.detected, true);
  assert.strictEqual(res.rowCount, 6);
  assert.strictEqual(res.colCount, 3);
  assert.ok(res.html.includes('<table class="editor-table'));
  assert.ok(res.html.includes('<th class="editor-th'));
  assert.ok(res.html.includes('Specification'));
  assert.ok(res.html.includes('TYPHON KUVUO 4.0 (TYPH-KUVUO)'));
  assert.ok(res.html.includes('<td class="editor-td'));
  assert.ok(res.html.includes('Operating Class'));
  assert.ok(res.html.includes('Kubota D1703 Diesel'));
});

test('2. Markdown table is accurately detected and converted into semantic HTML table', () => {
  const mdSample = `| Specification | TYPHON KUVUO 4.0 | TYPHON KUVUO 2.7 |
|---|---|---|
| Operating Class | 4-Ton (~8,800 lbs) | 2.7-Ton (5,300 lbs) |
| Engine | Kubota D1703 Diesel | Kubota D1105 Diesel |`;

  assert.strictEqual(isMarkdownTable(mdSample), true);

  const res = convertMarkdownTableToHtml(mdSample);
  assert.ok(res !== null);
  assert.strictEqual(res.detected, true);
  assert.strictEqual(res.rowCount, 3);
  assert.strictEqual(res.colCount, 3);
  assert.ok(res.html.includes('<table class="editor-table'));
  assert.ok(res.html.includes('<th><p><strong>Specification</strong></p></th>') || res.html.includes('Specification'));
  assert.ok(res.html.includes('Operating Class'));
});

test('3. Google Docs HTML table is cleaned, header row normalized to <th>, and styles stripped', () => {
  const gDocsHtml = `<meta charset='utf-8'><b style="font-weight:normal;" id="docs-internal-guid-9b9322da-7fff-0082-9382-748937219832">
  <table style="border-collapse:collapse;margin-left:auto;margin-right:auto;width:100%;">
    <colgroup><col width="200"><col width="250"><col width="250"></colgroup>
    <tbody>
      <tr style="height:36pt;">
        <td style="border:1pt solid #000000;padding:5pt;"><p dir="ltr"><span style="font-size:11pt;font-family:Arial;font-weight:700;">Specification</span></p></td>
        <td style="border:1pt solid #000000;padding:5pt;"><p dir="ltr"><span style="font-size:11pt;font-family:Arial;font-weight:700;">TYPHON KUVUO 4.0</span></p></td>
        <td style="border:1pt solid #000000;padding:5pt;"><p dir="ltr"><span style="font-size:11pt;font-family:Arial;font-weight:700;">TYPHON KUVUO 2.7</span></p></td>
      </tr>
      <tr style="height:36pt;">
        <td style="border:1pt solid #000000;padding:5pt;"><p dir="ltr"><span style="font-size:11pt;font-family:Arial;font-weight:700;">Operating Class</span></p></td>
        <td style="border:1pt solid #000000;padding:5pt;"><p dir="ltr"><span style="font-size:11pt;font-family:Arial;">4-Ton (~8,800 lbs)</span></p></td>
        <td style="border:1pt solid #000000;padding:5pt;"><p dir="ltr"><span style="font-size:11pt;font-family:Arial;">2.7-Ton (5,300 lbs)</span></p></td>
      </tr>
    </tbody>
  </table>
</b>`;

  const res = cleanHtmlTable(gDocsHtml);
  assert.ok(res !== null);
  assert.strictEqual(res.detected, true);
  assert.ok(res.html.includes('<table class="editor-table'));
  assert.ok(res.html.includes('<th class="editor-th'));
  assert.ok(res.html.includes('Specification'));
  assert.ok(res.html.includes('Operating Class'));
  assert.ok(!res.html.includes('docs-internal-guid'), 'Must strip docs-internal-guid');
  assert.ok(!res.html.includes('width="200"'), 'Must strip colgroup pixel widths');
});

test('4. detectAndConvertTable prioritizes HTML over text and accurately detects all formats', () => {
  const gDocsHtml = `<table><tr><td>Header 1</td><td>Header 2</td></tr><tr><td>Val 1</td><td>Val 2</td></tr></table>`;
  const tsvText = `Header 1\tHeader 2\nVal 1\tVal 2`;
  const mdText = `| Header 1 | Header 2 |\n|---|---|\n| Val 1 | Val 2 |`;

  const htmlRes = detectAndConvertTable(gDocsHtml, tsvText);
  assert.ok(htmlRes !== null);
  assert.strictEqual(htmlRes.detected, true);

  const tsvRes = detectAndConvertTable('', tsvText);
  assert.ok(tsvRes !== null);
  assert.strictEqual(tsvRes.detected, true);
  assert.strictEqual(tsvRes.sourceType, 'tsv');

  const mdRes = detectAndConvertTable('', mdText);
  assert.ok(mdRes !== null);
  assert.strictEqual(mdRes.detected, true);
  assert.strictEqual(mdRes.sourceType, 'markdown');

  // Plain non-table text should NOT be detected as table
  const plainText = `Drum Surface and Drum Edges\nThe drum is the working heart of a road roller...`;
  assert.strictEqual(detectAndConvertTable('', plainText), null);
});

test('5. isStandaloneHeading never falsely flags TSV table rows or table elements as headings', () => {
  // Table rows with tabs MUST return false
  assert.strictEqual(isStandaloneHeading('Specification\tTYPHON KUVUO 4.0\tTYPHON KUVUO 2.7'), false);
  assert.strictEqual(isStandaloneHeading('Travel Speed\t2-speed: 1.4–2.7 mph'), false);
  assert.strictEqual(isStandaloneHeading('Cab Type\tEnclosed AC/Heater cabin'), false);
  assert.strictEqual(isStandaloneHeading('Boom Swing\tIndependent boom swing'), false);

  // Markdown and HTML table lines must return false
  assert.strictEqual(isStandaloneHeading('| Specification | TYPHON KUVUO 4.0 |'), false);
  assert.strictEqual(isStandaloneHeading('<table>'), false);
  assert.strictEqual(isStandaloneHeading('<tr><td>Specification</td></tr>'), false);

  // Real headings still return true
  assert.strictEqual(isStandaloneHeading('Drum Surface and Drum Edges'), true);
  assert.strictEqual(isStandaloneHeading('Vibration System Components'), true);
});

test('6. convertContentToHtml converts TSV table and Markdown table into HTML tables', () => {
  const tsvSample = `Travel Speed\t2-speed: 1.4-2.7 mph\nCab Type\tEnclosed AC/Heater cabin`;
  const converted = convertContentToHtml(tsvSample);
  assert.ok(converted.includes('<table class="editor-table'), 'convertContentToHtml must render table');
  assert.ok(!converted.includes('<h2>Travel Speed</h2>'), 'Table row must NOT be turned into <h2>');
});

test('7. processPastedBlog detects full blog with title, cover image, body gallery images, AND embedded TSV table', () => {
  const fullBlogWithTable = `# Mini Excavator Comparison 2026

https://img.miniexcavator.org/hero-excavator.webp
TYPHON KUVUO 4.0 operating at industrial job site

Choosing the right mini excavator requires careful examination of operating class, engine horsepower, and hydraulic capacities.

Specification\tTYPHON KUVUO 4.0\tTYPHON KUVUO 2.7 KONSTRUCTZ
Operating Class\t4-Ton (~8,800 lbs)\t2.7-Ton (5,300 lbs)
Engine\tKubota D1703 Diesel\tKubota D1105 Diesel
Horsepower\t25 HP @ 2,200 RPM\t19 HP @ 2,200 RPM
Travel Speed\t2-speed: 1.4-2.7 mph\tSingle speed: 1.8 mph
Cab Type\tEnclosed AC/Heater cabin\tOpen Canopy
Boom Swing\tIndependent boom swing\tFixed boom swing

https://img.miniexcavator.org/kuvuo-action.webp
TYPHON KUVUO in trenching operation with hydraulic thumb

Both models offer exceptional durability and standard auxiliary hydraulics for versatile attachments.`;

  const res = processPastedBlog(fullBlogWithTable);

  assert.strictEqual(res.detected, true, 'Blog must be detected');
  assert.strictEqual(res.isFullBlogImport, true, 'Must be flagged as full blog import');
  assert.strictEqual(res.title, 'Mini Excavator Comparison 2026', 'Article title must be extracted');
  assert.ok(res.coverImage, 'Cover image must be extracted');
  assert.strictEqual(res.coverImage.url, 'https://img.miniexcavator.org/hero-excavator.webp');
  assert.strictEqual(res.allImages.length, 2, 'Must detect both images for media library gallery');

  // Verify table is inside cleanedHtml
  assert.ok(res.cleanedHtml.includes('<table class="editor-table'), 'Cleaned HTML must contain table');
  assert.ok(res.cleanedHtml.includes('<th class="editor-th'), 'Table must have <th> headers');
  assert.ok(res.cleanedHtml.includes('TYPHON KUVUO 4.0'), 'Table must contain cell data');
  assert.ok(res.cleanedHtml.includes('Kubota D1703 Diesel'), 'Table must contain engine data');

  // Table rows must NOT be converted to <h2>
  assert.ok(!res.cleanedHtml.includes('<h2>Travel Speed</h2>'), 'Travel Speed must be table cell, not <h2>');
  assert.ok(!res.cleanedHtml.includes('<h2>Cab Type</h2>'), 'Cab Type must be table cell, not <h2>');
  assert.ok(!res.cleanedHtml.includes('<h2>Boom Swing</h2>'), 'Boom Swing must be table cell, not <h2>');

  // Second image must be rendered in cleanedHtml
  assert.ok(res.cleanedHtml.includes('kuvuo-action.webp'), 'Second image must be in body HTML');
  assert.ok(res.cleanedHtml.includes('trenching operation with hydraulic thumb'), 'Caption must be retained');
});

test('8. detectAndConvertTable yields to full blog import when blog indicators exist', () => {
  const fullBlogWithTable = `# Mini Excavator Comparison 2026\nhttps://img.miniexcavator.org/hero.webp\nCol A\tCol B\nVal A\tVal B`;
  const result = detectAndConvertTable('', fullBlogWithTable);
  assert.strictEqual(result, null, 'detectAndConvertTable must not hijack full blog import');
});

test('9. processPastedBlog detects full blog with HTML table and images', () => {
  const fullBlogWithHtmlTable = `<h1>Compact Machinery Buyer Guide</h1>
<p><img src="https://img.miniexcavator.org/compact-guide.webp" alt="Compact guide cover" /></p>
<p>Modern mini excavators are indispensable across construction sites.</p>
<table>
  <tr><td>Model</td><td>Weight</td><td>Horsepower</td></tr>
  <tr><td>TYPHON T18</td><td>1.8 Ton</td><td>14 HP</td></tr>
  <tr><td>TYPHON V900</td><td>1.0 Ton</td><td>13.5 HP</td></tr>
</table>
<p><img src="https://img.miniexcavator.org/t18-work.webp" alt="TYPHON T18 working" /></p>
<p>Summary of best practices.</p>`;

  const res = processPastedBlog(fullBlogWithHtmlTable);
  assert.strictEqual(res.detected, true, 'HTML blog must be detected');
  assert.strictEqual(res.title, 'Compact Machinery Buyer Guide', 'Title must be extracted');
  assert.ok(res.coverImage, 'Cover image must be extracted');
  assert.strictEqual(res.coverImage.url, 'https://img.miniexcavator.org/compact-guide.webp');
  assert.strictEqual(res.allImages.length, 2, 'All images must be detected');
  assert.ok(res.cleanedHtml.includes('<table class="editor-table'), 'Table must be in cleaned HTML');
  assert.ok(res.cleanedHtml.includes('TYPHON T18'), 'Table content must be preserved');
  assert.ok(res.cleanedHtml.includes('t18-work.webp'), 'Body image must be preserved');
});

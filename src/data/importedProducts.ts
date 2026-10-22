import productCsv from './Website_Menu_Structure.csv?raw'
import type { AdminProduct } from '../pages/adminData'

type CsvRow = Record<string, string>

const parseCsv = (source: string): CsvRow[] => {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]
    const nextCharacter = source[index + 1]

    if (character === '"') {
      if (quoted && nextCharacter === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && nextCharacter === '\n') index += 1
      row.push(field)
      if (row.some(Boolean)) rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }

  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  const [headers, ...values] = rows
  return values.map((columns) =>
    Object.fromEntries(headers.map((header, index) => [header.replace(/^\uFEFF/, ''), columns[index] ?? '']))
  )
}

const plainText = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const numberValue = (value: string) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const csvRows = parseCsv(productCsv)

export const IMPORTED_CATEGORY_PATHS = Array.from(
  new Set(
    csvRows.flatMap((row) => {
      const levels = row.Categories.split('>').map((level) => level.trim()).filter(Boolean)
      return levels.map((_, index) => levels.slice(0, index + 1).join(' > '))
    })
  )
)

export const IMPORTED_PRODUCTS: AdminProduct[] = csvRows.map((row, index) => {
  const images = row.Images.split(',').map((image) => image.trim()).filter(Boolean)
  const specifications = [
    [row['Attribute 1 name'], row['Attribute 1 value(s)']],
    [row['Attribute 2 name'], row['Attribute 2 value(s)']],
    ['Weight (lbs)', row['Weight (lbs)']],
    ['Length (in)', row['Length (in)']],
    ['Width (in)', row['Width (in)']],
    ['Height (in)', row['Height (in)']]
  ]
    .filter(([name, value]) => name && value)
    .map(([name, value]) => ({ name, value }))

  return {
    id: 100_000 + index,
    name: row.Name.trim(),
    sku: (() => {
      const trimmed = row.SKU.trim()
      if (!trimmed) return `TYPH-CSV-${index + 1}`
      if (/^typh/i.test(trimmed)) return trimmed.replace(/^typh/i, 'TYPH')
      return `TYPH-${trimmed.toUpperCase()}`
    })(),
    category: row.Categories.trim() || 'Uncategorized',
    description: plainText(row.Description),
    shortDescription: plainText(row['Short description']),
    slug: slugify(row['Meta: _yoast_wpseo_title'] || row.Name),
    brand: row.Brands || row['Meta: brand'] || 'TYPHON',
    buyUrl: row['External URL'] || row['Meta: source_product_url'],
    featured: row['Is featured?'] === '1',
    galleryImages: images.slice(1),
    specifications,
    image: images[0] ?? '',
    price: numberValue(row['Regular price']) || numberValue(row['Sale price']),
    salePrice: numberValue(row['Sale price']) || undefined,
    stock: numberValue(row.Stock),
    status: 'Draft',
    updatedAt: 'July 25, 2026'
  }
})

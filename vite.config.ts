import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const sharedContentApi = () => {
  const contentFile = resolve(process.cwd(), 'happy-machinery-storage/content.json')
  let writeQueue = Promise.resolve()

  const readDatabase = async (): Promise<Record<string, unknown>> => {
    try {
      return JSON.parse(await readFile(contentFile, 'utf8')) as Record<string, unknown>
    } catch {
      try {
        const fallback = resolve(process.cwd(), '.admin-data/content.json')
        return JSON.parse(await readFile(fallback, 'utf8')) as Record<string, unknown>
      } catch {
        return {}
      }
    }
  }

  const allowedKeys = [
    'blog-posts',
    'media-library',
    'products',
    'cart-activity',
    'admin-users',
    'security-logs',
    'banned-ips',
    'failed-logins',
    'security-settings',
    'analytics-events',
    'site-settings',
    'site-pages',
    'blog-categories',
    'product-categories',
    'trash-items',
    'home-content',
    'inquiries',
    'orders',
    'comments'
  ]

  return {
    name: 'shared-content-api',
    configureServer(server: { middlewares: { use: (handler: (request: import('node:http').IncomingMessage, response: import('node:http').ServerResponse, next: () => void) => void) => void } }) {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://localhost')
        if (url.pathname !== '/api/content.php') {
          next()
          return
        }

        if (url.searchParams.get('action') === 'check-ip') {
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ ip: '127.0.0.1', banned: false }))
          return
        }

        const key = url.searchParams.get('key') ?? ''
        if (!allowedKeys.includes(key)) {
          response.statusCode = 400
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.end(JSON.stringify({ error: 'Invalid content key.' }))
          return
        }

        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.setHeader('Cache-Control', 'no-store')

        if (request.method === 'GET') {
          void readDatabase().then((database) => {
            if (!(key in database)) {
              response.statusCode = 404
              response.end(JSON.stringify({ error: 'Content has not been initialized.' }))
              return
            }
            response.end(JSON.stringify({ value: database[key] }))
          })
          return
        }

        if (request.method !== 'PUT' && request.method !== 'POST') {
          response.statusCode = 405
          response.end(JSON.stringify({ error: 'Method not allowed.' }))
          return
        }

        const chunks: Buffer[] = []
        let size = 0
        request.on('data', (chunk: Buffer) => {
          size += chunk.length
          if (size > 64 * 1024 * 1024) request.destroy()
          else chunks.push(chunk)
        })
        request.on('end', () => {
          writeQueue = writeQueue.then(async () => {
            const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { value?: unknown }
            const database = await readDatabase()

            if (request.method === 'POST') {
              const existing = Array.isArray(database[key]) ? (database[key] as unknown[]) : []
              existing.unshift(payload.value)
              const limits: Record<string, number> = {
                'analytics-events': 5000,
                'security-logs': 1000,
                'failed-logins': 500,
                'cart-activity': 500
              }
              database[key] = existing.slice(0, limits[key] ?? 1000)
            } else {
              database[key] = payload.value
            }

            await mkdir(dirname(contentFile), { recursive: true })
            await writeFile(contentFile, JSON.stringify(database), 'utf8')
          })
          void writeQueue.then(
            () => response.end(JSON.stringify({ saved: true })),
            (error: unknown) => {
              response.statusCode = 500
              response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Save failed.' }))
            }
          )
        })
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    sharedContentApi(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    host: true,
    allowedHosts: true,
  },
})

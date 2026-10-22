import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

const sharedContentApi = () => {
  const contentFile = resolve(process.cwd(), '.admin-data/content.json')
  let writeQueue = Promise.resolve()
  const devSessions = new Set<string>()

  const readDatabase = async (): Promise<Record<string, unknown>> => {
    try {
      return JSON.parse(await readFile(contentFile, 'utf8')) as Record<string, unknown>
    } catch {
      return {}
    }
  }

  return {
    name: 'shared-content-api',
    configureServer(server: { middlewares: { use: (handler: (request: import('node:http').IncomingMessage, response: import('node:http').ServerResponse, next: () => void) => void) => void } }) {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? '/', 'http://localhost')
        const cookieToken = (request.headers.cookie ?? '').split(';').map((part) => part.trim())
          .find((part) => part.startsWith('happy_admin_dev='))?.slice('happy_admin_dev='.length) ?? ''

        if (url.pathname === '/api/admin-auth.php') {
          response.setHeader('Content-Type', 'application/json; charset=utf-8')
          response.setHeader('Cache-Control', 'no-store')
          if (request.method === 'GET') {
            response.end(JSON.stringify({ authenticated: devSessions.has(cookieToken) }))
            return
          }
          if (request.method !== 'POST') {
            response.statusCode = 405
            response.setHeader('Allow', 'GET, POST')
            response.end(JSON.stringify({ error: 'Method not allowed.' }))
            return
          }
          const chunks: Buffer[] = []
          request.on('data', (chunk: Buffer) => chunks.push(chunk))
          request.on('end', () => {
            let payload: { action?: string; password?: string }
            try { payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { action?: string; password?: string } }
            catch {
              response.statusCode = 400
              response.end(JSON.stringify({ error: 'Invalid request body.' }))
              return
            }
            if (payload.action === 'logout') {
              devSessions.delete(cookieToken)
              response.setHeader('Set-Cookie', 'happy_admin_dev=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
              response.end(JSON.stringify({ authenticated: false }))
              return
            }
            const expected = process.env.HAPPY_ADMIN_PASSWORD
            if (!expected || expected.length < 14) {
              response.statusCode = 503
              response.end(JSON.stringify({ error: 'Set HAPPY_ADMIN_PASSWORD to a strong secret of at least 14 characters before using the local CMS.' }))
              return
            }
            if (typeof payload.password !== 'string' || payload.password !== expected) {
              response.statusCode = 401
              response.end(JSON.stringify({ error: 'Invalid password.' }))
              return
            }
            const token = randomUUID()
            devSessions.add(token)
            response.setHeader('Set-Cookie', `happy_admin_dev=${token}; Path=/; HttpOnly; SameSite=Strict`)
            response.end(JSON.stringify({ authenticated: true }))
          })
          return
        }

        if (url.pathname !== '/api/content.php') {
          next()
          return
        }

        const key = url.searchParams.get('key') ?? ''
        if (!['blog-posts', 'media-library', 'products', 'cart-activity'].includes(key)) {
          response.statusCode = 400
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
          response.setHeader('Allow', 'GET, PUT, POST')
          response.end(JSON.stringify({ error: 'Method not allowed.' }))
          return
        }
        if (request.method === 'PUT' && !devSessions.has(cookieToken)) {
          response.statusCode = 401
          response.end(JSON.stringify({ error: 'Administrator authentication is required.' }))
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
            if (request.method === 'PUT' && !Array.isArray(payload.value)) throw new Error('A valid content value is required.')
            if (request.method === 'POST' && (payload.value === null || typeof payload.value !== 'object')) throw new Error('A valid activity value is required.')
            const database = await readDatabase()
            if (request.method === 'POST' && key === 'cart-activity') {
              const existing = Array.isArray(database[key]) ? database[key] as unknown[] : []
              existing.unshift(payload.value)
              database[key] = existing.slice(0, 500)
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
})

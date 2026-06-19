import crypto from 'node:crypto'
import path from 'node:path'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import multer from 'multer'
import { getStorageBucket, getSupabase } from './supabaseClient.js'

dotenv.config()

const adminTokens = new Set()

const app = express()
const port = Number(process.env.PORT) || 3001
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: '2mb' }))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter(req, file, callback) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (allowedTypes.includes(file.mimetype)) {
      callback(null, true)
      return
    }

    callback(new Error('只支持 jpg、jpeg、png 或 webp 图片'))
  },
})

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean)
  }

  if (typeof tags === 'string') {
    return tags
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
  }

  return []
}

const normalizeRatings = (ratings = {}) => ({
  space: Number(ratings.space) || 4,
  material: Number(ratings.material) || 4,
  structure: Number(ratings.structure) || 4,
  site: Number(ratings.site) || 4,
  inspiration: Number(ratings.inspiration) || 4,
})

const calculateAverageRating = (ratings = {}) => {
  const normalizedRatings = normalizeRatings(ratings)
  const values = Object.values(normalizedRatings)
  const total = values.reduce((sum, value) => sum + value, 0)

  return Number((total / values.length).toFixed(1))
}

const normalizeCase = (caseItem) => ({
  id: caseItem.id ? String(caseItem.id) : undefined,
  name: String(caseItem.name || '').trim(),
  architect: String(caseItem.architect || '').trim(),
  city: String(caseItem.city || '').trim(),
  country: String(caseItem.country || '').trim(),
  type: String(caseItem.type || '').trim(),
  year: String(caseItem.year || '').trim(),
  image: typeof caseItem.image === 'string' ? caseItem.image.trim() : '',
  tags: normalizeTags(caseItem.tags),
  description: String(caseItem.description || '').trim(),
  inspiration: String(caseItem.inspiration || '').trim(),
  rating: Number(caseItem.rating) || calculateAverageRating(caseItem.ratings),
  ratings: normalizeRatings(caseItem.ratings),
})

const toSupabaseCasePayload = (caseItem, { includeId = false } = {}) => {
  const normalizedCase = normalizeCase(caseItem)
  const payload = {
    name: normalizedCase.name,
    architect: normalizedCase.architect,
    city: normalizedCase.city,
    country: normalizedCase.country,
    type: normalizedCase.type,
    year: normalizedCase.year,
    image: normalizedCase.image,
    tags: normalizedCase.tags,
    description: normalizedCase.description,
    inspiration: normalizedCase.inspiration,
    rating: calculateAverageRating(normalizedCase.ratings),
    ratings: normalizedCase.ratings,
  }

  if (includeId && normalizedCase.id) {
    payload.id = normalizedCase.id
  }

  return payload
}

const logServerError = (error) => {
  console.error('ArchCase API error:', {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  })
}

const validateCase = (caseItem) => {
  const missingFields = []

  if (!caseItem.name) {
    missingFields.push('name')
  }

  if (!caseItem.architect) {
    missingFields.push('architect')
  }

  if (!caseItem.type) {
    missingFields.push('type')
  }

  return missingFields
}

const requireAdmin = (req, res, next) => {
  const authHeader = req.get('Authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token || !adminTokens.has(token)) {
    res.status(401).json({ message: '需要管理员登录后才能操作' })
    return
  }

  next()
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'archcase-server',
    time: new Date().toISOString(),
  })
})

app.get('/api/cases', async (req, res, next) => {
  try {
    const { data, error } = await getSupabase().from('cases').select('*').order('id', {
      ascending: true,
    })

    if (error) {
      throw error
    }

    res.json((data || []).map(normalizeCase))
  } catch (error) {
    next(error)
  }
})

app.post('/api/cases', requireAdmin, async (req, res, next) => {
  try {
    const nextCase = normalizeCase({
      ...req.body,
      id: req.body.id || crypto.randomUUID(),
    })
    const missingFields = validateCase(nextCase)

    if (missingFields.length > 0) {
      res.status(400).json({
        message: '缺少必要字段',
        fields: missingFields,
      })
      return
    }

    const { data, error } = await getSupabase()
      .from('cases')
      .insert(toSupabaseCasePayload(nextCase, { includeId: true }))
      .select()
      .single()

    if (error) {
      throw error
    }

    res.status(201).json(normalizeCase(data))
  } catch (error) {
    next(error)
  }
})

app.put('/api/cases/:id', requireAdmin, async (req, res, next) => {
  try {
    const updatedCase = normalizeCase({
      ...req.body,
      id: req.params.id,
    })
    const missingFields = validateCase(updatedCase)

    if (missingFields.length > 0) {
      res.status(400).json({
        message: '缺少必要字段',
        fields: missingFields,
      })
      return
    }

    const updatePayload = toSupabaseCasePayload(updatedCase)

    const { data, error } = await getSupabase()
      .from('cases')
      .update(updatePayload)
      .eq('id', req.params.id)
      .select()
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      res.status(404).json({ message: '没有找到这个建筑案例' })
      return
    }

    res.json(normalizeCase(data))
  } catch (error) {
    next(error)
  }
})

app.delete('/api/cases/:id', requireAdmin, async (req, res, next) => {
  try {
    const { data, error } = await getSupabase()
      .from('cases')
      .delete()
      .eq('id', req.params.id)
      .select('id')

    if (error) {
      throw error
    }

    if (!data || data.length === 0) {
      res.status(404).json({ message: '没有找到这个建筑案例' })
      return
    }

    res.json({ message: '删除成功' })
  } catch (error) {
    next(error)
  }
})

app.post('/api/upload', requireAdmin, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: '请上传图片文件' })
      return
    }

    const ext = path.extname(req.file.originalname).toLowerCase()
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`
    const bucket = getStorageBucket()
    const filePath = `cases/${filename}`
    const { error } = await getSupabase().storage.from(bucket).upload(filePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    })

    if (error) {
      throw error
    }

    const { data } = getSupabase().storage.from(bucket).getPublicUrl(filePath)

    res.status(201).json({
      url: data.publicUrl,
      filename,
      path: filePath,
    })
  } catch (error) {
    next(error)
  }
})

app.post('/api/admin/login', (req, res) => {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_PASSWORD
  const { username, password } = req.body

  if (!adminPassword) {
    res.status(500).json({ message: '后端还没有配置管理员密码，请先设置 ADMIN_PASSWORD' })
    return
  }

  if (username !== adminUsername || password !== adminPassword) {
    res.status(401).json({ message: '用户名或密码错误' })
    return
  }

  const token = crypto.randomBytes(24).toString('hex')
  adminTokens.add(token)

  res.json({
    message: '登录成功',
    token,
    user: {
      username: adminUsername,
    },
  })
})

app.use((error, req, res, next) => {
  logServerError(error)
  res.status(500).json({
    message: error.message || '服务器内部错误',
    code: error.code,
    details: error.details,
    hint: error.hint,
  })
})

app.listen(port, () => {
  console.log(`ArchCase server is running at http://localhost:${port}`)
})

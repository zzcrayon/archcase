import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(__dirname, '..')
const dataFile = path.join(serverRoot, 'data', 'cases.json')

dotenv.config({
  path: path.join(serverRoot, '.env'),
})

const stableImageByName = new Map([
  ['朗香教堂', '/cases/ronchamp.jpg'],
  ['光之教堂', '/cases/church-of-light.png'],
  ['宁波博物馆', '/cases/ningbo-museum.jpg'],
  ['流水别墅', '/cases/fallingwater.jpg'],
  ['蓬皮杜中心', '/cases/pompidou.jpg'],
  ['萨伏伊别墅', '/cases/villa-savoye.jpg'],
  ['金贝尔美术馆', '/cases/kimbell.png'],
  ['西扎莱萨泳池', '/cases/leca-pool.jpeg'],
])

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
  id: String(caseItem.id),
  name: String(caseItem.name || '').trim(),
  architect: String(caseItem.architect || '').trim(),
  city: String(caseItem.city || '').trim(),
  country: String(caseItem.country || '').trim(),
  type: String(caseItem.type || '').trim(),
  year: String(caseItem.year || '').trim(),
  image: stableImageByName.get(caseItem.name) || String(caseItem.image || '').trim(),
  tags: normalizeTags(caseItem.tags),
  description: String(caseItem.description || '').trim(),
  inspiration: String(caseItem.inspiration || '').trim(),
  rating: calculateAverageRating(caseItem.ratings),
  ratings: normalizeRatings(caseItem.ratings),
})

const main = async () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const storageBucket = process.env.SUPABASE_STORAGE_BUCKET

  if (!supabaseUrl || !supabaseServiceRoleKey || !storageBucket) {
    throw new Error(
      '请先在 server/.env 中配置 SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY 和 SUPABASE_STORAGE_BUCKET',
    )
  }

  const rawData = await fs.readFile(dataFile, 'utf-8')
  const parsedCases = JSON.parse(rawData.replace(/^\uFEFF/, ''))

  if (!Array.isArray(parsedCases)) {
    throw new Error('server/data/cases.json 必须是案例数组')
  }

  const seedCases = parsedCases.map(normalizeCase)
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  const { error } = await supabase.from('cases').upsert(seedCases, {
    onConflict: 'id',
  })

  if (error) {
    throw error
  }

  console.log(`已成功导入 ${seedCases.length} 条 ArchCase 默认案例到 Supabase cases 表。`)
}

main().catch((error) => {
  console.error('导入 Supabase 失败：')
  console.error(error)
  process.exit(1)
})

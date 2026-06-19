import { useEffect, useState } from 'react'
import { DEFAULT_RATINGS, RATING_FIELDS, normalizeRatings } from '../utils/ratings'

const MAX_UPLOAD_IMAGE_SIZE = 1.5 * 1024 * 1024
const MAX_IMAGE_EDGE = 1600
const IMAGE_QUALITY = 0.75

const emptyFormData = {
  name: '',
  architect: '',
  city: '',
  country: '',
  type: '',
  year: '',
  image: '',
  tags: '',
  description: '',
  inspiration: '',
  ratings: DEFAULT_RATINGS,
}

const createFormData = (initialCase) => {
  if (!initialCase) {
    return emptyFormData
  }

  return {
    name: initialCase.name || '',
    architect: initialCase.architect || '',
    city: initialCase.city || '',
    country: initialCase.country || '',
    type: initialCase.type || '',
    year: initialCase.year || '',
    image: initialCase.image || '',
    tags: Array.isArray(initialCase.tags) ? initialCase.tags.join('，') : '',
    description: initialCase.description || '',
    inspiration: initialCase.inspiration || '',
    ratings: normalizeRatings(initialCase.ratings),
  }
}

const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    const imageUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(imageUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl)
      reject(new Error('图片加载失败'))
    }

    image.src = imageUrl
  })

const createCompressedImageBlob = async (file) => {
  const image = await loadImageFromFile(file)
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.round(image.naturalWidth * scale)
  const height = Math.round(image.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = width
  canvas.height = height

  if (!context) {
    throw new Error('浏览器不支持图片压缩')
  }

  context.fillStyle = '#f6f1e8'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
          return
        }

        reject(new Error('图片压缩失败'))
      },
      'image/jpeg',
      IMAGE_QUALITY,
    )
  })
}

const readBlobAsDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const imageData = typeof reader.result === 'string' ? reader.result : ''

      if (!imageData.startsWith('data:image/')) {
        reject(new Error('图片读取格式不正确'))
        return
      }

      resolve(imageData)
    }

    reader.onerror = () => {
      reject(new Error('图片读取失败'))
    }

    reader.readAsDataURL(blob)
  })

function CaseModal({ categories, initialCase, onClose, onSaveCase }) {
  const [formData, setFormData] = useState(() => createFormData(initialCase))
  const [errors, setErrors] = useState({})
  const [uploadedImage, setUploadedImage] = useState('')
  const [uploadedImageName, setUploadedImageName] = useState('')
  const [previewImageError, setPreviewImageError] = useState(false)
  const [isCompressingImage, setIsCompressingImage] = useState(false)

  const isEditing = Boolean(initialCase)
  const typeOptions = categories.filter((category) => category !== '全部')
  const previewImage = uploadedImage || (typeof formData.image === 'string' ? formData.image.trim() : '')

  useEffect(() => {
    setPreviewImageError(false)
  }, [previewImage])

  const updateField = (field, value) => {
    setFormData((currentData) => ({
      ...currentData,
      [field]: value,
    }))
  }

  const updateRating = (field, value) => {
    setFormData((currentData) => ({
      ...currentData,
      ratings: {
        ...currentData.ratings,
        [field]: Number(value),
      },
    }))
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setUploadedImage('')
    setUploadedImageName('')
    setPreviewImageError(false)

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      window.alert('请上传 jpg、jpeg、png 或 webp 格式的图片')
      return
    }

    setIsCompressingImage(true)

    try {
      const compressedBlob = await createCompressedImageBlob(file)

      if (compressedBlob.size > MAX_UPLOAD_IMAGE_SIZE) {
        window.alert('图片仍然过大，请更换图片或手动压缩后再上传')
        return
      }

      const imageData = await readBlobAsDataUrl(compressedBlob)
      setUploadedImage(imageData)
      setUploadedImageName(`${file.name}（已自动压缩）`)
    } catch {
      window.alert('图片处理失败，请重新选择图片')
    } finally {
      setIsCompressingImage(false)
    }
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!formData.name.trim()) {
      nextErrors.name = '请填写建筑名称'
    }

    if (!formData.architect.trim()) {
      nextErrors.architect = '请填写建筑师'
    }

    if (!formData.city.trim()) {
      nextErrors.city = '请填写城市'
    }

    if (!formData.type.trim()) {
      nextErrors.type = '请选择建筑类型'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    if (isCompressingImage) {
      window.alert('图片正在压缩中，请稍等一下再保存')
      return
    }

    const tags = formData.tags
      .split(/[,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)

    onSaveCase({
      name: formData.name.trim(),
      architect: formData.architect.trim(),
      city: formData.city.trim(),
      country: formData.country.trim(),
      type: formData.type.trim(),
      year: formData.year.trim(),
      image: uploadedImage || formData.image.trim(),
      tags,
      description: formData.description.trim(),
      inspiration: formData.inspiration.trim(),
      ratings: normalizeRatings(formData.ratings),
    })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="case-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">{isEditing ? 'EDIT CASE' : 'NEW CASE'}</p>
            <h2 id="case-modal-title">{isEditing ? '编辑建筑案例' : '添加建筑案例'}</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="关闭弹窗">
            ×
          </button>
        </div>

        <form className="case-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>建筑名称 *</span>
            <input
              type="text"
              value={formData.name}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="例如：光之教堂"
            />
            {errors.name && <small>{errors.name}</small>}
          </label>

          <label className="form-field">
            <span>建筑师 *</span>
            <input
              type="text"
              value={formData.architect}
              onChange={(event) => updateField('architect', event.target.value)}
              placeholder="例如：安藤忠雄"
            />
            {errors.architect && <small>{errors.architect}</small>}
          </label>

          <label className="form-field">
            <span>城市 *</span>
            <input
              type="text"
              value={formData.city}
              onChange={(event) => updateField('city', event.target.value)}
              placeholder="例如：茨木"
            />
            {errors.city && <small>{errors.city}</small>}
          </label>

          <label className="form-field">
            <span>国家</span>
            <input
              type="text"
              value={formData.country}
              onChange={(event) => updateField('country', event.target.value)}
              placeholder="例如：日本"
            />
          </label>

          <label className="form-field">
            <span>建筑类型 *</span>
            <select
              value={formData.type}
              onChange={(event) => updateField('type', event.target.value)}
            >
              <option value="">请选择类型</option>
              {typeOptions.map((type) => (
                <option value={type} key={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.type && <small>{errors.type}</small>}
          </label>

          <label className="form-field">
            <span>建成年份</span>
            <input
              type="text"
              value={formData.year}
              onChange={(event) => updateField('year', event.target.value)}
              placeholder="例如：1989"
            />
          </label>

          <label className="form-field form-field-wide">
            <span>图片链接</span>
            <input
              type="text"
              value={formData.image}
              onChange={(event) => updateField('image', event.target.value)}
              placeholder="粘贴一张建筑图片链接"
            />
          </label>

          <div className="image-upload-field">
            <div className="image-upload-head">
              <span>上传本地图片</span>
              <small>选择后会自动压缩图片，再保存到本地。</small>
            </div>
            <label className="image-upload-control">
              <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleImageUpload} />
              <span>选择图片</span>
            </label>
            {uploadedImageName && <p className="upload-file-name">已选择：{uploadedImageName}</p>}
            {isCompressingImage && <p className="upload-file-name">正在压缩图片，请稍等...</p>}
            {uploadedImage && <p className="upload-priority">已上传本地图片，提交时将优先使用它。</p>}
            <div className={previewImage && !previewImageError ? 'image-preview-box has-image' : 'image-preview-box'}>
              {previewImage && !previewImageError ? (
                <img
                  src={previewImage}
                  alt="案例图片预览"
                  onError={() => setPreviewImageError(true)}
                />
              ) : (
                <span>暂无图片预览</span>
              )}
            </div>
          </div>

          <label className="form-field form-field-wide">
            <span>关键词标签</span>
            <input
              type="text"
              value={formData.tags}
              onChange={(event) => updateField('tags', event.target.value)}
              placeholder="光线,混凝土,精神性"
            />
          </label>

          <label className="form-field form-field-wide">
            <span>简介</span>
            <textarea
              value={formData.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="写一句这个案例的空间或设计特点"
              rows="3"
            />
          </label>

          <label className="form-field form-field-wide">
            <span>设计启发</span>
            <textarea
              value={formData.inspiration}
              onChange={(event) => updateField('inspiration', event.target.value)}
              placeholder="写下这个案例可以启发你的地方"
              rows="3"
            />
          </label>

          <fieldset className="rating-fieldset">
            <legend>案例评分</legend>
            <div className="rating-input-grid">
              {RATING_FIELDS.map((field) => (
                <label className="rating-input" key={field.key}>
                  <span>{field.label}</span>
                  <select
                    value={formData.ratings[field.key]}
                    onChange={(event) => updateRating(field.key, event.target.value)}
                  >
                    <option value="1">1 分</option>
                    <option value="2">2 分</option>
                    <option value="3">3 分</option>
                    <option value="4">4 分</option>
                    <option value="5">5 分</option>
                  </select>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose}>
              取消
            </button>
            <button className="primary-button" type="submit" disabled={isCompressingImage}>
              {isEditing ? '保存' : '提交'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default CaseModal

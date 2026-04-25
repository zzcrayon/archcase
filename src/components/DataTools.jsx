import { useRef } from 'react'

const REQUIRED_FIELDS = ['name', 'architect', 'type']

const isValidCase = (item) =>
  item &&
  typeof item === 'object' &&
  REQUIRED_FIELDS.every((field) => typeof item[field] === 'string' && item[field].trim())

function DataTools({ cases, onImportCases, onResetCases }) {
  const fileInputRef = useRef(null)

  const handleExport = () => {
    const jsonText = JSON.stringify(cases, null, 2)
    const blob = new Blob([jsonText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'archcase-data.json'
    link.click()

    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => {
    const shouldContinue = window.confirm('导入数据会覆盖当前案例库，是否继续？')

    if (!shouldContinue) {
      return
    }

    fileInputRef.current?.click()
  }

  const handleImportFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    const isJsonFile = file?.type === 'application/json' || file?.name.toLowerCase().endsWith('.json')

    if (!file || !isJsonFile) {
      window.alert('导入失败，请检查 JSON 文件格式')
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      try {
        const parsedData = JSON.parse(reader.result)

        if (!Array.isArray(parsedData) || !parsedData.every(isValidCase)) {
          window.alert('导入失败，请检查 JSON 文件格式')
          return
        }

        onImportCases(parsedData)
      } catch {
        window.alert('导入失败，请检查 JSON 文件格式')
      }
    }

    reader.onerror = () => {
      window.alert('导入失败，请检查 JSON 文件格式')
    }

    reader.readAsText(file)
  }

  return (
    <section className="data-tools" aria-label="案例数据导入与导出">
      <div>
        <p className="eyebrow">DATA BACKUP</p>
        <h2>案例数据</h2>
      </div>

      <div className="data-tool-actions">
        <button type="button" onClick={handleExport}>
          导出数据
        </button>
        <button type="button" onClick={handleImportClick}>
          导入数据
        </button>
        <button type="button" onClick={onResetCases}>
          重置默认案例
        </button>
      </div>

      <input
        ref={fileInputRef}
        className="file-input"
        type="file"
        accept="application/json,.json"
        onChange={handleImportFile}
      />
    </section>
  )
}

export default DataTools

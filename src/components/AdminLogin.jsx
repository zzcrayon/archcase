import { useState } from 'react'

function AdminLogin({ adminSession, onLogin, onLogout }) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAdmin = Boolean(adminSession?.token)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await onLogin({
        username: username.trim(),
        password,
      })
      setPassword('')
      setIsFormOpen(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="admin-login" aria-label="管理员入口">
      <div>
        <p className="eyebrow">ADMIN ACCESS</p>
        <h2>{isAdmin ? '管理员模式' : '公共展示模式'}</h2>
      </div>

      {isAdmin ? (
        <div className="admin-login-actions">
          <span>{adminSession.username || 'admin'} 已登录</span>
          <button type="button" onClick={onLogout}>
            退出
          </button>
        </div>
      ) : (
        <div className="admin-login-actions">
          {!isFormOpen ? (
            <button type="button" onClick={() => setIsFormOpen(true)}>
              管理员登录
            </button>
          ) : (
            <form className="admin-login-form" onSubmit={handleSubmit}>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="用户名"
                aria-label="管理员用户名"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="密码"
                aria-label="管理员密码"
              />
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '登录中' : '登录'}
              </button>
              <button type="button" onClick={() => setIsFormOpen(false)}>
                取消
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  )
}

export default AdminLogin

const icons = { home: '⌂', users: '♙', building: '▦', profile: '◉', activity: '⌁', calendar: '□', chart: '↗' }

export default function FooterBar({ items, onNavigate }) {
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/'

  function navigate(path) {
    if (onNavigate) return onNavigate(path)
    window.history.pushState({}, '', path)
    window.dispatchEvent(new Event('popstate'))
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return <nav className="footer-bar" aria-label="Menu principal">
    {items.map((item) => { const nested = item.path.split('/').filter(Boolean).length > 1 && currentPath.startsWith(`${item.path}/`); return <button key={item.path} className={currentPath === item.path || nested ? 'footer-item active' : 'footer-item'} onClick={() => navigate(item.path)}>
      <span className="footer-icon" aria-hidden="true">{icons[item.icon] || '•'}</span>
      <span>{item.label}</span>
    </button> })}
  </nav>
}

const icons = { home: '⌂', users: '♙', building: '▦', profile: '◉', activity: '⌁', calendar: '□', chart: '↗' }

export default function FooterBar({ items, onNavigate }) {
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/'
  const activePath = items
    .filter((item) => currentPath === item.path || currentPath.startsWith(`${item.path}/`))
    .sort((first, second) => second.path.length - first.path.length)[0]?.path

  function navigate(path) {
    if (onNavigate) return onNavigate(path)
    window.history.pushState({}, '', path)
    window.dispatchEvent(new Event('popstate'))
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  return <nav className="footer-bar" aria-label="Menu principal">
    {items.map((item) => <button key={item.path} className={activePath === item.path ? 'footer-item active' : 'footer-item'} onClick={() => navigate(item.path)}>
      <span className="footer-icon" aria-hidden="true">{icons[item.icon] || '•'}</span>
      <span>{item.label}</span>
    </button>)}
  </nav>
}

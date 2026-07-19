const icons = { home: '⌂', users: '♙', building: '▦', profile: '◉', activity: '⌁', calendar: '□', chart: '↗' }

export default function FooterBar({ items }) {
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/'

  function navigate(path) {
    window.history.pushState({}, '', path)
    window.location.reload()
  }

  return <nav className="footer-bar" aria-label="Menu principal">
    {items.map((item) => <button key={item.path} className={currentPath === item.path ? 'footer-item active' : 'footer-item'} onClick={() => navigate(item.path)}>
      <span className="footer-icon" aria-hidden="true">{icons[item.icon] || '•'}</span>
      <span>{item.label}</span>
    </button>)}
  </nav>
}

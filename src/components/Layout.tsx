import { NavLink, Outlet, useLocation } from 'react-router-dom'

// Pages that need the full screen width instead of the default narrow column.
const WIDE_ROUTES = ['/bossing-selector']

function Layout() {
  const { pathname } = useLocation()
  const wide = WIDE_ROUTES.some((route) => pathname.startsWith(route))

  return (
    <div className={wide ? 'app-shell wide' : 'app-shell'}>
      <header className="app-header">
        <h1>OSRS Utilities</h1>
        <p>Tools for Old School RuneScape</p>
        <nav className="app-nav">
          <NavLink to="/price-tracker" className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}>
            Price Tracker
          </NavLink>
          <NavLink to="/unity-bingo" className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}>
            Unity Bingo
          </NavLink>
          <NavLink to="/bossing-selector" className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}>
            Bossing Selector
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

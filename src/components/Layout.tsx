import { NavLink, Outlet } from 'react-router-dom'

function Layout() {
  return (
    <>
      <header className="app-header">
        <h1>OSRS Shopping List</h1>
        <p>Track what you need to buy for your next grind</p>
        <nav className="app-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}>
            Shopping List
          </NavLink>
          <NavLink to="/unity-bingo" className={({ isActive }) => (isActive ? 'app-nav-link active' : 'app-nav-link')}>
            Unity Bingo
          </NavLink>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </>
  )
}

export default Layout

import { NavLink, Outlet } from 'react-router-dom'

function Layout() {
  return (
    <>
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
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </>
  )
}

export default Layout

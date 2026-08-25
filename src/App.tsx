import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import ShoppingListPage from './pages/ShoppingListPage'
import UnityBingoPage from './pages/UnityBingoPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ShoppingListPage />} />
          <Route path="unity-bingo" element={<UnityBingoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

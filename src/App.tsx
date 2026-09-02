import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import PriceTrackerPage from './pages/PriceTrackerPage'
import UnityBingoPage from './pages/UnityBingoPage'

const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="price-tracker" replace />} />
          <Route path="price-tracker" element={<PriceTrackerPage />} />
          <Route path="unity-bingo" element={<UnityBingoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App

import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyKioskTheme } from './board/theme/theme'

applyKioskTheme()

createRoot(document.getElementById('root')).render(<App />)

import { createRoot } from 'react-dom/client'
import { PaigerProvider } from 'paiger'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
	<PaigerProvider>
		<App />
	</PaigerProvider>
)

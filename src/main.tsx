import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { injectSecurityMetaTags } from './utils/securityHeaders'

// Apply security headers for production
injectSecurityMetaTags();

createRoot(document.getElementById("root")!).render(<App />);

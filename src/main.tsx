import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx: Script started');
console.log('Main.tsx: Root element:', document.getElementById("root"));

try {
  const root = createRoot(document.getElementById("root")!);
  console.log('Main.tsx: Root created successfully');
  root.render(<App />);
  console.log('Main.tsx: App rendered successfully');
} catch (error) {
  console.error('Main.tsx: Error during rendering:', error);
}

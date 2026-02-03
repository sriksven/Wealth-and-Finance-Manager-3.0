import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'chartjs-adapter-date-fns';

console.log('Main.tsx executing');
ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)

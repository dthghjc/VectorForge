import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import zhCN from 'antd/locale/zh_CN';
import { Provider } from 'react-redux';
import {ConfigProvider} from "antd"

createRoot(document.getElementById('root')!).render(
  <ConfigProvider locale={zhCN}>
    <App />
  </ConfigProvider>
)

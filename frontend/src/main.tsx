import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import zhCN from 'antd/locale/zh_CN';
import { Provider } from 'react-redux';
import { ConfigProvider, App as AntdApp } from "antd"
import { store } from './store'

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  </Provider>
)

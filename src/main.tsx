import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { postReady, watchResize } from './embed';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// 규격 4번: 로드 완료 1회 ready, 이후 높이 변화 resize
postReady();
watchResize();

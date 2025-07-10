import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // thời gian giữ cache không gọi lại API
      staleTime: 5 * 60 * 1000, // 5 phút

      // dữ liệu được giữ lại trong cache sau khi component unmount
       gcTime: 10 * 60 * 1000, // 10 phút

      // không tự động gọi lại API khi window refocus
      refetchOnWindowFocus: false,

      // gọi lại khi kết nối mạng khôi phục
      refetchOnReconnect: true,
    },
  },
});
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  // <React.StrictMode>
    <QueryClientProvider client={queryClient}>
    <App />
     <ReactQueryDevtools initialIsOpen={true} />
  </QueryClientProvider>
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

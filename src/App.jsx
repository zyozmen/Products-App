import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GrowShopApp from './components/GrowShopApp';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="GrowShopApp hu-min-h-screen hu-w-full">
        <GrowShopApp />
      </div>
    </QueryClientProvider>
  );
}

export default App;

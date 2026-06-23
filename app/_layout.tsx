import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { getDb } from '@/db/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000 },
  },
});

export default function RootLayout() {
  useEffect(() => {
    // Open DB and run schema + seed synchronously on first mount
    getDb();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

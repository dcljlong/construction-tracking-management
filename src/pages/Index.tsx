
import React from 'react';
import AppLayout from '@/components/AppLayout';
import { AppProvider } from '@/contexts/AppContext';
import { AuthProvider } from '@/lib/auth';

const Index: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <AppLayout />
      </AppProvider>
    </AuthProvider>
  );
};

export default Index;

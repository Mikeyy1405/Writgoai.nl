
'use client';

import { AIFloatingAssistant } from './ai-floating-assistant';
import { usePathname } from 'next/navigation';

interface AdminLayoutWrapperProps {
  children: React.ReactNode;
  onTaskCreated?: () => void;
}

export function AdminLayoutWrapper({ children, onTaskCreated }: AdminLayoutWrapperProps) {
  const pathname = usePathname();
  
  // Don't show AI assistant on client portal pages or login pages
  const isClientPortal = pathname?.startsWith('/portal');
  const isLoginPage = pathname?.startsWith('/login');
  const isSignupPage = pathname?.startsWith('/signup');
  
  const showAIAssistant = !isClientPortal && !isLoginPage && !isSignupPage;

  return (
    <>
      {children}
      {showAIAssistant && <AIFloatingAssistant onTaskCreated={onTaskCreated} />}
    </>
  );
}

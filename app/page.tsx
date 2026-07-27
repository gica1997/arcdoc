// ============================================
// ArcDoc Enterprise - Main Page (Redirect)
// ============================================

import { redirect } from 'next/navigation';

/**
 * Root page - redirects to dashboard or auth.
 */
export default function HomePage() {
  // In production, this would check for an existing session
  // For now, redirect to dashboard
  redirect('/dashboard');
}
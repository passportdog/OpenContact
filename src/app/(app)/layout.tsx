export const dynamic = 'force-dynamic'

import AppShellLayout from './app-shell'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShellLayout>{children}</AppShellLayout>
}

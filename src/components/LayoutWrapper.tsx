'use client'

import { usePathname } from 'next/navigation'
import NavigationMenu from './NavigationMenu'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  
  // Don't show navigation on auth pages
  const hideNavigation = ['/login', '/register', '/'].includes(pathname)

  return (
    <>
      {!hideNavigation && <NavigationMenu />}
      {children}
    </>
  )
}

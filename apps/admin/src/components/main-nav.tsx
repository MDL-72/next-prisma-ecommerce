'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as React from 'react'

// tiny cookie helper (client-side)
function readCookie(name: string) {
   if (typeof document === 'undefined') return undefined
   return document.cookie
      .split('; ')
      .find((row) => row.startsWith(name + '='))
      ?.split('=')[1]
}

export function MainNav({
   className,
   ...props
}: React.HTMLAttributes<HTMLElement>) {
   const pathname = usePathname()

   // isAdmin comes from a non-httpOnly cookie set by middleware
   const isAdmin = React.useMemo(() => readCookie('is-admin') === 'true', [])

   const routes = React.useMemo(() => {
      const all = [
         {
            href: '/banners',
            label: 'Banners',
            active: pathname.startsWith('/banners'),
         },
         {
            href: '/categories',
            label: 'Categories',
            active: pathname.startsWith('/categories'),
         },
         {
            href: '/products',
            label: 'Products',
            active: pathname.startsWith('/products'),
         },
         {
            href: '/orders',
            label: 'Orders',
            active: pathname.startsWith('/orders'),
         },
         {
            href: '/payments',
            label: 'Payments',
            active: pathname.startsWith('/payments'),
         },
         {
            href: '/users',
            label: 'Users',
            active: pathname.startsWith('/users'),
         },
         {
            href: '/brands',
            label: 'Brands',
            active: pathname.startsWith('/brands'),
         },
         {
            href: '/codes',
            label: 'Codes',
            active: pathname.startsWith('/codes'),
         },
         {
            href: '/reports',
            label: 'Reports',
            active: pathname.startsWith('/reports'),
         },
      ]
      return isAdmin ? all : all.filter((r) => r.href !== '/reports')
   }, [pathname, isAdmin])

   return (
      <nav
         className={cn('flex items-center space-x-4 lg:space-x-6', className)}
         {...props}
      >
         {routes.map((route) => (
            <Link
               key={route.href}
               href={route.href}
               className={cn(
                  'text-sm transition-colors hover:text-primary',
                  route.active
                     ? 'font-semibold'
                     : 'font-light text-muted-foreground'
               )}
            >
               {route.label}
            </Link>
         ))}
      </nav>
   )
}

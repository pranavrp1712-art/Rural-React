import { Link, useLocation } from 'react-router-dom'
import type { AnchorHTMLAttributes, ReactNode } from 'react'

/**
 * The navigation data carries two kinds of destination: landing page
 * anchors like `#solutions` and real routes like `/industries`. This
 * resolves both without every call site having to know which it has.
 *
 * An anchor is only a same-page jump while we are actually on the
 * landing page. From anywhere else it has to become `/#solutions`, or
 * the browser looks for an element that is not on this route.
 */
export function SmartLink({
  href,
  children,
  ...rest
}: { href: string; children: ReactNode } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const { pathname } = useLocation()

  // External and protocol links stay plain anchors.
  if (/^(https?:|mailto:|tel:)/.test(href)) {
    return (
      <a href={href} rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    )
  }

  if (href.startsWith('#')) {
    // Same-document jump: let the browser do it, so smooth scrolling
    // and the URL hash both behave natively.
    if (pathname === '/') {
      return (
        <a href={href} {...rest}>
          {children}
        </a>
      )
    }
    return (
      <Link to={`/${href}`} {...rest}>
        {children}
      </Link>
    )
  }

  return (
    <Link to={href} {...rest}>
      {children}
    </Link>
  )
}

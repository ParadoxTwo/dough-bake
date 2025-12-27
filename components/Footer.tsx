import Link from 'next/link'
import Logo from './Logo'
import { getContent } from '@/lib/content'

export default async function Footer() {
  const currentYear = new Date().getFullYear()
  const logoTagline = await getContent('logo_tagline')

  return (
    <footer 
      className="mt-auto"
      style={{ 
        backgroundColor: 'var(--theme-surface)',
        color: 'var(--theme-text)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <Logo size={80} />
            </div>
            <p 
              className="text-sm"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              {logoTagline}
            </p>
          </div>

          <div>
            <h4 
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--theme-text)' }}
            >
              Shop
            </h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/menu" 
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  All Products
                </Link>
              </li>
              <li>
                <Link 
                  href="/menu?category=Bread" 
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  Breads
                </Link>
              </li>
              <li>
                <Link 
                  href="/menu?category=Pastry" 
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  Pastries
                </Link>
              </li>
              <li>
                <Link 
                  href="/menu?category=Cookies" 
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--theme-text)' }}
            >
              Customer Service
            </h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/about" 
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link 
                  href="/faq" 
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link 
                  href="/shipping" 
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  Shipping Info
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 
              className="text-lg font-semibold mb-4"
              style={{ color: 'var(--theme-text)' }}
            >
              Connect
            </h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#" 
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  Facebook
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  Instagram
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  Twitter
                </a>
              </li>
              <li>
                <a 
                  href="mailto:hello@doughbake.com" 
                  className="text-sm hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  Email Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div 
          className="border-t mt-8 pt-8 text-center"
          style={{ borderColor: 'var(--theme-secondary)' }}
        >
          <p 
            className="text-sm"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            &copy; {currentYear} Dough Bake. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}


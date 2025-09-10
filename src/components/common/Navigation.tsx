import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface BreadcrumbItem {
  label: string
  href?: string
}

export const Breadcrumb = ({ items }: { items: BreadcrumbItem[] }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-neutral-gray">
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <svg className="w-4 h-4 mx-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {item.href ? (
            <Link to={item.href} className="hover:text-primary-main transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-neutral-dark font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

interface TabItem {
  key: string
  label: string
  icon?: ReactNode
}

export const Tabs = ({
  items,
  activeKey,
  onChange
}: {
  items: TabItem[]
  activeKey: string
  onChange: (key: string) => void
}) => {
  return (
    <div className="border-b border-neutral-border">
      <nav className="-mb-px flex space-x-8">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`
              group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
              transition-all duration-200
              ${
                activeKey === item.key
                  ? 'border-primary-main text-primary-main'
                  : 'border-transparent text-neutral-gray hover:text-neutral-dark hover:border-neutral-lighter'
              }
            `}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
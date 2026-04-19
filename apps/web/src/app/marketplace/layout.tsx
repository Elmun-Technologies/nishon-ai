import MarketplaceLayoutClient from './MarketplaceLayoutClient'

export default function MarketplaceLayout({ children }: { children: React.ReactNode }) {
  return <MarketplaceLayoutClient>{children}</MarketplaceLayoutClient>
}

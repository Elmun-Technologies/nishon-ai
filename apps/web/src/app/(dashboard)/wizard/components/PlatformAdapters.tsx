'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Alert, AlertDescription } from '@/components/ui/Alert'

interface PlatformAdapterProps {
  platform: string
  onConnect: () => void
  onDisconnect: () => void
  isConnected: boolean
  isConnecting: boolean
}

export function MetaAdsAdapter({ platform, onConnect, onDisconnect, isConnected, isConnecting }: PlatformAdapterProps) {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setConnectionStatus('connecting')
    setError(null)
    
    try {
      // Simulate Meta Ads API connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock successful connection
      setConnectionStatus('connected')
      onConnect()
    } catch (err) {
      setConnectionStatus('error')
      setError('Failed to connect to Meta Ads API')
      onDisconnect()
    }
  }

  const handleDisconnect = () => {
    setConnectionStatus('idle')
    setError(null)
    onDisconnect()
  }

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">📘</Badge>
          <h3 className="text-lg font-semibold text-white">Meta Ads</h3>
        </div>
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' && (
            <Badge variant="success">Connected</Badge>
          )}
          {connectionStatus === 'connecting' && (
            <Badge variant="warning">Connecting...</Badge>
          )}
          {connectionStatus === 'error' && (
            <Badge variant="error">Error</Badge>
          )}
          {connectionStatus === 'idle' && (
            <Badge variant="secondary">Not Connected</Badge>
          )}
        </div>
      </div>

      {connectionStatus === 'connecting' && (
        <div className="space-y-2 mb-4">
          <Progress value={50} />
          <p className="text-sm text-slate-500">Connecting to Meta Ads API...</p>
        </div>
      )}

      {connectionStatus === 'error' && error && (
        <Alert variant="error" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium text-white mb-2">Features</h4>
          <ul className="text-sm text-slate-500 space-y-1">
            <li>✓ Campaign creation and management</li>
            <li>✓ Ad Set targeting and optimization</li>
            <li>✓ Creative asset management</li>
            <li>✓ Performance analytics</li>
            <li>✓ Advantage+ campaign budget</li>
          </ul>
        </div>

        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Meta Ads'}
            </Button>
          ) : (
            <Button 
              variant="secondary" 
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export function GoogleAdsAdapter({ platform, onConnect, onDisconnect, isConnected, isConnecting }: PlatformAdapterProps) {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setConnectionStatus('connecting')
    setError(null)
    
    try {
      // Simulate Google Ads API connection
      await new Promise(resolve => setTimeout(resolve, 2500))
      
      // Mock successful connection
      setConnectionStatus('connected')
      onConnect()
    } catch (err) {
      setConnectionStatus('error')
      setError('Failed to connect to Google Ads API')
      onDisconnect()
    }
  }

  const handleDisconnect = () => {
    setConnectionStatus('idle')
    setError(null)
    onDisconnect()
  }

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">🔍</Badge>
          <h3 className="text-lg font-semibold text-white">Google Ads</h3>
        </div>
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' && (
            <Badge variant="success">Connected</Badge>
          )}
          {connectionStatus === 'connecting' && (
            <Badge variant="warning">Connecting...</Badge>
          )}
          {connectionStatus === 'error' && (
            <Badge variant="error">Error</Badge>
          )}
          {connectionStatus === 'idle' && (
            <Badge variant="secondary">Not Connected</Badge>
          )}
        </div>
      </div>

      {connectionStatus === 'connecting' && (
        <div className="space-y-2 mb-4">
          <Progress value={60} />
          <p className="text-sm text-slate-500">Connecting to Google Ads API...</p>
        </div>
      )}

      {connectionStatus === 'error' && error && (
        <Alert variant="error" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium text-white mb-2">Features</h4>
          <ul className="text-sm text-slate-500 space-y-1">
            <li>✓ Search campaigns with RSA</li>
            <li>✓ Display and video campaigns</li>
            <li>✓ Performance Max campaigns</li>
            <li>✓ Smart bidding strategies</li>
            <li>✓ Responsive Search Ads</li>
          </ul>
        </div>

        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Google Ads'}
            </Button>
          ) : (
            <Button 
              variant="secondary" 
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export function YandexDirectAdapter({ platform, onConnect, onDisconnect, isConnected, isConnecting }: PlatformAdapterProps) {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setConnectionStatus('connecting')
    setError(null)
    
    try {
      // Simulate Yandex Direct API connection
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock successful connection
      setConnectionStatus('connected')
      onConnect()
    } catch (err) {
      setConnectionStatus('error')
      setError('Failed to connect to Yandex Direct API')
      onDisconnect()
    }
  }

  const handleDisconnect = () => {
    setConnectionStatus('idle')
    setError(null)
    onDisconnect()
  }

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">📘</Badge>
          <h3 className="text-lg font-semibold text-white">Yandex Direct</h3>
        </div>
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' && (
            <Badge variant="success">Connected</Badge>
          )}
          {connectionStatus === 'connecting' && (
            <Badge variant="warning">Connecting...</Badge>
          )}
          {connectionStatus === 'error' && (
            <Badge variant="error">Error</Badge>
          )}
          {connectionStatus === 'idle' && (
            <Badge variant="secondary">Not Connected</Badge>
          )}
        </div>
      </div>

      {connectionStatus === 'connecting' && (
        <div className="space-y-2 mb-4">
          <Progress value={40} />
          <p className="text-sm text-slate-500">Connecting to Yandex Direct API...</p>
        </div>
      )}

      {connectionStatus === 'error' && error && (
        <Alert variant="error" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium text-white mb-2">Features</h4>
          <ul className="text-sm text-slate-500 space-y-1">
            <li>✓ Text and banner ads</li>
            <li>✓ Smart bidding strategies</li>
            <li>✓ Audience targeting</li>
            <li>✓ Performance analytics</li>
            <li>✓ JSON-RPC v5 API</li>
          </ul>
        </div>

        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Yandex Direct'}
            </Button>
          ) : (
            <Button 
              variant="secondary" 
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export function TelegramAdsAdapter({ platform, onConnect, onDisconnect, isConnected, isConnecting }: PlatformAdapterProps) {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setConnectionStatus('connecting')
    setError(null)
    
    try {
      // Simulate Telegram Ads connection (manual flow)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock successful connection
      setConnectionStatus('connected')
      onConnect()
    } catch (err) {
      setConnectionStatus('error')
      setError('Failed to connect to Telegram Ads')
      onDisconnect()
    }
  }

  const handleDisconnect = () => {
    setConnectionStatus('idle')
    setError(null)
    onDisconnect()
  }

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">✈️</Badge>
          <h3 className="text-lg font-semibold text-white">Telegram Ads</h3>
        </div>
        <div className="flex items-center gap-2">
          {connectionStatus === 'connected' && (
            <Badge variant="success">Connected</Badge>
          )}
          {connectionStatus === 'connecting' && (
            <Badge variant="warning">Connecting...</Badge>
          )}
          {connectionStatus === 'error' && (
            <Badge variant="error">Error</Badge>
          )}
          {connectionStatus === 'idle' && (
            <Badge variant="secondary">Not Connected</Badge>
          )}
        </div>
      </div>

      {connectionStatus === 'connecting' && (
        <div className="space-y-2 mb-4">
          <Progress value={30} />
          <p className="text-sm text-slate-500">Connecting to Telegram Ads...</p>
        </div>
      )}

      {connectionStatus === 'error' && error && (
        <Alert variant="error" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <h4 className="text-md font-medium text-white mb-2">Features</h4>
          <ul className="text-sm text-slate-500 space-y-1">
            <li>⚠️ Manual campaign creation (MVP)</li>
            <li>⚠️ Limited API integration</li>
            <li>⚠️ Future: Full API support</li>
            <li>⚠️ Channel-based advertising</li>
          </ul>
        </div>

        <div className="flex gap-2">
          {!isConnected ? (
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Telegram Ads'}
            </Button>
          ) : (
            <Button 
              variant="secondary" 
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export function PlatformConnectionManager() {
  const [connections, setConnections] = useState({
    meta: false,
    google: false,
    yandex: false,
    telegram: false
  })

  const [connecting, setConnecting] = useState<string | null>(null)

  const handleConnect = (platform: string) => {
    setConnecting(platform)
    
    // Simulate connection delay
    setTimeout(() => {
      setConnections(prev => ({ ...prev, [platform]: true }))
      setConnecting(null)
    }, 2000)
  }

  const handleDisconnect = (platform: string) => {
    setConnections(prev => ({ ...prev, [platform]: false }))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Platform Connections</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetaAdsAdapter
          platform="meta"
          isConnected={connections.meta}
          isConnecting={connecting === 'meta'}
          onConnect={() => handleConnect('meta')}
          onDisconnect={() => handleDisconnect('meta')}
        />
        
        <GoogleAdsAdapter
          platform="google"
          isConnected={connections.google}
          isConnecting={connecting === 'google'}
          onConnect={() => handleConnect('google')}
          onDisconnect={() => handleDisconnect('google')}
        />
        
        <YandexDirectAdapter
          platform="yandex"
          isConnected={connections.yandex}
          isConnecting={connecting === 'yandex'}
          onConnect={() => handleConnect('yandex')}
          onDisconnect={() => handleDisconnect('yandex')}
        />
        
        <TelegramAdsAdapter
          platform="telegram"
          isConnected={connections.telegram}
          isConnecting={connecting === 'telegram'}
          onConnect={() => handleConnect('telegram')}
          onDisconnect={() => handleDisconnect('telegram')}
        />
      </div>

      {/* Connection Summary */}
      <Card padding="lg">
        <h3 className="text-lg font-semibold text-white mb-4">Connection Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(connections).map(([platform, connected]) => (
            <div key={platform} className="text-center">
              <div className={`text-2xl mb-2 ${
                connected ? 'text-green-400' : 'text-slate-500'
              }`}>
                {platform === 'meta' && '📘'}
                {platform === 'google' && '🔍'}
                {platform === 'yandex' && '📘'}
                {platform === 'telegram' && '✈️'}
              </div>
              <div className="text-white font-medium capitalize">{platform}</div>
              <div className={`text-sm ${
                connected ? 'text-green-400' : 'text-slate-500'
              }`}>
                {connected ? 'Connected' : 'Not Connected'}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
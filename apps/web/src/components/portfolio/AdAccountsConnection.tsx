'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, Check, Plus, Trash2, RefreshCw } from 'lucide-react';

interface ConnectedAccount {
  id: string;
  platform: 'meta' | 'google' | 'yandex';
  accountName: string;
  accountId: string;
  status: 'connected' | 'disconnected' | 'pending' | 'error';
  lastSync?: Date;
  metricsCount?: number;
  errorMessage?: string;
}

interface AdAccountsConnectionProps {
  onAccountConnected?: (account: ConnectedAccount) => void;
  onAccountDisconnected?: (accountId: string) => void;
  onSync?: (accountId: string) => Promise<void>;
}

const platformConfig = {
  meta: {
    name: 'Meta Ads',
    color: 'bg-blue-600',
    icon: '🔵',
    description: 'Facebook va Instagram reklama hisoblarini ulash',
  },
  google: {
    name: 'Google Ads',
    color: 'bg-blue-500',
    icon: '🔍',
    description: 'Google Ads reklama kampaniyalarini ulash',
  },
  yandex: {
    name: 'Yandex Direct',
    color: 'bg-red-600',
    icon: '🔴',
    description: 'Yandex Direct reklama hisoblarini ulash',
  },
};

const statusConfig = {
  connected: { label: 'Ulangan', color: 'bg-green-100 text-green-800' },
  disconnected: { label: 'Ulanmagan', color: 'bg-gray-100 text-gray-800' },
  pending: { label: 'Kutilmoqda', color: 'bg-yellow-100 text-yellow-800' },
  error: { label: 'Xato', color: 'bg-red-100 text-red-800' },
};

export const AdAccountsConnection: React.FC<AdAccountsConnectionProps> = ({
  onAccountConnected,
  onAccountDisconnected,
  onSync,
}) => {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  useEffect(() => {
    loadConnectedAccounts();
  }, []);

  const loadConnectedAccounts = async () => {
    setLoading(true);
    try {
      // TODO: Fetch from API
      // const response = await fetch('/api/connected-accounts');
      // const data = await response.json();
      // setAccounts(data);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (platform: 'meta' | 'google' | 'yandex') => {
    // TODO: Implement OAuth flow
    window.location.href = `/api/auth/${platform}/connect?redirect=/portfolio`;
  };

  const handleDisconnect = async (accountId: string) => {
    if (window.confirm('Bu hisobni unashtirmoqchisiz?')) {
      try {
        // TODO: Call disconnect API
        setAccounts(accounts.filter((acc) => acc.id !== accountId));
        onAccountDisconnected?.(accountId);
      } catch (error) {
        console.error('Failed to disconnect account:', error);
      }
    }
  };

  const handleSync = async (accountId: string) => {
    setSyncing(accountId);
    try {
      await onSync?.(accountId);
      loadConnectedAccounts();
    } finally {
      setSyncing(null);
    }
  };

  const connectedPlatforms = new Set(accounts.map((acc) => acc.platform));
  const availablePlatforms = (['meta', 'google', 'yandex'] as const).filter(
    (p) => !connectedPlatforms.has(p),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reklama Hisoblarini Ulash</h2>
        <p className="mt-2 text-gray-600">
          Meta, Google va Yandex reklama hisoblarini ulang va real vaqtda ma'lumotlarni kuzating
        </p>
      </div>

      {/* Connected Accounts */}
      {accounts.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Ulangan Hisoblar</h3>
          <div className="space-y-4">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${platformConfig[account.platform].color}`}>
                    <span className="text-xl">{platformConfig[account.platform].icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        {platformConfig[account.platform].name}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${statusConfig[account.status].color}`}
                      >
                        {statusConfig[account.status].label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{account.accountName}</p>
                    {account.lastSync && (
                      <p className="text-xs text-gray-500 mt-1">
                        Oxirgi sinkronizasyon: {new Date(account.lastSync).toLocaleString('uz-UZ')}
                      </p>
                    )}
                    {account.errorMessage && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle size={14} /> {account.errorMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {account.metricsCount !== undefined && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{account.metricsCount}</p>
                      <p className="text-xs text-gray-600">kampaniya</p>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSync(account.id)}
                    disabled={syncing === account.id}
                    title="Sinkronizasyon"
                  >
                    <RefreshCw size={16} className={syncing === account.id ? 'animate-spin' : ''} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect(account.id)}
                    className="text-red-600 hover:bg-red-50"
                    title="Unashtirish"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Connection Status Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        {(['meta', 'google', 'yandex'] as const).map((platform) => {
          const account = accounts.find((acc) => acc.platform === platform);
          const isConnected = account && account.status === 'connected';

          return (
            <Card
              key={platform}
              className={`p-6 transition-all ${
                isConnected ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${platformConfig[platform].color}`}>
                    <span className="text-lg">{platformConfig[platform].icon}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{platformConfig[platform].name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{platformConfig[platform].description}</p>
                  </div>
                </div>
                {isConnected && <Check size={20} className="text-green-600" />}
              </div>

              {isConnected ? (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSync(account.id)}
                    disabled={syncing === account.id}
                    className="w-full"
                  >
                    <RefreshCw size={14} />
                    Yangilash
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => handleConnect(platform)}
                  disabled={loading}
                  className="mt-4 w-full"
                >
                  <Plus size={16} />
                  Ulash
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {/* Integration Info */}
      <Card className="border-blue-200 bg-blue-50 p-6">
        <div className="flex gap-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Ma'lumot</h4>
            <p className="mt-2 text-sm text-blue-800">
              Ulangan hisoblaringizdan real vaqtda ma'lumotlar olinadi va Dashboard'da ko'rsatiladi.
              Har kuni avtomatik ravishda sinkronizasyon bo'ladi. Xavfsizlik uchun API kalitlar shifrlangan
              holda saqlanadi.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdAccountsConnection;

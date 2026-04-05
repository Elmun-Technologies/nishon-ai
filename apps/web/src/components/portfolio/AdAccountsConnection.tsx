'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, Check, ArrowRight, RotateCcw } from 'lucide-react';

type PlatformType = 'meta' | 'google' | 'yandex';
type StepType = 'select' | 'connect' | 'success';

interface ConnectedAccount {
  platform: PlatformType;
  accountName: string;
  accountId: string;
  status: 'connected' | 'pending' | 'error';
  lastSync?: Date;
}

interface AdAccountsConnectionProps {
  onComplete?: () => void;
}

const platformInfo = {
  meta: {
    name: 'Meta (Facebook/Instagram)',
    icon: '🔵',
    description: 'Facebook va Instagram reklama hisoblarini ulash',
    details: 'Facebookda, Instagramda, Messenger va Audience Network da kampaniyalar yuborish',
    color: 'blue',
    requiredScopes: ['ads_management', 'analytics'],
  },
  google: {
    name: 'Google Ads',
    icon: '🔍',
    description: 'Google Ads reklama kampaniyalarini ulash',
    details: 'Qidiruv, Display va Smart kampaniyalarni boshqarish',
    color: 'blue',
    requiredScopes: ['googleads'],
  },
  yandex: {
    name: 'Yandex Direct',
    icon: '🟡',
    description: 'Yandex reklama hisoblarini ulash',
    details: 'Yandex-da qidiruv va reklama kampaniyalarini boshqarish',
    color: 'amber',
    requiredScopes: ['yandex_direct'],
  },
};

export const AdAccountsConnection: React.FC<AdAccountsConnectionProps> = ({ onComplete }) => {
  const [step, setStep] = useState<StepType>('select');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlatform = (platform: PlatformType) => {
    setSelectedPlatform(platform);
    setError(null);
    setStep('connect');
  };

  const handleConnect = async (platform: PlatformType) => {
    setLoading(true);
    setError(null);
    try {
      // Redirect to OAuth
      const redirectUrl = `/api/auth/${platform}/callback?return=/portfolio`;
      window.location.href = `/api/auth/${platform}?redirect=${encodeURIComponent(redirectUrl)}`;
    } catch (err) {
      setError('Ulanishda xato yuz berdi. Qayta urinib ko\'ring.');
      setLoading(false);
    }
  };

  const handleBackToSelect = () => {
    setStep('select');
    setSelectedPlatform(null);
    setError(null);
  };

  const connectedPlatforms = connectedAccounts.map((acc) => acc.platform);
  const availablePlatforms = (['meta', 'google', 'yandex'] as const).filter(
    (p) => !connectedPlatforms.includes(p),
  );

  // ── STEP 1: PLATFORM SELECTION ──
  if (step === 'select') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Qaysi platform uchun hisobni ulaysiz?</h3>
          <p className="text-gray-600 text-sm">
            Reklama hisobingizni Performa platformasiga ulang va real vaqtda ma'lumotlarni kuzating
          </p>
        </div>

        {/* Already Connected Accounts */}
        {connectedAccounts.length > 0 && (
          <Card className="border-green-200 bg-green-50 p-4">
            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
              <Check size={18} /> Ulangan hisoblar ({connectedAccounts.length}/3)
            </h4>
            <div className="space-y-2">
              {connectedAccounts.map((acc) => (
                <div key={acc.platform} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-green-200">
                  <span className="text-sm">
                    {platformInfo[acc.platform].icon} {platformInfo[acc.platform].name}
                  </span>
                  <Badge className="bg-green-600">{acc.accountName}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Platform Selection Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {(['meta', 'google', 'yandex'] as const).map((platform) => {
            const isConnected = connectedPlatforms.includes(platform);
            const info = platformInfo[platform];

            return (
              <button
                key={platform}
                onClick={() => !isConnected && handleSelectPlatform(platform)}
                disabled={isConnected}
                className={`text-left transition-all ${
                  isConnected
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-lg hover:border-blue-300 cursor-pointer'
                }`}
              >
                <Card
                  className={`p-6 h-full flex flex-col gap-4 ${
                    isConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-${info.color}-100`}>
                      <span className="text-2xl">{info.icon}</span>
                    </div>
                    {isConnected && <Check size={20} className="text-green-600" />}
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{info.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{info.details}</p>
                  </div>

                  {!isConnected && (
                    <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mt-auto pt-4 border-t border-gray-200">
                      Tanlash <ArrowRight size={16} />
                    </div>
                  )}
                  {isConnected && (
                    <div className="text-green-600 font-semibold text-sm mt-auto pt-4 border-t border-green-200">
                      ✓ Ulangan
                    </div>
                  )}
                </Card>
              </button>
            );
          })}
        </div>

        {availablePlatforms.length === 0 && (
          <Card className="border-green-200 bg-green-50 p-6 text-center">
            <div className="flex justify-center mb-3">
              <Check size={32} className="text-green-600" />
            </div>
            <h4 className="font-bold text-green-900 mb-2">Barcha hisoblar ulangan!</h4>
            <p className="text-green-700 text-sm mb-4">
              Siz Meta, Google va Yandex reklama hisoblarini ulagan bo'lsangiz, davom etishingiz mumkin.
            </p>
            <Button onClick={onComplete} className="w-full">
              Davom etish →
            </Button>
          </Card>
        )}
      </div>
    );
  }

  // ── STEP 2: CONNECTION FLOW ──
  if (step === 'connect' && selectedPlatform) {
    const info = platformInfo[selectedPlatform];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToSelect}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            ← Orqaga
          </Button>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {info.icon} {info.name} ni ulash
          </h3>
          <p className="text-gray-600">{info.description}</p>
        </div>

        {/* Connection Card */}
        <Card className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-${info.color}-100`}>
              <span className="text-4xl">{info.icon}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">Tayyor?</h4>
            <p className="text-gray-600 text-sm">
              Quyidagi tugmani bosing va {info.name} hisobingizga kirish ruxsatini bering.
              <br />
              Ruxsat berilgandan so'ng avtomatik ravishda qaytasiz.
            </p>
          </div>

          {error && (
            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 text-sm">{error}</p>
              </div>
            </div>
          )}

          <Button
            onClick={() => handleConnect(selectedPlatform)}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block mr-2">⏳</span>
                Yuborilmoqda...
              </>
            ) : (
              <>
                {info.icon} {info.name} ga ulanish
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500">
            🔒 Sizning ma'lumotlaringiz xavfsiz. Biz faqat reklama hisoblarini boshqarish uchun kirish kerak.
          </p>
        </Card>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50 p-6">
          <div className="flex gap-4">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Nima bo'ladi?</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Sizning {info.name} hisobiga xavfli ulanish o'rnatiladi</li>
                <li>Reklama ma'lumotlari avtomatik ravishda sinxronizasiya bo'ladi</li>
                <li>Portfolio'da real vaqtda natijalar ko'rsatiladi</li>
                <li>Biz sizning reklama budjetini boshqarmayiz - faqat ko'rish uchun kiramiz</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default AdAccountsConnection;

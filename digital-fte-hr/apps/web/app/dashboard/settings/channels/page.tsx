'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Mail, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ChannelData {
  whatsapp: { connected: boolean; phoneNumber: string; verified: boolean };
  telegram: { connected: boolean; botName: string; verified: boolean };
  email: { connected: boolean; email: string; verified: boolean };
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<ChannelData>({
    whatsapp: { connected: false, phoneNumber: '', verified: false },
    telegram: { connected: false, botName: '', verified: false },
    email: { connected: true, email: '', verified: true },
  });

  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const [showTelegramForm, setShowTelegramForm] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [telegramBot, setTelegramBot] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load channel status on mount
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
        const token = auth ? JSON.parse(auth).access_token : null;

        const response = await fetch('/api/v1/settings/channels', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        const data = await response.json();
        if (data.success && data.channels) {
          setChannels(data.channels);
        }
      } catch (err) {
        console.error('Failed to load channels:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadChannels();
  }, []);

  const handleConnectWhatsApp = async () => {
    if (!whatsappPhone.trim()) {
      setMessage({ type: 'error', text: '❌ Please enter a phone number' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
    const token = auth ? JSON.parse(auth).access_token : null;

    try {
      const response = await fetch('/api/v1/settings/channels', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'connect',
          channel: 'whatsapp',
          phoneNumber: whatsappPhone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setChannels((prev) => ({
          ...prev,
          whatsapp: { connected: true, phoneNumber: whatsappPhone, verified: true },
        }));
        setWhatsappPhone('');
        setShowWhatsAppForm(false);
        setMessage({ type: 'success', text: '✅ WhatsApp connected successfully!' });
      } else {
        setMessage({ type: 'error', text: '❌ Failed to connect WhatsApp' });
      }
    } catch (err) {
      console.error('Connect error:', err);
      setMessage({ type: 'error', text: '❌ Error connecting WhatsApp' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectTelegram = async () => {
    if (!telegramBot.trim()) {
      setMessage({ type: 'error', text: '❌ Please enter a Telegram bot name' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
    const token = auth ? JSON.parse(auth).access_token : null;

    try {
      const response = await fetch('/api/v1/settings/channels', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'connect',
          channel: 'telegram',
          botName: telegramBot,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setChannels((prev) => ({
          ...prev,
          telegram: { connected: true, botName: telegramBot, verified: true },
        }));
        setTelegramBot('');
        setShowTelegramForm(false);
        setMessage({ type: 'success', text: '✅ Telegram connected successfully!' });
      } else {
        setMessage({ type: 'error', text: '❌ Failed to connect Telegram' });
      }
    } catch (err) {
      console.error('Connect error:', err);
      setMessage({ type: 'error', text: '❌ Error connecting Telegram' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async (channel: string) => {
    setIsSaving(true);
    setMessage(null);

    const auth = localStorage.getItem('sb-wtjupktgosmtizkxlita-auth-token');
    const token = auth ? JSON.parse(auth).access_token : null;

    try {
      const response = await fetch('/api/v1/settings/channels', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'disconnect',
          channel,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setChannels((prev) => ({
          ...prev,
          [channel]: { ...(prev[channel as keyof typeof prev] || {}), connected: false, verified: false },
        }));
        setMessage({ type: 'success', text: `✅ ${channel} disconnected` });
      }
    } catch (err) {
      console.error('Disconnect error:', err);
      setMessage({ type: 'error', text: '❌ Error disconnecting channel' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Communication Channels</h1>
        <p className="mt-1 text-gray-600">
          Connect your preferred channels to receive job alerts and updates
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* WhatsApp */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">WhatsApp</h3>
              <p className="text-sm text-gray-600 mt-1">Get job alerts on WhatsApp</p>

              {channels.whatsapp.connected ? (
                <div className="mt-3 flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700">
                    <Check className="w-4 h-4 mr-1" /> Connected
                  </Badge>
                  <span className="text-sm text-gray-600">{channels.whatsapp.phoneNumber}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-600 mt-3">Not connected</p>
              )}

              {channels.whatsapp.connected && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDisconnect('whatsapp')}
                    disabled={isSaving}
                  >
                    Disconnect
                  </Button>
                </div>
              )}

              {!channels.whatsapp.connected && !showWhatsAppForm && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setShowWhatsAppForm(true)}
                  >
                    <Send className="w-4 h-4 mr-2" /> Connect WhatsApp
                  </Button>
                </div>
              )}

              {!channels.whatsapp.connected && showWhatsAppForm && (
                <div className="mt-4 space-y-3">
                  <Input
                    type="tel"
                    placeholder="+971 50 123 4567"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className="mt-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleConnectWhatsApp}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Connecting...' : 'Connect'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowWhatsAppForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Telegram */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Telegram</h3>
              <p className="text-sm text-gray-600 mt-1">Get job alerts on Telegram</p>

              {channels.telegram.connected ? (
                <div className="mt-3 flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700">
                    <Check className="w-4 h-4 mr-1" /> Connected
                  </Badge>
                  <span className="text-sm text-gray-600">@{channels.telegram.botName}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-600 mt-3">Not connected</p>
              )}

              {channels.telegram.connected && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDisconnect('telegram')}
                    disabled={isSaving}
                  >
                    Disconnect
                  </Button>
                </div>
              )}

              {!channels.telegram.connected && !showTelegramForm && (
                <div className="mt-4">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => setShowTelegramForm(true)}
                  >
                    <Send className="w-4 h-4 mr-2" /> Connect Telegram
                  </Button>
                </div>
              )}

              {!channels.telegram.connected && showTelegramForm && (
                <div className="mt-4 space-y-3">
                  <Input
                    type="text"
                    placeholder="@your_bot_name"
                    value={telegramBot}
                    onChange={(e) => setTelegramBot(e.target.value)}
                    className="mt-2"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleConnectTelegram}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Connecting...' : 'Connect'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowTelegramForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Email */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Email</h3>
              <p className="text-sm text-gray-600 mt-1">Receive job alerts via email</p>

              {channels.email.connected && (
                <div className="mt-3 flex items-center gap-2">
                  <Badge className="bg-purple-100 text-purple-700">
                    <Check className="w-4 h-4 mr-1" /> Connected
                  </Badge>
                  <span className="text-sm text-gray-600">{channels.email.email}</span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">Email is your primary contact method and cannot be disconnected</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

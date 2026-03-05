'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Mail, Check, X } from 'lucide-react';

export default function ChannelsPage() {
  const [channels, setChannels] = useState({
    whatsapp: { connected: false, phoneNumber: '', verified: false },
    telegram: { connected: false, botName: '', verified: false },
    email: { connected: true, email: 'syedfaisalhassan7@gmail.com', verified: true },
  });

  const [showWhatsAppForm, setShowWhatsAppForm] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('');

  const handleConnectWhatsApp = () => {
    if (whatsappPhone.trim()) {
      setChannels((prev) => ({
        ...prev,
        whatsapp: {
          ...prev.whatsapp,
          phoneNumber: whatsappPhone,
          connected: true,
          verified: false,
        },
      }));
      setWhatsappPhone('');
      setShowWhatsAppForm(false);
      // Simulate verification
      setTimeout(() => {
        setChannels((prev) => ({
          ...prev,
          whatsapp: { ...prev.whatsapp, verified: true },
        }));
      }, 2000);
    }
  };

  const handleDisconnect = (channel: string) => {
    setChannels((prev) => ({
      ...prev,
      [channel]: {
        ...prev[channel as keyof typeof prev],
        connected: false,
        verified: false,
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Communication Channels</h1>
        <p className="mt-1 text-gray-600">
          Connect your preferred channels to receive job alerts and updates
        </p>
      </div>

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
                  <Badge
                    className={
                      channels.whatsapp.verified
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }
                  >
                    {channels.whatsapp.verified ? 'Connected' : 'Verifying...'}
                  </Badge>
                  <span className="text-sm text-gray-600">{channels.whatsapp.phoneNumber}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-3">Not connected</p>
              )}
            </div>
          </div>

          <div>
            {channels.whatsapp.connected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect('whatsapp')}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-[#00F0A0] hover:bg-[#00D68A] text-black"
                onClick={() => setShowWhatsAppForm(!showWhatsAppForm)}
              >
                Connect
              </Button>
            )}
          </div>
        </div>

        {showWhatsAppForm && !channels.whatsapp.connected && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Phone Number (E.164 format)
              </label>
              <Input
                placeholder="+971501234567"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">Include country code (e.g., +1, +971)</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleConnectWhatsApp}
                className="bg-[#00F0A0] hover:bg-[#00D68A] text-black"
              >
                Send Verification Code
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowWhatsAppForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
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
              <p className="text-sm text-gray-600 mt-1">Instant job alerts via Telegram</p>

              {channels.telegram.connected ? (
                <div className="mt-3 flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700">Connected</Badge>
                  <span className="text-sm text-gray-600">@jobbot123</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-3">Not connected</p>
              )}
            </div>
          </div>

          <div>
            {channels.telegram.connected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDisconnect('telegram')}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-[#00F0A0] hover:bg-[#00D68A] text-black"
                onClick={() => console.log('Open Telegram bot')}
              >
                <Send className="w-4 h-4 mr-2" />
                Open Bot
              </Button>
            )}
          </div>
        </div>

        {!channels.telegram.connected && (
          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <p className="text-sm text-gray-600">
              Click the button above to open our Telegram bot and connect your account.
            </p>
            <p className="text-xs text-gray-500">
              Bot: @DigitalFTE_JobBot | Command: /start
            </p>
          </div>
        )}
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
              <p className="text-sm text-gray-600 mt-1">Receive updates via email</p>

              {channels.email.connected ? (
                <div className="mt-3 flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700">Connected</Badge>
                  <span className="text-sm text-gray-600">{channels.email.email}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-3">Not connected</p>
              )}
            </div>
          </div>

          <div>
            <Badge className="bg-gray-100 text-gray-700">Default</Badge>
          </div>
        </div>
      </Card>

      {/* Channel Status Summary */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-bold text-gray-900 mb-3">Connected Channels</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            {channels.whatsapp.verified ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <X className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-sm text-gray-700">WhatsApp</span>
          </div>
          <div className="flex items-center gap-2">
            {channels.telegram.connected ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <X className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-sm text-gray-700">Telegram</span>
          </div>
          <div className="flex items-center gap-2">
            {channels.email.verified ? (
              <Check className="w-5 h-5 text-green-600" />
            ) : (
              <X className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-sm text-gray-700">Email</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

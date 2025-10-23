import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const BACKEND_URL = 'https://n8n210980.hostkey.in';

const WebhookTester = () => {
  const [results, setResults] = useState({});
  const [testing, setTesting] = useState(false);

  const webhooks = [
    { name: 'Schedule GET', url: '/webhook/gb/schedule', method: 'GET' },
    { name: 'Schedule POST', url: '/webhook/gb/schedule', method: 'POST' },
    { name: 'ToggleBot Status', url: '/webhook/gb/togglebot/status', method: 'GET' },
    { name: 'ToggleBot Toggle', url: '/webhook/gb/togglebot/toggle', method: 'POST' },
    { name: 'Mailing Config GET', url: '/webhook/gb/mailing/config', method: 'GET' },
    { name: 'Mailing Config POST', url: '/webhook/gb/mailing/config', method: 'POST' },
    { name: 'Statistics', url: '/webhook/gb/statistics/getstatistics', method: 'POST' },
    { name: 'Chats', url: '/webhook/gb/statistics/chats', method: 'GET' }
  ];

  const testWebhook = async (webhook) => {
    try {
      const config = {
        method: webhook.method,
        url: `${BACKEND_URL}${webhook.url}`,
        timeout: 5000
      };

      if (webhook.method === 'POST') {
        config.data = webhook.name.includes('Statistics') 
          ? { start_date: new Date().toISOString(), end_date: new Date().toISOString() }
          : { test: true };
      }

      const startTime = Date.now();
      const response = await axios(config);
      const endTime = Date.now();

      setResults(prev => ({
        ...prev,
        [webhook.name]: {
          status: 'success',
          statusCode: response.status,
          responseTime: endTime - startTime,
          data: response.data
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [webhook.name]: {
          status: 'error',
          statusCode: error.response?.status || 'No response',
          error: error.message,
          code: error.code
        }
      }));
    }
  };

  const testAllWebhooks = async () => {
    setTesting(true);
    setResults({});

    for (const webhook of webhooks) {
      await testWebhook(webhook);
      // Небольшая пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setTesting(false);
  };

  const getStatusIcon = (result) => {
    if (!result) return <Clock className="h-4 w-4 text-gray-400" />;
    if (result.status === 'success') return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (result) => {
    if (!result) return <Badge variant="secondary">Не тестирован</Badge>;
    if (result.status === 'success') return <Badge variant="default" className="bg-green-500">Успешно</Badge>;
    return <Badge variant="destructive">Ошибка</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Тестирование Webhook'ов</h2>
        <Button 
          onClick={testAllWebhooks} 
          disabled={testing}
          className="bg-zhb-primary hover:bg-zhb-primary/90"
        >
          {testing ? 'Тестирование...' : 'Тестировать все'}
        </Button>
      </div>

      <div className="grid gap-3">
        {webhooks.map((webhook) => {
          const result = results[webhook.name];
          return (
            <Card key={webhook.name} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(result)}
                    <div>
                      <h3 className="font-medium">{webhook.name}</h3>
                      <p className="text-sm text-gray-500">
                        {webhook.method} {webhook.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(result)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testWebhook(webhook)}
                      disabled={testing}
                    >
                      Тест
                    </Button>
                  </div>
                </div>
                
                {result && (
                  <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                    {result.status === 'success' ? (
                      <div>
                        <p><strong>Статус:</strong> {result.statusCode}</p>
                        <p><strong>Время ответа:</strong> {result.responseTime}ms</p>
                        {result.data && (
                          <p><strong>Данные:</strong> {JSON.stringify(result.data).substring(0, 100)}...</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p><strong>Ошибка:</strong> {result.error}</p>
                        <p><strong>Код:</strong> {result.code}</p>
                        <p><strong>Статус:</strong> {result.statusCode}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WebhookTester;

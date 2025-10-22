import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Clock, Save, Calendar as CalendarIcon, Info, Copy } from 'lucide-react';

const BACKEND_URL = 'https://n8n210980.hostkey.in';
const DAYS = [
  { value: 1, label: 'Понедельник' },
  { value: 2, label: 'Вторник' },
  { value: 3, label: 'Среда' },
  { value: 4, label: 'Четверг' },
  { value: 5, label: 'Пятница' },
  { value: 6, label: 'Суббота' },
  { value: 0, label: 'Воскресенье' }
];

const BotSchedule = () => {
  const [schedule, setSchedule] = useState({});
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/webhook/gb/schedule`);
      
      const data = response.data;
      setScheduleEnabled(data.scheduleEnabled || false);
      
      // Инициализация расписания по умолчанию, если нет данных
      const defaultSchedule = DAYS.reduce((acc, day) => ({
        ...acc,
        [day.value]: {
          enabled: day.value >= 1 && day.value <= 5, // пн-пт включены по умолчанию
          startTime: '09:00',
          endTime: '18:00'
        }
      }), {});
      
      setSchedule(data.schedule || defaultSchedule);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить расписание. Используются значения по умолчанию.",
        variant: "destructive",
      });
      
      // Fallback: установим расписание по умолчанию
      const defaultSchedule = DAYS.reduce((acc, day) => ({
        ...acc,
        [day.value]: {
          enabled: day.value >= 1 && day.value <= 5,
          startTime: '09:00',
          endTime: '18:00'
        }
      }), {});
      setSchedule(defaultSchedule);
      setScheduleEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  const updateDaySchedule = (dayValue, field, value) => {
    setSchedule(prev => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        [field]: value
      }
    }));
  };

  const saveSchedule = async () => {
    try {
      setSaving(true);
      await axios.post(`${BACKEND_URL}/webhook/gb/schedule`, {
        scheduleEnabled: scheduleEnabled,
        schedule: schedule
      });
      
      toast({
        title: "Успешно",
        description: "Расписание сохранено",
      });
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить расписание",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToAll = (sourceDay) => {
    const sourceSchedule = schedule[sourceDay];
    const newSchedule = { ...schedule };
    
    DAYS.forEach(day => {
      newSchedule[day.value] = { ...sourceSchedule };
    });
    
    setSchedule(newSchedule);
    toast({
      title: "Скопировано",
      description: "Расписание применено ко всем дням",
    });
  };

  const getCurrentStatus = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const daySchedule = schedule[currentDay];
    if (!daySchedule) return null;
    
    const shouldBeActive = scheduleEnabled && daySchedule.enabled && 
      currentTime >= daySchedule.startTime && 
      currentTime <= daySchedule.endTime;
    
    const dayName = DAYS.find(d => d.value === currentDay)?.label || 'Неизвестно';
    
    return {
      dayName,
      currentTime,
      shouldBeActive,
      enabled: daySchedule.enabled
    };
  };

  const status = getCurrentStatus();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zhb-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Расписание работы бота</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Настройте часы работы для каждого дня недели</p>
        </div>
        <Button 
          onClick={saveSchedule}
          disabled={saving}
          className="bg-zhb-primary hover:bg-zhb-primary/90 w-full sm:w-auto"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>

      {/* Auto Mode Toggle */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <Switch
                  checked={scheduleEnabled}
                  onCheckedChange={setScheduleEnabled}
                  className="data-[state=checked]:bg-zhb-primary"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Автоматический режим</h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {scheduleEnabled 
                      ? 'Бот будет включаться/выключаться по расписанию' 
                      : 'Бот управляется только вручную'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      {status && (
        <Card className={`border-0 shadow-sm ${scheduleEnabled ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className={`h-5 w-5 mt-0.5 flex-shrink-0 ${scheduleEnabled ? 'text-blue-600' : 'text-gray-500'}`} />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900">Текущий статус</h4>
                <div className="text-sm text-gray-700 mt-1 space-y-0.5">
                  <p>Сейчас: {status.dayName}, {status.currentTime}</p>
                  {scheduleEnabled ? (
                    <p>
                      Бот: {status.shouldBeActive ? (
                        <span className="text-green-600 font-medium">🟢 Должен быть включен</span>
                      ) : (
                        <span className="text-gray-600 font-medium">⚪ Должен быть выключен</span>
                      )}
                      {!status.enabled && ' (день выключен в расписании)'}
                    </p>
                  ) : (
                    <p className="text-gray-600">Авто-режим выключен, бот управляется вручную</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Table */}
      <div className="grid gap-3 sm:gap-4">
        {DAYS.map((day) => (
          <Card key={day.value} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col space-y-4">
                {/* Day header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <Switch
                      checked={schedule[day.value]?.enabled || false}
                      onCheckedChange={(checked) => updateDaySchedule(day.value, 'enabled', checked)}
                      className="data-[state=checked]:bg-zhb-primary"
                    />
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-zhb-primary" />
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">{day.label}</span>
                    </div>
                  </div>
                  
                  {/* Copy button - visible on desktop */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToAll(day.value)}
                    className="hidden sm:flex text-xs"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Копировать на все дни
                  </Button>
                </div>

                {/* Time inputs */}
                {schedule[day.value]?.enabled && (
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pl-0 sm:pl-12">
                    <div className="flex items-center space-x-2 flex-1">
                      <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 w-16">Начало:</span>
                      <input
                        type="time"
                        value={schedule[day.value]?.startTime || '09:00'}
                        onChange={(e) => updateDaySchedule(day.value, 'startTime', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-zhb-primary focus:ring-1 focus:ring-zhb-primary"
                      />
                    </div>
                    <div className="flex items-center space-x-2 flex-1">
                      <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600 w-16">Конец:</span>
                      <input
                        type="time"
                        value={schedule[day.value]?.endTime || '18:00'}
                        onChange={(e) => updateDaySchedule(day.value, 'endTime', e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1.5 text-sm focus:border-zhb-primary focus:ring-1 focus:ring-zhb-primary"
                      />
                    </div>
                    
                    {/* Copy button - visible on mobile */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToAll(day.value)}
                      className="sm:hidden text-xs w-full"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Копировать на все дни
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200 border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Как это работает
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs sm:text-sm text-gray-700">
          <ul className="list-disc list-inside space-y-1">
            <li>Бот будет автоматически включаться в начале рабочего времени</li>
            <li>Бот будет автоматически выключаться в конце рабочего времени</li>
            <li>Если день выключен, бот не будет работать в этот день</li>
            <li>Все изменения применяются после нажатия кнопки "Сохранить"</li>
            <li>Проверка расписания происходит каждую минуту</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default BotSchedule;


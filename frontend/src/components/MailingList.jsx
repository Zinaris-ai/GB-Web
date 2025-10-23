import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from './ui/table';
import { 
  Upload, 
  Clock, 
  Calendar, 
  Timer, 
  FileText, 
  Save,
  Settings
} from 'lucide-react';

const BACKEND_URL = 'https://n8n210980.hostkey.in';

const MailingList = () => {
  const [mailingConfig, setMailingConfig] = useState({
    contactsFile: null,
    fileName: '',
    mailingTime: '09:00',
    mailingDays: {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: false,
      sunday: false
    },
    pauseBetweenClients: 30
  });
  
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMailingConfig();
  }, []);

  const fetchMailingConfig = async () => {
    try {
      setLoading(true);
      console.log('Fetching mailing config from:', `${BACKEND_URL}/webhook/gb/mailing/config`);
      
      const response = await axios.get(`${BACKEND_URL}/webhook/gb/mailing/config`, {
        timeout: 10000 // 10 секунд таймаут
      });
      
      console.log('Mailing config response:', response.data);
      
      if (response.data) {
        setMailingConfig(prev => ({
          ...prev,
          ...response.data
        }));
        
        toast({
          title: "Успешно",
          description: "Настройки рассылки загружены",
        });
      }
    } catch (error) {
      console.error('Error fetching mailing config:', error);
      
      // Более детальная диагностика ошибки
      let errorMessage = "Не удалось загрузить настройки рассылки. Используются значения по умолчанию.";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = "Таймаут соединения. Проверьте доступность сервера.";
      } else if (error.response?.status === 404) {
        errorMessage = "Webhook рассылки не найден. Создайте workflow в n8n.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Ошибка сервера. Попробуйте позже.";
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = "Проблема с сетью. Проверьте подключение.";
      }
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];
    
    for (let i = 1; i < Math.min(lines.length, 101); i++) { // Показываем максимум 100 строк
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }
    
    return { headers, data };
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setMailingConfig(prev => ({
        ...prev,
        contactsFile: file,
        fileName: file.name
      }));
      
      // Парсим CSV для отображения в таблице
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const { headers, data } = parseCSV(e.target.result);
          setContacts(data);
          toast({
            title: "Файл загружен",
            description: `Файл ${file.name} готов к обработке. Найдено ${data.length} контактов`,
          });
        } catch (error) {
          toast({
            title: "Ошибка",
            description: "Не удалось прочитать CSV файл",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const updateMailingDays = (day, checked) => {
    setMailingConfig(prev => ({
      ...prev,
      mailingDays: {
        ...prev.mailingDays,
        [day]: checked
      }
    }));
  };

  const saveMailingConfig = async () => {
    try {
      setSaving(true);
      console.log('Saving mailing config to:', `${BACKEND_URL}/webhook/gb/mailing/config`);
      
      const formData = new FormData();
      formData.append('mailingTime', mailingConfig.mailingTime);
      formData.append('mailingDays', JSON.stringify(mailingConfig.mailingDays));
      formData.append('pauseBetweenClients', mailingConfig.pauseBetweenClients);
      
      if (mailingConfig.contactsFile) {
        formData.append('contactsFile', mailingConfig.contactsFile);
      }
      
      const response = await axios.post(`${BACKEND_URL}/webhook/gb/mailing/config`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 15000 // 15 секунд для загрузки файла
      });
      
      console.log('Save mailing config response:', response.data);
      
      toast({
        title: "Успешно",
        description: "Настройки рассылки сохранены",
      });
    } catch (error) {
      console.error('Error saving mailing config:', error);
      
      // Более детальная диагностика ошибки сохранения
      let errorMessage = "Не удалось сохранить настройки рассылки";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = "Таймаут соединения при сохранении";
      } else if (error.response?.status === 404) {
        errorMessage = "Webhook для сохранения рассылки не найден";
      } else if (error.response?.status >= 500) {
        errorMessage = "Ошибка сервера при сохранении";
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = "Проблема с сетью при сохранении";
      }
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zhb-primary"></div>
      </div>
    );
  }

  const days = [
    { key: 'monday', label: 'Понедельник' },
    { key: 'tuesday', label: 'Вторник' },
    { key: 'wednesday', label: 'Среда' },
    { key: 'thursday', label: 'Четверг' },
    { key: 'friday', label: 'Пятница' },
    { key: 'saturday', label: 'Суббота' },
    { key: 'sunday', label: 'Воскресенье' }
  ];

  const tableHeaders = contacts.length > 0 ? Object.keys(contacts[0]) : [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Рассылка</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Настройка автоматической рассылки клиентам</p>
        </div>
        <Button 
          onClick={saveMailingConfig}
          disabled={saving}
          className="bg-zhb-primary hover:bg-zhb-primary/90 w-full sm:w-auto"
        >
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>

      {/* Загрузка файла контактов */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <FileText className="mr-2 h-5 w-5" />
            Файл контактов из Битрикса
          </CardTitle>
          <CardDescription>
            Загрузите CSV файл со списком контактов для рассылки
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contacts-file" className="text-sm font-medium">
              Выберите файл
            </Label>
            <Input
              id="contacts-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="border-gray-200 focus:border-zhb-primary"
            />
            <p className="text-xs text-gray-500">
              Поддерживаемые форматы: CSV
            </p>
            {mailingConfig.fileName && (
              <p className="text-sm text-green-600 font-medium">
                Загружен файл: {mailingConfig.fileName}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Таблица контактов */}
      {contacts.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Upload className="mr-2 h-5 w-5" />
              Загруженные контакты ({contacts.length} записей)
            </CardTitle>
            <CardDescription>
              Превью загруженного файла (показаны первые 100 записей)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {tableHeaders.map((header, index) => (
                      <TableHead key={index} className="text-xs sm:text-sm">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.slice(0, 50).map((contact, index) => (
                    <TableRow key={index}>
                      {tableHeaders.map((header, headerIndex) => (
                        <TableCell key={headerIndex} className="text-xs sm:text-sm">
                          {contact[header] || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {contacts.length > 50 && (
              <p className="text-xs text-gray-500 mt-2">
                Показаны первые 50 записей из {contacts.length}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Настройки времени и дней */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Время рассылки */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Clock className="mr-2 h-5 w-5" />
              Время рассылки
            </CardTitle>
            <CardDescription>
              Укажите время начала рассылки
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="mailing-time" className="text-sm font-medium">
                Время начала
              </Label>
              <Input
                id="mailing-time"
                type="time"
                value={mailingConfig.mailingTime}
                onChange={(e) => setMailingConfig(prev => ({
                  ...prev,
                  mailingTime: e.target.value
                }))}
                className="border-gray-200 focus:border-zhb-primary"
              />
            </div>
          </CardContent>
        </Card>

        {/* Пауза между клиентами */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Timer className="mr-2 h-5 w-5" />
              Пауза между клиентами
            </CardTitle>
            <CardDescription>
              Интервал между отправкой сообщений
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="pause-between" className="text-sm font-medium">
                Пауза (секунды)
              </Label>
              <Input
                id="pause-between"
                type="number"
                min="1"
                max="3600"
                value={mailingConfig.pauseBetweenClients}
                onChange={(e) => setMailingConfig(prev => ({
                  ...prev,
                  pauseBetweenClients: parseInt(e.target.value) || 30
                }))}
                className="border-gray-200 focus:border-zhb-primary"
              />
              <p className="text-xs text-gray-500">
                Рекомендуется: 30-60 секунд
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Дни рассылки */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Calendar className="mr-2 h-5 w-5" />
            Дни рассылки
          </CardTitle>
          <CardDescription>
            Выберите дни недели для проведения рассылки
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {days.map((day) => (
              <div key={day.key} className="flex items-center space-x-2">
                <Checkbox
                  id={day.key}
                  checked={mailingConfig.mailingDays[day.key]}
                  onCheckedChange={(checked) => updateMailingDays(day.key, checked)}
                />
                <Label
                  htmlFor={day.key}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Информационная карточка */}
      <Card className="bg-blue-50 border-blue-200 border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm sm:text-base flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Как работает рассылка
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs sm:text-sm text-gray-700">
          <ul className="list-disc list-inside space-y-1">
            <li>Рассылка запускается в указанное время в выбранные дни</li>
            <li>Сообщения отправляются с указанной паузой между клиентами</li>
            <li>CSV файл должен содержать колонки с контактными данными</li>
            <li>Рассылка автоматически останавливается после обработки всех контактов</li>
            <li>Все настройки сохраняются и отправляются в n8n workflow</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default MailingList;

import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from '../hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from './ui/table';
import { Upload, FileText, MessageCircle } from 'lucide-react';

const BACKEND_URL = 'https://n8n210980.hostkey.in';
const UPLOAD_TIMEOUT = 60000;
const SUPPORTED_FORMATS = '.csv,.xls,.xlsx';
const MAX_PREVIEW_ROWS = 50;
const createEmptyPreview = () => ({
  headers: [],
  rows: [],
  total: 0,
});

const MailingList = () => {
  const { toast } = useToast();

  const [dealFile, setDealFile] = useState(null);
  const [dealFileName, setDealFileName] = useState('');
  const [dealPreview, setDealPreview] = useState(() => createEmptyPreview());
  const [dealUploading, setDealUploading] = useState(false);

  const [chatFile, setChatFile] = useState(null);
  const [chatFileName, setChatFileName] = useState('');
  const [chatPreview, setChatPreview] = useState(() => createEmptyPreview());
  const [chatUploading, setChatUploading] = useState(false);

  const parseCSV = (csvText) => {
    const lines = csvText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length);

    if (!lines.length) {
      return createEmptyPreview();
    }

    const headers = lines[0]
      .split(',')
      .map((header) => header.trim().replace(/^"|"$/g, '') || 'колонка');

    const rows = [];
    for (let i = 1; i < lines.length; i += 1) {
      const values = lines[i].split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
      const row = {};

      headers.forEach((header, index) => {
        row[header || `column_${index + 1}`] = values[index] || '';
      });

      rows.push(row);
      if (rows.length >= MAX_PREVIEW_ROWS) {
        break;
      }
    }

    return {
      headers,
      rows,
      total: lines.length - 1
    };
  };

  const preparePreview = (file, setPreview) => {
    if (!file) {
      setPreview(createEmptyPreview());
      return;
    }

    const isCSV = file.name.toLowerCase().endsWith('.csv');
    if (!isCSV) {
      setPreview(createEmptyPreview());
      toast({
        title: 'Файл выбран',
        description: `Файл ${file.name} готов к отправке. Предпросмотр доступен только для CSV.`,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const preview = parseCSV(event.target.result);
        setPreview(preview);
        toast({
          title: 'Файл загружен',
          description: `Предпросмотр сформирован. Найдено ${preview.total} строк.`,
        });
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setPreview(createEmptyPreview());
        toast({
          title: 'Ошибка',
          description: 'Не удалось прочитать CSV файл.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (type === 'deal') {
      setDealFile(file);
      setDealFileName(file.name);
      preparePreview(file, setDealPreview);
    } else {
      setChatFile(file);
      setChatFileName(file.name);
      preparePreview(file, setChatPreview);
    }
  };

  const uploadFile = async (type) => {
    const isDeal = type === 'deal';
    const file = isDeal ? dealFile : chatFile;
    const setUploading = isDeal ? setDealUploading : setChatUploading;
    const endpoint = isDeal
      ? '/webhook/gb/gbinitialize/set-deal-list'
      : '/webhook/gb/gbinitialize/set-chat-list';
    const label = isDeal ? 'список сделок' : 'список диалогов';

    if (!file) {
      toast({
        title: 'Файл не выбран',
        description: `Пожалуйста, выберите файл для загрузки (${label}).`,
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('data', file);

    try {
      setUploading(true);
      await axios.post(`${BACKEND_URL}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: UPLOAD_TIMEOUT,
      });

      toast({
        title: 'Файл загружен',
        description: `Успешно отправили ${label} в n8n.`,
      });
    } catch (error) {
      console.error('Upload error:', error);

      let description = 'Не удалось загрузить файл. Попробуйте позже.';
      if (error.code === 'ECONNABORTED') {
        description = 'Таймаут загрузки. Попробуйте ещё раз.';
      } else if (error.response?.status) {
        description = `Сервер вернул ошибку ${error.response.status}.`;
      } else if (error.code === 'ERR_NETWORK') {
        description = 'Проблема с сетью. Проверьте подключение.';
      }

      toast({
        title: 'Ошибка',
        description,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const renderPreview = (preview, label) => {
    if (!preview.rows.length) {
      return null;
    }

    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Upload className="mr-2 h-5 w-5" />
            {label} ({preview.total} записей)
          </CardTitle>
          <CardDescription>
            {preview.total > MAX_PREVIEW_ROWS
              ? `Показаны первые ${MAX_PREVIEW_ROWS} записей`
              : 'Показаны все записи'} из CSV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {preview.headers.map((header, index) => (
                    <TableHead key={index} className="text-xs sm:text-sm">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {preview.headers.map((header, headerIndex) => (
                      <TableCell key={headerIndex} className="text-xs sm:text-sm">
                        {row[header] || '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Рассылка</h1>
        <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
          Загрузите списки сделок и диалогов, чтобы запустить рассылку через n8n
        </p>
      </div>

      {/* Блок списка сделок */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <FileText className="mr-2 h-5 w-5" />
            Файл списка сделок из Битрикса
          </CardTitle>
          <CardDescription>
            Загрузите файл (CSV, XLS, XLSX) со списком сделок для рассылки
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deal-file" className="text-sm font-medium">
              Выберите файл
            </Label>
            <Input
              id="deal-file"
              type="file"
              accept={SUPPORTED_FORMATS}
              onChange={(event) => handleFileChange(event, 'deal')}
              className="border-gray-200 focus:border-zhb-primary"
            />
            <p className="text-xs text-gray-500">
              Поддерживаемые форматы: CSV, XLS, XLSX
            </p>
            {dealFileName && (
              <p className="text-sm text-green-600 font-medium">
                Выбран файл: {dealFileName}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-end">
            <Button
              onClick={() => uploadFile('deal')}
              disabled={dealUploading}
              className="bg-zhb-primary hover:bg-zhb-primary/90 w-full sm:w-auto"
            >
              {dealUploading ? 'Загрузка...' : 'Загрузить список сделок'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {renderPreview(dealPreview, 'Предпросмотр списка сделок')}

      {/* Блок списка диалогов */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <MessageCircle className="mr-2 h-5 w-5" />
            Файл диалогов, не привязанных к CRM
          </CardTitle>
          <CardDescription>
            Загрузите файл (CSV, XLS, XLSX) со списком диалогов, которые нужно добавить в рассылку
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chat-file" className="text-sm font-medium">
              Выберите файл
            </Label>
            <Input
              id="chat-file"
              type="file"
              accept={SUPPORTED_FORMATS}
              onChange={(event) => handleFileChange(event, 'chat')}
              className="border-gray-200 focus:border-zhb-primary"
            />
            <p className="text-xs text-gray-500">
              Поддерживаемые форматы: CSV, XLS, XLSX
            </p>
            {chatFileName && (
              <p className="text-sm text-green-600 font-medium">
                Выбран файл: {chatFileName}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-end">
            <Button
              onClick={() => uploadFile('chat')}
              disabled={chatUploading}
              className="bg-zhb-primary hover:bg-zhb-primary/90 w-full sm:w-auto"
            >
              {chatUploading ? 'Загрузка...' : 'Загрузить список диалогов'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {renderPreview(chatPreview, 'Предпросмотр списка диалогов')}
    </div>
  );
};

export default MailingList;

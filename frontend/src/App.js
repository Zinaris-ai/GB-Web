import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Separator } from "./components/ui/separator";
import { Calendar } from "./components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Toaster } from "./components/ui/toaster";
import ToggleBot from "./components/ToggleBot";
import { 
  BarChart3, 
  MessageSquare, 
  Users, 
  PhoneCall, 
  TrendingUp,
  Search,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  Menu,
  X,
  UserCheck,
  Zap,
  CreditCard,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://n8n210980.hostkey.in';
const BACKEND_URL = 'https://n8n210980.hostkey.in';
const API = `${BACKEND_URL}/api`;

// Date Range Picker Component
const DateRangePicker = ({ dateRange, onDateRangeChange }) => {
  const [tempRange, setTempRange] = useState(dateRange);
  const [isOpen, setIsOpen] = useState(false);

  // Обновляем tempRange когда dateRange изменяется
  useEffect(() => {
    setTempRange(dateRange);
  }, [dateRange]);

  const handleApply = () => {
    if (tempRange?.from && tempRange?.to) {
      onDateRangeChange(tempRange);
      setIsOpen(false);
    }
  };

  const handleQuickSelect = (days) => {
    const end = new Date();
    const start = new Date();
    
    // Используем более надежный способ расчета даты
    start.setTime(end.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const newRange = { from: start, to: end };
    setTempRange(newRange);
    onDateRangeChange(newRange);
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (!dateRange?.from || !dateRange?.to) return "Выберите период";
    
    const start = format(dateRange.from, "dd MMM", { locale: ru });
    const end = format(dateRange.to, "dd MMM", { locale: ru });
    
    if (start === end) return start;
    return `${start} — ${end}`;
  };
  const [hoveredDate, setHoveredDate] = React.useState();
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="justify-start text-left font-normal border-gray-200 hover:border-zhb-primary w-full sm:w-auto text-sm"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-zhb-primary" />
          <span className="text-gray-700 truncate">{formatDateRange()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleQuickSelect(6)}
              className="text-xs flex-1 sm:flex-none"
            >
              Неделя
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleQuickSelect(29)}
              className="text-xs flex-1 sm:flex-none"
            >
              Месяц
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleQuickSelect(89)}
              className="text-xs flex-1 sm:flex-none"
            >
              3 месяца
            </Button>
          </div>
          

          <Calendar
            mode="range"
            selected={tempRange}
            defaultMonth={tempRange?.from}
            onSelect={setTempRange}
            numberOfMonths={window.innerWidth < 640 ? 1 : 2}
            locale={ru}
            className="rounded-md border"
            onDayMouseEnter={(date) => setHoveredDate(date)}
            onDayMouseLeave={() => setHoveredDate(undefined)}
            modifiers={{
              hoveredRange:
                tempRange?.from &&
                !tempRange?.to &&
                hoveredDate &&
                hoveredDate > tempRange.from
                  ? {
                      from: tempRange.from,
                      to: hoveredDate,
                    }
                  : undefined,
            }}
            modifiersClassNames={{
              hoveredRange: "bg-accent/50",
            }}
          />

          
          <div className="flex justify-between pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Отмена
            </Button>
            <Button 
              size="sm"
              onClick={handleApply}
              disabled={!tempRange?.from || !tempRange?.to}
              className="bg-zhb-primary hover:bg-zhb-primary/90"
            >
              Применить
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Statistics Component
const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    
    // Используем более надежный способ расчета даты (последние 7 дней)
    start.setTime(end.getTime() - (6 * 24 * 60 * 60 * 1000));
    
    return { from: start, to: end };
  });

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching statistics from n8n webhook...');
      
      // Prepare request body for n8n webhook
      const payload = {
        start_date: dateRange?.from?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end_date: dateRange?.to?.toISOString() || new Date().toISOString()
      };
      
      const webhookUrl = `${BACKEND_URL}/webhook/gb/statistics/getstatistics`;
      console.log('Requesting webhook URL:', webhookUrl);
      
      const response = await axios.post(webhookUrl, payload);
      console.log('n8n Response:', response.data);
      
      // Проверяем что ответ - это JSON, а не HTML
      if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
        throw new Error('API returned HTML instead of JSON');
      }
      
      // Map n8n response to our format
      const stats = {
        total_deals: response.data.totalDeals || 0,
        consultation_scheduled: response.data.consultationScheduled || 0,
        individual_consultation_scheduled: response.data.individualConsultationScheduled || 0,
        no_response: response.data.noResponse || 0,
        average_interactions_per_client: response.data.averageInteractionsPerClient || 0,
        average_dialog_cost: response.data.averageDialogCost || 0,
        average_conversion_cost: response.data.averageConversionCost || 0,
        total_tokens_used: response.data.totalTokensUsed || 0,
        total_period_cost: response.data.totalPeriodCost || 0,
        period_start: response.data.periodStart || payload.start_date,
        period_end: response.data.periodEnd || payload.end_date
      };
      
      setStats(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      console.log('Using fallback mock data');
      // Fallback to mock data if API fails
      const mockStats = {
        total_deals: 45,
        consultation_scheduled: 18,
        individual_consultation_scheduled: 12,
        no_response: 15,
        average_interactions_per_client: 8.5,
        average_dialog_cost: 12.50,
        average_conversion_cost: 25.75,
        total_tokens_used: 125000,
        total_period_cost: 562.50,
        period_start: dateRange?.from?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: dateRange?.to?.toISOString() || new Date().toISOString()
      };
      console.log('Setting mock stats:', mockStats);
      setStats(mockStats);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zhb-primary"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Не удалось загрузить статистику</p>
      </div>
    );
  }

  const statCards = [
    {
      title: "Общее количество сделок",
      value: stats.total_deals || 0,
      icon: BarChart3,
      color: "bg-zhb-primary",
      description: "за выбранный период"
    },
    {
      title: "Записанные на КК",
      value: stats.consultation_scheduled || 0,
      icon: PhoneCall,
      color: "bg-zhb-success",
      description: "консультаций назначено"
    },
    {
      title: "Записанные на ИК",
      value: stats.individual_consultation_scheduled || 0,
      icon: UserCheck,
      color: "bg-zhb-secondary",
      description: "индивидуальных консультаций"
    },
    {
      title: "Нет ответа",
      value: stats.no_response || 0,
      icon: MessageSquare,
      color: "bg-zhb-warning",
      description: "не отвечают на диалог"
    }
  ];

  // Format numbers with thousands separator
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const metricCards = [
    {
      title: "Среднее количество касаний",
      value: stats.average_interactions_per_client || 0,
      icon: TrendingUp,
      suffix: "взаимодействий",
      description: "на одного клиента"
    },
    {
      title: "Средняя стоимость диалога",
      value: `${stats.average_dialog_cost || 0} BYN`,
      icon: DollarSign,
      description: "за разговор с клиентом"
    },
    {
      title: "Количество токенов",
      value: formatNumber(stats.total_tokens_used || 0),
      icon: Zap,
      suffix: "токенов",
      description: "потрачено за период"
    },
    {
      title: "Стоимость за период",
      value: `${stats.total_period_cost || 0} BYN`,
      icon: CreditCard,
      description: "общие затраты на диалоги"
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Статистика</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Аналитика работы робота-продавца</p>
        </div>
        <div className="w-full sm:w-auto">
          <DateRangePicker 
            dateRange={dateRange} 
            onDateRangeChange={setDateRange}
          />
        </div>
      </div>

      {/* Main Stats Grid - 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 leading-tight">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-full ${stat.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Metrics Grid - Now 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 sm:pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 leading-tight pr-2">
                  {metric.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-zhb-primary flex-shrink-0" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg sm:text-xl font-bold text-gray-900 flex items-baseline flex-wrap">
                  <span>{metric.value}</span>
                  {metric.suffix && <span className="text-sm text-gray-500 ml-1">{metric.suffix}</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Chat History Component
const ChatHistory = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedChat, setSelectedChat] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  useEffect(() => {
    fetchChats();
  }, [search, currentPage, itemsPerPage]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      
      // Prepare query parameters for server-side pagination
      const params = new URLSearchParams();
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());
      
      if (search) {
        params.append('search', search);
      }
      
      const response = await axios.get(`${BACKEND_URL}/webhook/gb/statistics/chats?${params.toString()}`);
      
      // Проверяем что ответ - это JSON, а не HTML
      if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
        throw new Error('API returned HTML instead of JSON');
      }
      
      const { chats, total: totalCount } = response.data;
      
      // Проверяем что chats существует и это массив
      if (!chats || !Array.isArray(chats)) {
        throw new Error('Invalid response format: chats is not an array');
      }
      
      // Convert date strings to Date objects
      const processedChats = chats.map(chat => ({
        ...chat,
        started_at: new Date(chat.started_at),
        last_message_at: new Date(chat.last_message_at)
      }));
      
      setChats(processedChats); // Set chats directly instead of allChats
      setTotal(totalCount);
    } catch (error) {
      console.error("Error fetching chats:", error);
      // Fallback to mock data if API fails
      const mockChats = [
        {
          id: "1",
          client_id: "client_1",
          client_name: "Анна Петрова",
          client_phone: "+375291234567",
          status: "consultation",
          started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          last_message_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          total_interactions: 8
        },
        {
          id: "2", 
          client_id: "client_2",
          client_name: "Иван Сидоров",
          client_phone: "+375299876543",
          status: "individual_consultation",
          started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          last_message_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          total_interactions: 12
        },
        {
          id: "3",
          client_id: "client_3",
          client_name: "Мария Козлова", 
          client_phone: "+375331112233",
          status: "no_response",
          started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          last_message_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          total_interactions: 5
        },
        {
          id: "4",
          client_id: "client_4",
          client_name: "Алексей Волков",
          client_phone: "+375251234567",
          status: "active",
          started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000),
          total_interactions: 15
        },
        {
          id: "5",
          client_id: "client_5",
          client_name: "Елена Смирнова",
          client_phone: "+375291112233",
          status: "consultation",
          started_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          last_message_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          total_interactions: 6
        }
      ];
      
      // Filter by search if provided and apply mock pagination
      let filteredChats = search 
        ? mockChats.filter(chat => 
            chat.client_name.toLowerCase().includes(search.toLowerCase()) ||
            chat.client_phone.includes(search)
          )
        : mockChats;
      
      // Apply mock pagination for fallback data
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedMockChats = filteredChats.slice(startIndex, endIndex);
      
      setChats(paginatedMockChats);
      setTotal(filteredChats.length);
    } finally {
      setLoading(false);
    }
  };


  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(parseInt(value));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getTotalPages = () => {
    return Math.ceil(total / itemsPerPage);
  };

  const getPageNumbers = () => {
    const totalPages = getTotalPages();
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      consultation: { label: "Консультация", variant: "success" },
      individual_consultation: { label: "Инд. консультация", variant: "secondary" },
      no_response: { label: "Нет ответа", variant: "warning" },
      active: { label: "Активен", variant: "default" }
    };
    
    const config = statusMap[status] || { label: status, variant: "secondary" };
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const openChatDialog = async (chat) => {
    try {
      // Создаем базовый объект чата из переданного объекта chat
      const baseChatDetails = {
        id: chat.id,
        client_id: chat.client_id,
        client_name: chat.client_name,
        client_phone: chat.client_phone,
        status: chat.status,
        started_at: chat.started_at,
        last_message_at: chat.last_message_at,
        total_interactions: chat.total_interactions
      };

      // Сначала показываем диалог с базовыми данными
      setSelectedChat({
        ...baseChatDetails,
        messages: [] // Пока пустой массив сообщений
      });
      setDialogOpen(true);

      // Затем загружаем сообщения отдельно
      const response = await axios.get(`${BACKEND_URL}/webhook/16c63be2-95fe-4e5c-879a-541de889a1c5/gb/statistics/chat/${chat.client_id}`);
      const chatDetails = response.data;
      
      // Проверяем что ответ - это JSON, а не HTML
      if (typeof chatDetails === 'string' && chatDetails.includes('<!doctype html>')) {
        throw new Error('API returned HTML instead of JSON');
      }
      
      // Проверяем что messages существует и это массив
      if (!chatDetails.messages || !Array.isArray(chatDetails.messages)) {
        throw new Error('Invalid response format: messages is not an array');
      }
      
      // Обновляем selectedChat с загруженными сообщениями
      setSelectedChat({
        ...baseChatDetails,
        messages: chatDetails.messages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      });
      
    } catch (error) {
      console.error("Error fetching chat details:", error);
      
      // Fallback to mock data if API fails - используем базовые данные из chat
      const mockChatDetails = {
        id: chat.id,
        client_id: chat.client_id,
        client_name: chat.client_name,
        client_phone: chat.client_phone,
        status: chat.status,
        started_at: chat.started_at,
        last_message_at: chat.last_message_at,
        total_interactions: chat.total_interactions,
        messages: [
          {
            id: "msg1",
            timestamp: new Date(chat.started_at.getTime() + 5 * 60 * 1000),
            sender: "bot",
            message: "Добро пожаловать! Я помогу вам с вопросами по жилищным программам."
          },
          {
            id: "msg2", 
            timestamp: new Date(chat.started_at.getTime() + 10 * 60 * 1000),
            sender: "client",
            message: "Здравствуйте! Интересует покупка квартиры в рассрочку"
          },
          {
            id: "msg3",
            timestamp: new Date(chat.started_at.getTime() + 15 * 60 * 1000),
            sender: "bot", 
            message: "Отлично! Мы предлагаем рассрочку до 15 лет без первоначального взноса. Хотели бы записаться на бесплатную консультацию?"
          },
          {
            id: "msg4",
            timestamp: new Date(chat.started_at.getTime() + 20 * 60 * 1000),
            sender: "client",
            message: "Да, хочу записаться на консультацию"
          },
          {
            id: "msg5",
            timestamp: new Date(chat.started_at.getTime() + 25 * 60 * 1000),
            sender: "bot",
            message: "Превосходно! Наши специалисты проконсультируют вас по всем вопросам. Консультация назначена на завтра в 14:00."
          }
        ]
      };
      
      setSelectedChat(mockChatDetails);
      setDialogOpen(true);
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">История переписок</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Все диалоги с клиентами ({total} чатов)</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Поиск по имени или телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 w-full border-gray-200 focus:border-zhb-primary text-sm sm:text-base"
        />
      </div>

      {/* Chats List */}
      <div className="grid gap-3 sm:gap-4">
        {chats.map((chat) => (
          <Card 
            key={chat.id} 
            className="hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm"
            onClick={() => openChatDialog(chat)}
          >
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{chat.client_name}</h3>
                    {getStatusBadge(chat.status)}
                  </div>
                  <p className="text-gray-600 text-sm mb-2 truncate">{chat.client_phone}</p>
                  
                  {/* Mobile Layout */}
                  <div className="block sm:hidden space-y-1 text-xs text-gray-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>Начат: {formatDateShort(chat.started_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Последнее: {formatDateShort(chat.last_message_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Начат: {formatDate(chat.started_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Последнее сообщение: {formatDate(chat.last_message_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>{chat.total_interactions} взаимодействий</span>
                    </div>
                  </div>
                </div>
                
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 pt-4 border-t">
          {/* Items per page selector */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Показать:</span>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
               <SelectContent>
                 <SelectItem value="50">50</SelectItem>
               </SelectContent>
            </Select>
            <span className="text-sm text-gray-700">из {total}</span>
          </div>

          {/* Page info and navigation */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Страница {currentPage} из {getTotalPages()}
            </span>
            
            {/* Previous button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex space-x-1">
              {getPageNumbers().map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="h-8 w-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>

            {/* Next button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === getTotalPages()}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Chat Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto">
          {selectedChat && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
                  Диалог с {selectedChat.client_name}
                </DialogTitle>
                <DialogDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span>{selectedChat.client_phone}</span>
                  <span className="hidden sm:inline">•</span>
                  {getStatusBadge(selectedChat.status)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500">Начало диалога</div>
                    <div className="font-medium text-xs sm:text-sm">{formatDate(selectedChat.started_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500">Последнее сообщение</div>
                    <div className="font-medium text-xs sm:text-sm">{formatDate(selectedChat.last_message_at)}</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500">Взаимодействий</div>
                    <div className="font-medium">{selectedChat.total_interactions}</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm sm:text-base">Переписка</h4>
                  <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                    {selectedChat.messages && selectedChat.messages.map((message, index) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-sm px-3 sm:px-4 py-2 rounded-lg ${
                            message.sender === 'bot'
                              ? 'bg-gray-100 text-gray-900'
                              : 'bg-zhb-primary text-white'
                          }`}
                        >
                          <div className="text-xs sm:text-sm">{message.message}</div>
                          <div className={`text-xs mt-1 flex items-center justify-between ${
                            message.sender === 'bot' ? 'text-gray-500' : 'text-white/80'
                          }`}>
                            <span>{formatDateShort(message.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Navigation Component
const NavigationBar = ({ currentPath }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zhb-primary rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                <span className="text-white font-bold text-sm sm:text-lg">ЖБ</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Жилищный баланс</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Админ панель</p>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-4">
            <ToggleBot />
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPath === '/' 
                  ? 'bg-zhb-primary text-white' 
                  : 'text-gray-600 hover:text-zhb-primary hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline-block mr-2" />
              Статистика
            </Link>
            <Link
              to="/chats"
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentPath === '/chats' 
                  ? 'bg-zhb-primary text-white' 
                  : 'text-gray-600 hover:text-zhb-primary hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline-block mr-2" />
              История переписок
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <div className="px-3 py-2">
                <ToggleBot />
              </div>
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  currentPath === '/' 
                    ? 'bg-zhb-primary text-white' 
                    : 'text-gray-600 hover:text-zhb-primary hover:bg-gray-50'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline-block mr-2" />
                Статистика
              </Link>
              <Link
                to="/chats"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  currentPath === '/chats' 
                    ? 'bg-zhb-primary text-white' 
                    : 'text-gray-600 hover:text-zhb-primary hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline-block mr-2" />
                История переписок
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Layout wrapper to get current location
const Layout = ({ children }) => {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar currentPath={location.pathname} />
      <main className="max-w-7xl mx-auto py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

// Main App Component
function App() {
  // App initialization - no backend calls needed with mock data

  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Statistics />} />
            <Route path="/chats" element={<ChatHistory />} />
          </Routes>
        </Layout>
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
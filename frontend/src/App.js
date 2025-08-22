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
import { 
  BarChart3, 
  MessageSquare, 
  Users, 
  PhoneCall, 
  UserX, 
  TrendingUp,
  Search,
  Calendar,
  Clock,
  DollarSign
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Statistics Component
const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, [period]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/statistics?period=${period}`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
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
      value: stats.total_deals,
      icon: BarChart3,
      color: "bg-zhb-primary",
      description: `за ${period === "week" ? "неделю" : "месяц"}`
    },
    {
      title: "Записанные на КК",
      value: stats.consultation_scheduled,
      icon: PhoneCall,
      color: "bg-zhb-success",
      description: "консультаций назначено"
    },
    {
      title: "Нет ответа",
      value: stats.no_response,
      icon: MessageSquare,
      color: "bg-zhb-warning",
      description: "не отвечают на диалог"
    },
    {
      title: "Заблокировал",
      value: stats.blocked,
      icon: UserX,
      color: "bg-zhb-danger",
      description: "заблокировали бота"
    }
  ];

  const metricCards = [
    {
      title: "Среднее количество касаний",
      value: stats.average_interactions_per_client,
      icon: TrendingUp,
      suffix: "взаимодействий",
      description: "на одного клиента"
    },
    {
      title: "Средняя стоимость диалога",
      value: `${stats.average_dialog_cost} BYN`,
      icon: DollarSign,
      description: "за разговор с клиентом"
    },
    {
      title: "Средняя стоимость конверсии",
      value: `${stats.average_conversion_cost} BYN`,
      icon: Users,
      description: "за успешную конверсию"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Статистика</h1>
          <p className="text-gray-600 mt-2">Аналитика работы робота-продавца</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={period === "week" ? "default" : "outline"}
            onClick={() => setPeriod("week")}
            className="bg-zhb-primary hover:bg-zhb-primary/90"
          >
            За неделю
          </Button>
          <Button
            variant={period === "month" ? "default" : "outline"}
            onClick={() => setPeriod("month")}
            className="bg-zhb-primary hover:bg-zhb-primary/90"
          >
            За месяц
          </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {stat.title}
                </CardTitle>
                <div className={`w-10 h-10 rounded-full ${stat.color} flex items-center justify-center`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {metric.title}
                </CardTitle>
                <Icon className="h-5 w-5 text-zhb-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {metric.value} {metric.suffix && <span className="text-sm text-gray-500">{metric.suffix}</span>}
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

  useEffect(() => {
    fetchChats();
  }, [search]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const response = await axios.get(`${API}/chats${params}`);
      setChats(response.data.chats);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      consultation: { label: "Консультация", variant: "success" },
      no_response: { label: "Нет ответа", variant: "warning" },
      blocked: { label: "Заблокирован", variant: "destructive" },
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

  const openChatDialog = async (chat) => {
    try {
      const response = await axios.get(`${API}/chats/${chat.id}`);
      setSelectedChat(response.data);
      setDialogOpen(true);
    } catch (error) {
      console.error("Error fetching chat details:", error);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">История переписок</h1>
          <p className="text-gray-600 mt-2">Все диалоги с клиентами ({total} чатов)</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Поиск по имени или телефону..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 w-full max-w-md border-gray-200 focus:border-zhb-primary"
        />
      </div>

      {/* Chats List */}
      <div className="grid gap-4">
        {chats.map((chat) => (
          <Card 
            key={chat.id} 
            className="hover:shadow-md transition-shadow cursor-pointer border-0 shadow-sm"
            onClick={() => openChatDialog(chat)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{chat.client_name}</h3>
                    {getStatusBadge(chat.status)}
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{chat.client_phone}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
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
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {chat.dialog_cost.toFixed(2)} BYN
                  </div>
                  <div className="text-xs text-gray-500">стоимость диалога</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chat Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedChat && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Диалог с {selectedChat.client_name}
                </DialogTitle>
                <DialogDescription>
                  {selectedChat.client_phone} • {getStatusBadge(selectedChat.status)}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm text-gray-500">Начало диалога</div>
                    <div className="font-medium">{formatDate(selectedChat.started_at)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Последнее сообщение</div>
                    <div className="font-medium">{formatDate(selectedChat.last_message_at)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Взаимодействий</div>
                    <div className="font-medium">{selectedChat.total_interactions}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Стоимость диалога</div>
                    <div className="font-medium">{selectedChat.dialog_cost.toFixed(2)} BYN</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Переписка</h4>
                  {selectedChat.messages && selectedChat.messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          message.sender === 'bot'
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-zhb-primary text-white'
                        }`}
                      >
                        <div className="text-sm">{message.message}</div>
                        <div className={`text-xs mt-1 ${
                          message.sender === 'bot' ? 'text-gray-500' : 'text-white/80'
                        }`}>
                          {formatDate(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
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
  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-zhb-primary rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">ЖБ</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Жилищный баланс</h1>
                <p className="text-xs text-gray-500">Админ панель</p>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4">
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
        </div>
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
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

// Main App Component
function App() {
  useEffect(() => {
    // Generate test data on app start
    const generateTestData = async () => {
      try {
        await axios.post(`${API}/generate-test-data`);
        console.log("Test data generated");
      } catch (error) {
        console.log("Test data might already exist or error:", error.message);
      }
    };
    
    generateTestData();
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Statistics />} />
            <Route path="/chats" element={<ChatHistory />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
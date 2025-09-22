import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import AnalyticsPage from "./pages/AnalyticsPage";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Separator } from "./components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { 
  BarChart3, 
  MessageSquare, 
  Search,
  Calendar as CalendarIcon,
  Clock,
  Menu,
  X,
  Zap
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {chat.dialog_cost.toFixed(2)} BYN
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Последнее: {formatDateShort(chat.last_message_at)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <span>{formatNumber(chat.total_tokens_used || 0)}</span>
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
                    <div className="flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      <span>{formatNumber(chat.total_tokens_used || 0)} токенов</span>
                    </div>
                  </div>
                </div>
                
                {/* Desktop Cost Display */}
                <div className="hidden sm:block text-right">
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
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500">Стоимость диалога</div>
                    <div className="font-medium">{selectedChat.dialog_cost.toFixed(2)} BYN</div>
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500">Токенов использовано</div>
                    <div className="font-medium">{formatNumber(selectedChat.total_tokens_used || 0)}</div>
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
                            {message.tokens_used && (
                              <div className="flex items-center gap-1 ml-2">
                                <Zap className="h-3 w-3" />
                                <span>{message.tokens_used}</span>
                              </div>
                            )}
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
          <div className="hidden sm:flex space-x-4">
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

// Main App Component - Жилищный баланс Admin Panel
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
            <Route path="/" element={<AnalyticsPage />} />
            <Route path="/chats" element={<ChatHistory />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
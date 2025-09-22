import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { 
  BarChart3, 
  MessageSquare, 
  Users, 
  PhoneCall, 
  TrendingUp,
  Calendar as CalendarIcon,
  DollarSign,
  UserCheck,
  Zap,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Date Range Picker Component
const DateRangePicker = ({ dateRange, onDateRangeChange }) => {
  const [tempRange, setTempRange] = useState(dateRange);
  const [isOpen, setIsOpen] = useState(false);

  const handleApply = () => {
    if (tempRange?.from && tempRange?.to) {
      onDateRangeChange(tempRange);
      setIsOpen(false);
    }
  };

  const handleQuickSelect = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
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
            onSelect={setTempRange}
            numberOfMonths={window.innerWidth < 640 ? 1 : 2}
            locale={ru}
            className="rounded-md border"
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

// Main Analytics Page Component
const AnalyticsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 6); // Last 7 days
    return { from: start, to: end };
  });

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (dateRange?.from && dateRange?.to) {
        params.append('start_date', dateRange.from.toISOString());
        params.append('end_date', dateRange.to.toISOString());
      }
      
      const response = await axios.get(`${API}/statistics?${params}`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format numbers with thousands separator
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  // Chart colors
  const chartColors = {
    primary: '#1887C9',
    success: '#82B757',
    secondary: '#82B757',
    warning: '#E2E039',
    consultation: '#1887C9',
    individual: '#82B757',
    noResponse: '#E2E039'
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
      description: "за выбранный период"
    },
    {
      title: "Записанные на КК",
      value: stats.consultation_scheduled,
      icon: PhoneCall,
      color: "bg-zhb-success",
      description: "консультаций назначено"
    },
    {
      title: "Записанные на ИК",
      value: stats.individual_consultation_scheduled,
      icon: UserCheck,
      color: "bg-zhb-secondary",
      description: "индивидуальных консультаций"
    },
    {
      title: "Нет ответа",
      value: stats.no_response,
      icon: MessageSquare,
      color: "bg-zhb-warning",
      description: "не отвечают на диалог"
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
    },
    {
      title: "Количество токенов",
      value: formatNumber(stats.total_tokens_used),
      icon: Zap,
      suffix: "токенов",
      description: "потрачено за период"
    },
    {
      title: "Стоимость за период",
      value: `${stats.total_period_cost} BYN`,
      icon: CreditCard,
      description: "общие затраты на диалоги"
    }
  ];

  // Prepare data for pie chart
  const pieData = Object.entries(stats.status_distribution).map(([key, value]) => {
    const labels = {
      consultation_scheduled: 'Записанные на КК',
      individual_consultation_scheduled: 'Записанные на ИК',
      no_response: 'Нет ответа'
    };
    const colors = {
      consultation_scheduled: chartColors.consultation,
      individual_consultation_scheduled: chartColors.individual,
      no_response: chartColors.noResponse
    };
    
    return {
      name: labels[key] || key,
      value,
      color: colors[key] || chartColors.primary
    };
  });

  // Check if we have data for charts
  const hasDealsData = stats.deals_by_day && stats.deals_by_day.length > 0;
  const hasCostsData = stats.daily_costs && stats.daily_costs.length > 0;
  const hasStatusData = pieData.some(item => item.value > 0);

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

      {/* Metrics Grid - 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
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

      {/* Charts Section */}
      <div className="space-y-6 sm:space-y-8">
        {/* Deals Trend Chart */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Динамика сделок по дням</CardTitle>
            <CardDescription>Отслеживание количества сделок и их статусов во времени</CardDescription>
          </CardHeader>
          <CardContent>
            {hasDealsData ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={stats.deals_by_day}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => format(new Date(value), "dd.MM")}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), "dd MMMM yyyy", { locale: ru })}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total_deals" 
                    stroke={chartColors.primary} 
                    strokeWidth={3}
                    name="Всего сделок"
                    dot={{ fill: chartColors.primary, strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="consultation_scheduled" 
                    stroke={chartColors.consultation} 
                    strokeWidth={2}
                    name="КК"
                    dot={{ fill: chartColors.consultation, strokeWidth: 2, r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="individual_consultation_scheduled" 
                    stroke={chartColors.individual} 
                    strokeWidth={2}
                    name="ИК"
                    dot={{ fill: chartColors.individual, strokeWidth: 2, r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="no_response" 
                    stroke={chartColors.noResponse} 
                    strokeWidth={2}
                    name="Нет ответа"
                    dot={{ fill: chartColors.noResponse, strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Нет данных за выбранный период</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Combined Charts: Daily Costs + Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Costs Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Средние стоимости по дням</CardTitle>
              <CardDescription>Динамика стоимости диалогов и конверсий</CardDescription>
            </CardHeader>
            <CardContent>
              {hasCostsData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.daily_costs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#6b7280"
                      fontSize={12}
                      tickFormatter={(value) => format(new Date(value), "dd.MM")}
                    />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip 
                      labelFormatter={(value) => format(new Date(value), "dd MMMM", { locale: ru })}
                      formatter={(value, name) => [`${value} BYN`, name]}
                    />
                    <Legend />
                    <Bar 
                      dataKey="average_dialog_cost" 
                      fill={chartColors.primary} 
                      name="Средняя стоимость диалога"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar 
                      dataKey="average_conversion_cost" 
                      fill={chartColors.success} 
                      name="Средняя стоимость конверсии"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Нет данных о стоимости</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution Chart */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Распределение статусов</CardTitle>
              <CardDescription>Соотношение типов результатов работы бота</CardDescription>
            </CardHeader>
            <CardContent>
              {hasStatusData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} сделок`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Нет данных о статусах</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
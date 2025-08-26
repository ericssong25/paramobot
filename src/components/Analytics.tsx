import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Calendar,
  MessageCircle,
  Clock,
  Target,
  Activity
} from 'lucide-react';

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState('7d');

  const overviewStats = [
    {
      label: 'Total Messages',
      value: '4,257',
      change: '+14%',
      changeType: 'positive',
      icon: MessageSquare,
      color: 'bg-blue-500'
    },
    {
      label: 'Response Rate',
      value: '94.2%',
      change: '+2.1%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      label: 'Active Users',
      value: '1,849',
      change: '+8.5%',
      changeType: 'positive',
      icon: Users,
      color: 'bg-purple-500'
    },
    {
      label: 'Avg Response Time',
      value: '2.3s',
      change: '-0.5s',
      changeType: 'positive',
      icon: Clock,
      color: 'bg-orange-500'
    }
  ];

  const platformStats = [
    {
      platform: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-500',
      messages: 4257,
      engagement: '96%',
      growth: '+18%'
    }
  ];

  const topTemplates = [
    { name: 'Welcome Message', usage: 156, platform: 'WhatsApp', engagement: '89%' },
    { name: 'Business Hours', usage: 134, platform: 'WhatsApp', engagement: '94%' },
    { name: 'Pricing Inquiry', usage: 89, platform: 'WhatsApp', engagement: '76%' },
    { name: 'Support Request', usage: 67, platform: 'WhatsApp', engagement: '91%' },
    { name: 'Product Info', usage: 54, platform: 'WhatsApp', engagement: '82%' }
  ];

  const activityData = [
    { time: '00:00', messages: 12 },
    { time: '04:00', messages: 8 },
    { time: '08:00', messages: 45 },
    { time: '12:00', messages: 78 },
    { time: '16:00', messages: 92 },
    { time: '20:00', messages: 67 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            <span>Analytics</span>
          </h1>
          <p className="text-gray-400 mt-1">Track your automation performance and engagement</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">Platform Performance</h3>
          <div className="space-y-6">
            {platformStats.map((platform, index) => {
              const Icon = platform.icon;
              return (
                <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-6 h-6 ${platform.color}`} />
                      <h4 className="text-white font-medium">{platform.platform}</h4>
                    </div>
                    <span className="text-green-400 text-sm font-medium">{platform.growth}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Messages</p>
                      <p className="text-white font-bold text-lg">{platform.messages.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Engagement</p>
                      <p className="text-white font-bold text-lg">{platform.engagement}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Templates */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-6">Top Performing Templates</h3>
          <div className="space-y-4">
            {topTemplates.map((template, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <p className="text-white font-medium">{template.name}</p>
                    <span className="text-gray-400 text-xs">{template.platform}</span>
                  </div>
                  <p className="text-gray-400 text-sm">Used {template.usage} times</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{template.engagement}</p>
                  <p className="text-gray-400 text-sm">engagement</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Message Activity</h3>
          <div className="flex items-center space-x-2 text-gray-400">
            <Activity className="w-4 h-4" />
            <span className="text-sm">Last 24 hours</span>
          </div>
        </div>
        
        <div className="h-64 flex items-end justify-between space-x-2">
          {activityData.map((data, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div 
                className="bg-gradient-to-t from-blue-500 to-purple-500 rounded-t-lg w-full transition-all duration-300 hover:from-blue-400 hover:to-purple-400"
                style={{ height: `${(data.messages / 100) * 100}%`, minHeight: '8px' }}
              ></div>
              <span className="text-gray-400 text-xs mt-2">{data.time}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">524</p>
            <p className="text-gray-400 text-sm">Peak Hour</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">16:00</p>
            <p className="text-gray-400 text-sm">Peak Time</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">2.1s</p>
            <p className="text-gray-400 text-sm">Avg Response</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">94%</p>
            <p className="text-gray-400 text-sm">Success Rate</p>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="w-6 h-6 text-green-500" />
            <h4 className="font-bold text-white">Conversion Rate</h4>
          </div>
          <p className="text-3xl font-bold text-white mb-2">18.7%</p>
          <p className="text-green-400 text-sm">+3.2% from last week</p>
          <div className="mt-4 bg-gray-700 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '18.7%' }}></div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-6 h-6 text-blue-500" />
            <h4 className="font-bold text-white">Active Sessions</h4>
          </div>
          <p className="text-3xl font-bold text-white mb-2">347</p>
          <p className="text-blue-400 text-sm">Currently online</p>
          <div className="mt-4 flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-sm">Real-time</span>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <MessageSquare className="w-6 h-6 text-purple-500" />
            <h4 className="font-bold text-white">Satisfaction Score</h4>
          </div>
          <p className="text-3xl font-bold text-white mb-2">4.8/5</p>
          <p className="text-purple-400 text-sm">Based on user feedback</p>
          <div className="mt-4 flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <div key={star} className={`w-4 h-4 rounded-full ${star <= 4 ? 'bg-yellow-500' : 'bg-gray-600'}`}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
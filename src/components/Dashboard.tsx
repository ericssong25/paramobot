import React from 'react';
import { 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Bot, 
  MessageCircle,
  Activity,
  Clock
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Total Messages Sent', value: '2,847', change: '+12%', icon: MessageSquare, color: 'bg-blue-500' },
    { label: 'Active Conversations', value: '156', change: '+8%', icon: Users, color: 'bg-green-500' },
    { label: 'Response Rate', value: '94%', change: '+2%', icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Automations Running', value: '12', change: 'All active', icon: Bot, color: 'bg-pink-500' },
  ];

  const recentActivity = [
    { type: 'whatsapp', message: 'Welcome message sent to new contact', time: '5 min ago', user: '+1 555-0123' },
    { type: 'whatsapp', message: 'Follow-up message delivered', time: '18 min ago', user: '+1 555-0456' },
    { type: 'whatsapp', message: 'Auto-reply sent to customer inquiry', time: '25 min ago', user: '+1 555-0789' },
    { type: 'whatsapp', message: 'Campaign message delivered', time: '32 min ago', user: 'Campaign #1' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Overview of your automation performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-400 font-medium">All systems operational</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-purple-500/50 transition-all duration-300 hover:transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-green-400 text-sm font-medium">{stat.change}</span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Bots */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Active Bots</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-medium text-white">WhatsApp Auto-Responder</p>
                  <p className="text-gray-400 text-sm">24/7 customer support</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400 text-sm">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors">
                <MessageCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{activity.message}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-gray-400 text-xs">{activity.user}</span>
                    <span className="text-gray-500 text-xs">•</span>
                    <span className="text-gray-400 text-xs">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors">
            View all activity
          </button>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Message Performance</h3>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400 text-sm">Last 7 days</span>
          </div>
        </div>
        <div className="h-64 bg-gray-700/30 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Performance charts will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
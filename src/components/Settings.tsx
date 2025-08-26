import React from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Zap, 
  Database,
  Globe,
  Moon,
  Smartphone,
  Key,
  Clock,
  Download
} from 'lucide-react';

const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
          <SettingsIcon className="w-8 h-8 text-gray-500" />
          <span>Settings</span>
        </h1>
        <p className="text-gray-400 mt-1">Configure your automation settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-bold text-white">Profile</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Display Name</label>
              <input 
                type="text" 
                defaultValue="John Doe"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Email</label>
              <input 
                type="email" 
                defaultValue="john@example.com"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Time Zone</label>
              <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none">
                <option>UTC-8 (Pacific Time)</option>
                <option>UTC-5 (Eastern Time)</option>
                <option>UTC+0 (GMT)</option>
                <option>UTC+1 (Central European Time)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-bold text-white">Notifications</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Email Notifications</p>
                <p className="text-gray-400 text-sm">Receive email updates</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500 transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Bot Status Alerts</p>
                <p className="text-gray-400 text-sm">Get notified of bot issues</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500 transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Daily Reports</p>
                <p className="text-gray-400 text-sm">Receive daily analytics</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600 transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Mobile Push</p>
                <p className="text-gray-400 text-sm">Push notifications on mobile</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500 transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-green-500" />
            <h3 className="text-xl font-bold text-white">Security</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Two-Factor Auth</p>
                <p className="text-gray-400 text-sm">Enhanced account security</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600 transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
              </button>
            </div>
            
            <button className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
              <div className="flex items-center space-x-3">
                <Key className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-medium">Change Password</p>
                  <p className="text-gray-400 text-sm">Update your password</p>
                </div>
              </div>
            </button>
            
            <button className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">Connected Devices</p>
                  <p className="text-gray-400 text-sm">Manage your devices</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Automation Settings */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <Zap className="w-6 h-6 text-purple-500" />
            <h3 className="text-xl font-bold text-white">Automation</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-3">Global Response Delay</label>
              <div className="flex items-center space-x-4">
                <input 
                  type="range" 
                  min="1" 
                  max="60" 
                  defaultValue="30"
                  className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-white font-medium min-w-[3rem]">30s</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">Delay before sending automated responses</p>
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-3">Daily Message Limit</label>
              <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none">
                <option>100 messages/day</option>
                <option>250 messages/day</option>
                <option>500 messages/day</option>
                <option>Unlimited</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Smart Learning</p>
                <p className="text-gray-400 text-sm">Learn from user interactions</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-500 transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
              </button>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="w-6 h-6 text-orange-500" />
            <h3 className="text-xl font-bold text-white">System</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Dark Mode</p>
                <p className="text-gray-400 text-sm">Toggle dark/light theme</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500 transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Auto-Updates</p>
                <p className="text-gray-400 text-sm">Automatically update features</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-green-500 transition-colors">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6"></span>
              </button>
            </div>
            
            <button className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
              <div className="flex items-center space-x-3">
                <Download className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-white font-medium">Export Data</p>
                  <p className="text-gray-400 text-sm">Download your data</p>
                </div>
              </div>
            </button>
            
            <button className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-white font-medium">API Access</p>
                  <p className="text-gray-400 text-sm">Manage API keys</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center space-x-3 mb-6">
          <Clock className="w-6 h-6 text-red-500" />
          <h3 className="text-xl font-bold text-white">Advanced</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <Database className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-white font-medium mb-1">Clear Cache</p>
            <p className="text-gray-400 text-xs">Reset stored data</p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-white font-medium mb-1">Backup Data</p>
            <p className="text-gray-400 text-xs">Create backup</p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <Globe className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-white font-medium mb-1">Reset Settings</p>
            <p className="text-gray-400 text-xs">Restore defaults</p>
          </div>
          
          <div className="bg-gray-700/50 rounded-lg p-4 text-center">
            <Key className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-white font-medium mb-1">Delete Account</p>
            <p className="text-gray-400 text-xs">Permanent deletion</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Search,
  Filter,
  MessageCircle,
  Tag
} from 'lucide-react';

const MessageTemplates: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const templates = [
    {
      id: 1,
      name: 'Welcome Message',
      content: 'Hi {name}! 👋 Welcome to our community. Thanks for contacting us! Check out our latest products and feel free to reach out if you have any questions.',
      platform: 'whatsapp',
      category: 'welcome',
      tags: ['greeting', 'welcome', 'introduction'],
      usageCount: 156
    },
    {
      id: 2,
      name: 'Pricing Inquiry Response',
      content: 'Thanks for your interest in our pricing! 💰 I\'ve sent you our complete pricing guide. Let me know if you have any specific questions!',
      platform: 'whatsapp',
      category: 'sales',
      tags: ['pricing', 'sales', 'inquiry'],
      usageCount: 89
    },
    {
      id: 3,
      name: 'Business Hours Auto-Reply',
      content: 'Hello! Thanks for contacting us. 🕐 We\'re currently outside business hours (9 AM - 6 PM). We\'ll get back to you as soon as possible!',
      platform: 'whatsapp',
      category: 'support',
      tags: ['business hours', 'availability'],
      usageCount: 234
    },
    {
      id: 4,
      name: 'Product Information',
      content: 'Hi there! I\'d love to help you learn more about our products. 📦 What specific information are you looking for? I can send you detailed specs, pricing, or availability.',
      platform: 'whatsapp',
      category: 'sales',
      tags: ['product', 'information', 'help'],
      usageCount: 67
    },
    {
      id: 5,
      name: 'Support Request',
      content: 'I understand you need assistance. 🛠️ Let me connect you with our technical support team right away. Please describe your issue and we\'ll help you resolve it quickly.',
      platform: 'whatsapp',
      category: 'support',
      tags: ['support', 'technical', 'help'],
      usageCount: 43
    },
    {
      id: 6,
      name: 'Thank You Follow-up',
      content: 'Thank you so much for your purchase! 🎉 We hope you love your new {product}. Don\'t forget to share your experience with us!',
      platform: 'whatsapp',
      category: 'followup',
      tags: ['thank you', 'purchase', 'follow-up'],
      usageCount: 92
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates', count: templates.length },
    { id: 'welcome', name: 'Welcome', count: templates.filter(t => t.category === 'welcome').length },
    { id: 'sales', name: 'Sales', count: templates.filter(t => t.category === 'sales').length },
    { id: 'support', name: 'Support', count: templates.filter(t => t.category === 'support').length },
    { id: 'followup', name: 'Follow-up', count: templates.filter(t => t.category === 'followup').length },
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getPlatformIcon = (platform: string) => {
    return <MessageCircle className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <span>Message Templates</span>
          </h1>
          <p className="text-gray-400 mt-1">Create and manage reusable message templates</p>
        </div>
        <button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:transform hover:scale-105">
          <Plus className="w-4 h-4 inline mr-2" />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Category Filter Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 sticky top-6">
            <h3 className="text-lg font-bold text-white mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.map((category) => (
                <li key={category.id}>
                  <button
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <span className="font-medium capitalize">{category.name}</span>
                    <span className="text-sm">{category.count}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <h4 className="text-white font-medium mb-3">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Templates</span>
                  <span className="text-white font-medium">{templates.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Most Used</span>
                  <span className="text-purple-400 font-medium">Business Hours</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Usage</span>
                  <span className="text-white font-medium">{templates.reduce((acc, t) => acc + t.usageCount, 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Templates List */}
        <div className="lg:col-span-3">
          {/* Search Bar */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white border border-gray-600 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="space-y-4">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500/50 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{template.name}</h3>
                      <div className="flex items-center space-x-1">
                        {getPlatformIcon(template.platform)}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        template.category === 'welcome' ? 'bg-green-500/20 text-green-400' :
                        template.category === 'sales' ? 'bg-blue-500/20 text-blue-400' :
                        template.category === 'support' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {template.category}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed mb-3">{template.content}</p>
                    
                    {/* Tags */}
                    <div className="flex items-center space-x-2 mb-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <div className="flex flex-wrap gap-2">
                        {template.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-700 text-gray-400 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-400 text-sm">
                      <span>Used {template.usageCount} times</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="p-2 text-gray-400 hover:text-white transition-colors" title="Copy template">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors" title="Edit template">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-400 hover:text-red-300 transition-colors" title="Delete template">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Template Variables Info */}
                {template.content.includes('{') && (
                  <div className="bg-gray-700/50 rounded-lg p-3 mt-4">
                    <p className="text-gray-400 text-xs mb-1">Variables detected:</p>
                    <div className="flex flex-wrap gap-2">
                      {template.content.match(/\{[^}]+\}/g)?.map((variable, index) => (
                        <code key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                          {variable}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="bg-gray-800 rounded-xl p-12 border border-gray-700 text-center">
              <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No templates found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your search or create a new template</p>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                <Plus className="w-4 h-4 inline mr-2" />
                Create Template
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageTemplates;
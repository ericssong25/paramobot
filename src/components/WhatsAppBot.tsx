import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const WhatsAppBot: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'connect' | 'messages' | 'broadcast' | 'analytics' | 'welcome' | 'flows' | 'config'>('connect');
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [botConfig, setBotConfig] = useState<any>(null);

  // Message states
  const [messageTo, setMessageTo] = useState('');
  const [messageText, setMessageText] = useState('');
  const [contactName, setContactName] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');



  // Welcome message states
  const [welcomeMessage, setWelcomeMessage] = useState('¡Hola! Bienvenido a nuestro chat. ¿En qué puedo ayudarte? 😊');
  const [welcomeEnabled, setWelcomeEnabled] = useState(true);





  // Conversation Flows states
  const [flows, setFlows] = useState<any[]>([]);
  const [selectedFlow, setSelectedFlow] = useState<any>(null);
  const [editingStep, setEditingStep] = useState<any>(null);
  const [editingOption, setEditingOption] = useState<any>(null);
  const [showAddStep, setShowAddStep] = useState(false);
  const [showAddOption, setShowAddOption] = useState(false);
  const [newStep, setNewStep] = useState({ questionText: '', parentStepId: null as number | null, linkedOptionIds: [] as number[] });
  const [newOption, setNewOption] = useState({ optionText: '', responseText: '', nextStepId: null, isBackOption: false, isFinalResponse: false });
  const [flowOptions, setFlowOptions] = useState<any[]>([]);



  // Load initial data
  useEffect(() => {
    loadWhatsAppStatus();
    loadFlows();
    loadBotConfig();

    // Connect to real-time status updates
    const cleanup = apiService.connectToStatusStream((status) => {
      console.log('📱 WhatsApp status update:', status);
      setWhatsappStatus(status);
    });

    return cleanup;
  }, []);

  const loadWhatsAppStatus = async () => {
    try {
      const status = await apiService.getWhatsAppStatus();
      setWhatsappStatus(status);
    } catch (err) {
      console.error('Error loading WhatsApp status:', err);
    }
  };





  const loadFlows = async () => {
    try {
      const flowsData = await apiService.getFlows();
      setFlows(flowsData);
      if (flowsData.length > 0 && !selectedFlow) {
        setSelectedFlow(flowsData[0]);
      }
    } catch (err) {
      console.error('Error loading flows:', err);
    }
  };

  const loadBotConfig = async () => {
    try {
      const config = await apiService.getBotConfig();
      setBotConfig(config);
    } catch (err) {
      console.error('Error loading bot config:', err);
    }
  };

  const updateBotConfig = async (processOldMessages: boolean) => {
    try {
      setLoading(true);
      const updatedConfig = await apiService.updateBotConfig({ processOldMessages });
      setBotConfig(updatedConfig.config);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Error updating bot configuration');
    } finally {
      setLoading(false);
    }
  };

  const getActiveFlowsCount = () => {
    return flows.filter(flow => flow.is_active).length;
  };

  const getWelcomeMessagePreview = () => {
    if (!welcomeMessage || !welcomeEnabled) {
      return 'Mensaje de bienvenida deshabilitado';
    }

    let preview = welcomeMessage + '\n\n';
    const activeFlows = flows.filter(flow => flow.is_active);
    
    if (activeFlows.length > 0) {
      preview += '💬 **Conversaciones disponibles:**\n';
      activeFlows.forEach((flow, index) => {
        preview += `${index + 1}️⃣ ${flow.flow_name}\n`;
      });
      preview += '\nResponde con el número de tu interés (1, 2, 3...)';
    } else {
      preview += '💡 No hay conversaciones configuradas en este momento.';
    }
    
    return preview;
  };

  const handleInitializeWhatsApp = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.initializeWhatsApp();
      if (result.success) {
        // Status will be updated via real-time stream
        console.log('WhatsApp Bot initialization started');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    setLoading(true);
    try {
      const result = await apiService.disconnectWhatsApp();
      if (result.success) {
        // Status will be updated via real-time stream
        console.log('WhatsApp Bot disconnection started');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  const handleSendMessage = async () => {
    if (!messageTo.trim() || !messageText.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.sendWhatsAppMessage(messageTo, messageText);
      if (result.success) {
        setMessageTo('');
        setMessageText('');
        alert('Message sent successfully!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToContact = async () => {
    if (!contactName.trim() || !messageText.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.sendWhatsAppToContact(contactName, messageText);
      if (result.success) {
        setContactName('');
        setMessageText('');
        alert('Message sent to contact successfully!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.broadcastWhatsAppMessage(broadcastMessage);
      if (result.success) {
        setBroadcastMessage('');
        alert(`Broadcast completed! Sent to ${result.result.successCount} out of ${result.result.totalCount} contacts.`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  const handleSaveWelcomeMessage = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.saveWelcomeMessage({
        message: welcomeMessage,
        type: 'buttons',
        options: ['Ver productos', 'Consultar precios', 'Contactar'],
        enabled: welcomeEnabled
      });
      if (result.success) {
        alert('Welcome message saved successfully!');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestWelcomeMessage = async () => {
    if (!messageTo.trim()) {
      alert('Please enter a phone number to test the welcome message');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.testWelcomeMessage(messageTo);
      if (result.success) {
        alert('Welcome message test sent successfully! Check the recipient phone.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };





  // Conversation Flows handlers
  const handleSelectFlow = async (flow: any) => {
    console.log(`🔄 [FRONTEND] handleSelectFlow called for flow:`, {
      id: flow.id,
      name: flow.flow_name
    });

    try {
      console.log(`📥 [FRONTEND] Loading flow data...`);
      const flowData = await apiService.getFlow(flow.id);
      console.log(`✅ [FRONTEND] Flow data loaded:`, {
        id: flowData.id,
        name: flowData.flow_name,
        stepsCount: flowData.steps?.length || 0
      });
      setSelectedFlow(flowData);
      
      // Load flow options for linking
      console.log(`📥 [FRONTEND] Loading flow options...`);
      const options = await apiService.getFlowOptions(flow.id);
      console.log(`✅ [FRONTEND] Flow options loaded:`, options.length);
      setFlowOptions(options);
      
      // Auto-fix back options if needed
      const backOptionsWithoutNextStep = options.filter(opt => opt.is_back_option && !opt.next_step_id);
      if (backOptionsWithoutNextStep.length > 0) {
        console.log(`🔧 Found ${backOptionsWithoutNextStep.length} back options without next_step_id, fixing automatically...`);
        try {
          const result = await apiService.fixBackOptions(flow.id);
          if (result.success && result.fixedCount > 0) {
            console.log(`✅ Auto-fixed ${result.fixedCount} back options`);
            // Reload the flow to get updated data
            const updatedFlowData = await apiService.getFlow(flow.id);
            setSelectedFlow(updatedFlowData);
            
            const updatedOptions = await apiService.getFlowOptions(flow.id);
            setFlowOptions(updatedOptions);
          }
        } catch (fixErr) {
          console.error('Error auto-fixing back options:', fixErr);
        }
      }
    } catch (err: any) {
      console.error(`❌ [FRONTEND] Error loading flow:`, err);
      alert('Error cargando flujo: ' + err.message);
    }
  };

  const handleCreateFlow = async () => {
    const flowName = prompt('Ingresa el nombre del nuevo flujo:');
    if (!flowName) return;
    
    try {
      await apiService.createFlow(flowName);
      loadFlows();
      alert('Flujo creado exitosamente');
    } catch (err: any) {
      alert('Error creando flujo: ' + err.message);
    }
  };

  const handleDeleteFlow = async (flowId: number, flowName: string) => {
    const confirmed = confirm(`¿Estás seguro de que quieres eliminar el flujo "${flowName}"?\n\n⚠️ Esta acción eliminará:\n• El flujo completo\n• Todos los pasos\n• Todas las opciones\n\nEsta acción no se puede deshacer.`);
    
    if (!confirmed) return;
    
    try {
      await apiService.deleteFlow(flowId);
      loadFlows();
      setSelectedFlow(null);
      alert('Flujo eliminado exitosamente');
    } catch (err: any) {
      alert('Error eliminando flujo: ' + err.message);
    }
  };

  const handleCreateStep = async () => {
    if (!selectedFlow || !newStep.questionText.trim()) {
      alert('Por favor ingresa el texto de la pregunta');
      return;
    }
    
    try {
      const nextStepNumber = (selectedFlow.steps?.length || 0) + 1;
      
      // First create the step
      const stepResult = await apiService.createStep(selectedFlow.id, nextStepNumber, newStep.parentStepId, newStep.questionText);
      
      // If this step is linked to multiple options, update all of them
      if (newStep.linkedOptionIds.length > 0) {
        console.log(`🔗 Linking step ${stepResult.step.id} to ${newStep.linkedOptionIds.length} options:`, newStep.linkedOptionIds);
        
        // Update all selected options to link to this new step
        for (const optionId of newStep.linkedOptionIds) {
          const option = flowOptions.find(opt => opt.option_id === optionId);
          if (option) {
            console.log(`🔗 Updating option ${optionId} (${option.option_text}) to link to step ${stepResult.step.id}`);
            await apiService.updateOption(
              optionId,
              option.option_text,
              option.response_text,
              stepResult.step.id, // Link to the new step
              option.is_back_option,
              option.is_final_response
            );
          }
        }
      }
      
      await handleSelectFlow(selectedFlow);
      setNewStep({ questionText: '', parentStepId: null, linkedOptionIds: [] });
      setShowAddStep(false);
      alert('Paso creado exitosamente');
    } catch (err: any) {
      alert('Error creando paso: ' + err.message);
    }
  };

  const handleCreateOption = async () => {
    console.log(`🔧 [FRONTEND] handleCreateOption called:`, {
      editingStep: editingStep ? { id: editingStep.id, question_text: editingStep.question_text } : null,
      newOption,
      selectedFlow: selectedFlow ? { id: selectedFlow.id, flow_name: selectedFlow.flow_name } : null
    });

    if (!editingStep || !newOption.optionText.trim() || !newOption.responseText.trim()) {
      console.log(`❌ [FRONTEND] Validation failed:`, {
        hasEditingStep: !!editingStep,
        hasOptionText: !!newOption.optionText.trim(),
        hasResponseText: !!newOption.responseText.trim()
      });
      alert('Por favor completa todos los campos');
      return;
    }
    
    try {
      const nextOptionNumber = (editingStep.options?.length || 0) + 1;
      console.log(`🔧 [FRONTEND] Creating option with:`, {
        stepId: editingStep.id,
        nextOptionNumber,
        optionText: newOption.optionText,
        responseText: newOption.responseText,
        nextStepId: newOption.nextStepId,
        isBackOption: newOption.isBackOption,
        isFinalResponse: newOption.isFinalResponse
      });

      await apiService.createOption(editingStep.id, nextOptionNumber, newOption.optionText, newOption.responseText, newOption.nextStepId, newOption.isBackOption, newOption.isFinalResponse);
      console.log(`✅ [FRONTEND] Option created successfully, refreshing flow...`);
      await handleSelectFlow(selectedFlow);
      setNewOption({ optionText: '', responseText: '', nextStepId: null, isBackOption: false, isFinalResponse: false });
      setShowAddOption(false);
      alert('Opción creada exitosamente');
    } catch (err: any) {
      console.error(`❌ [FRONTEND] Error creating option:`, err);
      alert('Error creando opción: ' + err.message);
    }
  };

  const handleUpdateStep = async () => {
    if (!editingStep || !editingStep.question_text.trim()) {
      alert('Por favor ingresa el texto de la pregunta');
      return;
    }
    
    try {
      await apiService.updateStep(editingStep.id, editingStep.question_text);
      await handleSelectFlow(selectedFlow);
      setEditingStep(null);
      alert('Paso actualizado exitosamente');
    } catch (err: any) {
      alert('Error actualizando paso: ' + err.message);
    }
  };

  const handleUpdateOption = async () => {
    if (!editingOption || !editingOption.option_text.trim() || !editingOption.response_text.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    try {
      await apiService.updateOption(editingOption.id, editingOption.option_text, editingOption.response_text, editingOption.next_step_id, editingOption.is_back_option, editingOption.is_final_response);
      await handleSelectFlow(selectedFlow);
      setEditingOption(null);
      alert('Opción actualizada exitosamente');
    } catch (err: any) {
      alert('Error actualizando opción: ' + err.message);
    }
  };

  const handleDeleteStep = async (stepId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este paso?')) return;
    
    try {
      await apiService.deleteStep(stepId);
      await handleSelectFlow(selectedFlow);
      alert('Paso eliminado exitosamente');
    } catch (err: any) {
      alert('Error eliminando paso: ' + err.message);
    }
  };

  const handleDeleteOption = async (optionId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta opción?')) return;
    
    try {
      await apiService.deleteOption(optionId);
      await handleSelectFlow(selectedFlow);
      alert('Opción eliminada exitosamente');
    } catch (err: any) {
      alert('Error eliminando opción: ' + err.message);
    }
  };





  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <span className="text-green-500 text-3xl">📱</span>
            <span>WhatsApp Bot</span>
          </h1>
          <p className="text-gray-400 mt-1">Automate WhatsApp messages and responses</p>
        </div>
        <div className="flex items-center space-x-3">
          {whatsappStatus ? (
            <div className={`flex items-center space-x-2 ${whatsappStatus.isReady ? 'bg-green-500/10 border-green-500/20' : whatsappStatus.qrCode ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-lg px-3 py-2`}>
              <div className={`w-2 h-2 ${whatsappStatus.isReady ? 'bg-green-500' : whatsappStatus.qrCode ? 'bg-yellow-500' : 'bg-red-500'} rounded-full`}></div>
              <span className={`${whatsappStatus.isReady ? 'text-green-400' : whatsappStatus.qrCode ? 'text-yellow-400' : 'text-red-400'} text-sm font-medium`}>
                {whatsappStatus.isReady ? 'Connected' : whatsappStatus.qrCode ? 'Waiting for QR' : 'Disconnected'}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 bg-gray-500/10 border border-gray-500/20 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-gray-400 text-sm font-medium">Loading...</span>
            </div>
          )}
          
          {!whatsappStatus?.isReady ? (
            <button 
              onClick={handleInitializeWhatsApp}
              disabled={loading}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Initialize WhatsApp'}
            </button>
          ) : (
            <button 
              onClick={handleDisconnectWhatsApp}
              disabled={loading}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'connect', label: 'Connection', icon: '🔗' },
            { id: 'welcome', label: 'Welcome Message', icon: '👋' },
            { id: 'flows', label: 'Conversation Flows', icon: '🔄' },
            { id: 'messages', label: 'Send Messages', icon: '💬' },
            { id: 'broadcast', label: 'Broadcast', icon: '📢' },
            { id: 'config', label: 'Configuration', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'connect' | 'messages' | 'broadcast' | 'analytics' | 'welcome' | 'flows' | 'config')}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Connection Tab */}
      {activeTab === 'connect' && (
        <div className="space-y-6">
          {!whatsappStatus?.isReady && !whatsappStatus?.qrCode && !loading ? (
            <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
              <div className="max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-white mb-4">Connect WhatsApp</h3>
                <p className="text-gray-400 mb-8">
                  Initialize the WhatsApp Bot to get started
                </p>
                
                <button 
                  onClick={handleInitializeWhatsApp}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 mx-auto disabled:opacity-50"
                >
                  <span>📱</span>
                  <span>{loading ? 'Initializing...' : 'Initialize WhatsApp'}</span>
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="bg-gray-800 rounded-xl p-8 border border-blue-500/20 text-center">
              <div className="max-w-md mx-auto">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <h3 className="text-2xl font-bold text-white mb-4">Initializing WhatsApp Bot...</h3>
                <p className="text-gray-400">
                  Please wait while we set up your WhatsApp connection
                </p>
              </div>
            </div>
          ) : whatsappStatus?.qrCode ? (
            <div className="bg-gray-800 rounded-xl p-8 border border-yellow-500/20 text-center">
              <div className="max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-white mb-4">Scan QR Code</h3>
                <p className="text-gray-400 mb-6">
                  Open WhatsApp on your phone and scan this QR code to connect
                </p>
                
                {/* QR Code Display */}
                <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-64 h-64 flex items-center justify-center">
                  <img 
                    src={whatsappStatus.qrCode} 
                    alt="WhatsApp QR Code" 
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <div className="text-left space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                    <p className="text-gray-300">Open WhatsApp on your phone</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                    <p className="text-gray-300">Tap Menu or Settings and select Linked Devices</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                    <p className="text-gray-300">Tap "Link a Device" and scan this QR code</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-xl p-8 border border-green-500/20 text-center">
              <div className="text-green-500 text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-white mb-2">WhatsApp Connected!</h3>
              <p className="text-gray-400 mb-6">Your WhatsApp account is now connected and ready for automation</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-green-500 text-3xl mb-3">⚙️</div>
                  <h4 className="font-bold text-white mb-2">Auto-Responders</h4>
                  <p className="text-gray-400 text-sm">Set up automatic replies for common inquiries</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-blue-500 text-3xl mb-3">💬</div>
                  <h4 className="font-bold text-white mb-2">Send Messages</h4>
                  <p className="text-gray-400 text-sm">Send individual messages to contacts</p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-purple-500 text-3xl mb-3">📢</div>
                  <h4 className="font-bold text-white mb-2">Broadcast</h4>
                  <p className="text-gray-400 text-sm">Send messages to all your contacts</p>
                </div>
              </div>

              <button 
                onClick={handleDisconnectWhatsApp}
                disabled={loading}
                className="mt-6 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Disconnecting...' : 'Disconnect WhatsApp'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Welcome Message Tab */}
      {activeTab === 'welcome' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Welcome Message</h2>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-400">
                {whatsappStatus?.isReady ? '✅ Ready to send welcome messages' : '❌ WhatsApp not connected'}
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={welcomeEnabled}
                  onChange={(e) => setWelcomeEnabled(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-gray-300">Enable Welcome Message</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Welcome Message Configuration */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Welcome Message Configuration</h3>
              
              {/* Welcome Message Text */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Welcome Message</label>
                <textarea
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                  rows={4}
                  placeholder="Enter your welcome message..."
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveWelcomeMessage}
                disabled={loading || !whatsappStatus?.isReady}
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 mb-4"
              >
                {loading ? 'Saving...' : '💾 Save Welcome Message'}
              </button>

              {/* Test Section */}
              <div className="border-t border-gray-700 pt-4">
                <h4 className="text-lg font-medium text-white mb-4">🧪 Test Welcome Message</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Test Phone Number</label>
                    <input
                      type="text"
                      value={messageTo}
                      onChange={(e) => setMessageTo(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                      placeholder="e.g., 1234567890@c.us"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleTestWelcomeMessage}
                      disabled={loading || !whatsappStatus?.isReady || !messageTo.trim()}
                      className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                      {loading ? 'Testing...' : '🧪 Test Welcome Message'}
                    </button>
                    
                    <button
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const result = await apiService.clearWelcomeHistory();
                          if (result.success) {
                            alert('Welcome message history cleared! Now you can test with any phone number.');
                          }
                        } catch (err: any) {
                          setError(err.message);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading || !whatsappStatus?.isReady}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                    >
                      {loading ? 'Clearing...' : '🧹 Clear History'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Preview */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Message Preview</h3>
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 h-96 overflow-y-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                  {getWelcomeMessagePreview()}
                </pre>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-400 mb-2">👋 Welcome Message Features:</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• <strong>Automatic:</strong> Sent automatically when someone starts a conversation</li>
              <li>• <strong>Interactive:</strong> Includes buttons or list options for easy navigation</li>
              <li>• <strong>Customizable:</strong> Fully configurable message and options</li>
              <li>• <strong>Smart:</strong> Only sent to new conversations, not repeated messages</li>
              <li>• <strong>Responsive:</strong> Works with both WhatsApp Normal and Business</li>
              <li>• <strong>Dynamic Flows:</strong> Automatically includes all active conversation flows</li>
            </ul>
            
            {getActiveFlowsCount() > 0 && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-sm font-medium text-blue-400 mb-2">🔄 Flows Integration:</h4>
                <p className="text-sm text-gray-300">
                  <strong>{getActiveFlowsCount()} flujo(s) activo(s)</strong> se incluirán automáticamente en el mensaje de bienvenida.
                  Los usuarios podrán seleccionar estos flujos para iniciar conversaciones guiadas.
                </p>
              </div>
            )}
            
            {/* Message Preview */}
            <div className="mt-4 p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
              <h4 className="text-sm font-medium text-gray-300 mb-2">👁️ Vista Previa del Mensaje:</h4>
              <div className="bg-gray-800 border border-gray-600 rounded p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                  {getWelcomeMessagePreview()}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}





      {activeTab === 'messages' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Send WhatsApp Messages</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Send to Phone Number */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Send to Phone Number</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={messageTo}
                    onChange={(e) => setMessageTo(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                    placeholder="e.g., 1234567890@c.us"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                    rows={3}
                    placeholder="Enter your message"
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !messageTo.trim() || !messageText.trim()}
                  className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>

            {/* Send to Contact */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Send to Contact</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Contact Name</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                    rows={3}
                    placeholder="Enter your message"
                  />
                </div>
                <button
                  onClick={handleSendToContact}
                  disabled={loading || !contactName.trim() || !messageText.trim()}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send to Contact'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Broadcast Message</h2>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Broadcast Message</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-green-500"
                  rows={4}
                  placeholder="Enter your broadcast message"
                />
              </div>
              <button
                onClick={handleBroadcast}
                disabled={loading || !broadcastMessage.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {loading ? 'Broadcasting...' : '📢 Send Broadcast'}
              </button>
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-400 mb-2">💡 How WhatsApp Bot Works:</h3>
            <ol className="text-sm text-gray-300 space-y-1">
              <li>1. Initialize WhatsApp Bot (scan QR code with your phone)</li>
              <li>2. Create auto-reply rules in the "Auto-Reply Rules" tab</li>
              <li>3. When someone sends a message containing trigger words, bot responds automatically</li>
              <li>4. Send individual messages or broadcast to all contacts</li>
              <li>5. Monitor all incoming messages and auto-replies</li>
            </ol>
          </div>
        </div>
      )}



      {/* Conversation Flows Tab */}
      {activeTab === 'flows' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Conversation Flows</h2>
            <div className="text-sm text-gray-400">
              Create and manage conversation flows with nested responses
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Flows List */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Flows</h3>
                <button
                  onClick={handleCreateFlow}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium"
                >
                  + New Flow
                </button>
              </div>
              
              <div className="space-y-2">
                {flows.map((flow) => (
                  <div
                    key={flow.id}
                    className={`p-3 rounded-lg transition-colors ${
                      selectedFlow?.id === flow.id
                        ? 'bg-blue-500/20 border border-blue-500/30'
                        : 'bg-gray-700/50 hover:bg-gray-700'
                    }`}
                  >
                    <div 
                      onClick={() => handleSelectFlow(flow)}
                      className="cursor-pointer"
                    >
                      <div className="font-medium text-white">{flow.flow_name}</div>
                      <div className="text-sm text-gray-400">
                        {selectedFlow?.id === flow.id ? `${selectedFlow.steps?.length || 0} steps` : 'Click to view'}
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFlow(flow.id, flow.flow_name);
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-medium"
                        title="Eliminar flujo completo"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
                {flows.length === 0 && (
                  <div className="text-gray-400 text-center py-4">
                    No flows created yet
                  </div>
                )}
              </div>
            </div>

            {/* Flow Details */}
            <div className="lg:col-span-2 bg-gray-800 border border-gray-700 rounded-lg p-6">
              {selectedFlow ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">{selectedFlow.flow_name}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={async () => {
                          const phoneNumber = prompt('Ingresa el número de teléfono para probar el flujo (ej: 1234567890):');
                          if (phoneNumber) {
                            try {
                              await apiService.startConversationFlow(selectedFlow.id, phoneNumber);
                              alert('Flujo iniciado exitosamente');
                            } catch (err: any) {
                              alert('Error iniciando flujo: ' + err.message);
                            }
                          }
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium"
                      >
                        🧪 Test Flow
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const result = await apiService.fixBackOptions(selectedFlow.id);
                            if (result.success) {
                              alert(`✅ ${result.message}`);
                              await handleSelectFlow(selectedFlow);
                            }
                          } catch (err: any) {
                            alert('Error arreglando opciones de volver: ' + err.message);
                          }
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg text-sm font-medium"
                        title="Arreglar opciones 'Volver' que no funcionan"
                      >
                        🔧 Fix Back
                      </button>
                      <button
                        onClick={() => setShowAddStep(true)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium"
                      >
                        + Add Step
                      </button>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="space-y-4">
                    {selectedFlow.steps && selectedFlow.steps.length > 0 ? (
                      selectedFlow.steps.map((step: any) => (
                      <div key={step.id} className="bg-gray-700/50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            {editingStep?.id === step.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editingStep.question_text}
                                  onChange={(e) => setEditingStep((prev: any) => prev ? { ...prev, question_text: e.target.value } : null)}
                                  className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                                />
                                <div className="flex space-x-2">
                                  <button
                                    onClick={handleUpdateStep}
                                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingStep(null)}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center">
                                <h4 className="font-medium text-white">
                                  Step {step.step_number}: {step.question_text}
                                </h4>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => setEditingStep(step)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStep(step.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Options:</span>
                            <button
                              onClick={() => {
                                setEditingStep(step);
                                setShowAddOption(true);
                              }}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                            >
                              + Add Option
                            </button>
                          </div>
                          
                          {step.options?.map((option: any) => (
                            <div key={option.id} className="bg-gray-600/50 rounded p-3">
                              {editingOption?.id === option.id ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={editingOption.option_text}
                                    onChange={(e) => setEditingOption((prev: any) => prev ? { ...prev, option_text: e.target.value } : null)}
                                    className="w-full bg-gray-500 border border-gray-400 rounded px-2 py-1 text-white text-sm"
                                    placeholder="Option text"
                                  />
                                  <textarea
                                    value={editingOption.response_text}
                                    onChange={(e) => setEditingOption((prev: any) => prev ? { ...prev, response_text: e.target.value } : null)}
                                    className="w-full bg-gray-500 border border-gray-400 rounded px-2 py-1 text-white text-sm"
                                    rows={2}
                                    placeholder="Response text"
                                  />
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={handleUpdateOption}
                                      className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingOption(null)}
                                      className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-medium text-white text-sm">
                                      {option.option_number}. {option.option_text}
                                      {option.is_back_option && <span className="text-blue-400 ml-2">← Back</span>}
                                      {option.is_final_response && <span className="text-red-400 ml-2">🏁 Final</span>}
                                    </div>
                                    <div className="text-gray-400 text-xs mt-1">
                                      {option.response_text.substring(0, 100)}...
                                    </div>
                                  </div>
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => setEditingOption(option)}
                                      className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-xs"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteOption(option.id)}
                                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        No steps created yet. Click "Add Step" to create the first step.
                      </div>
                    )}
                  </div>

                  {/* Add Step Form */}
                  {showAddStep && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-3">Add New Step</h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newStep.questionText}
                          onChange={(e) => setNewStep(prev => ({ ...prev, questionText: e.target.value }))}
                          className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                          placeholder="Enter question text"
                        />
                        
                        {/* Link to existing options */}
                        {flowOptions.length > 0 && (
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-300">
                              🔗 Link this step to existing options (optional):
                            </label>
                            <div className="max-h-40 overflow-y-auto border border-gray-500 rounded bg-gray-600 p-2">
                              {flowOptions.map((option) => (
                                <label key={option.option_id} className="flex items-center space-x-2 py-1 hover:bg-gray-500/30 rounded px-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={newStep.linkedOptionIds.includes(option.option_id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setNewStep(prev => ({
                                          ...prev,
                                          linkedOptionIds: [...prev.linkedOptionIds, option.option_id]
                                        }));
                                      } else {
                                        setNewStep(prev => ({
                                          ...prev,
                                          linkedOptionIds: prev.linkedOptionIds.filter(id => id !== option.option_id)
                                        }));
                                      }
                                    }}
                                    className="rounded"
                                  />
                                  <span className="text-sm text-gray-300">
                                    Step {option.step_number}: "{option.question_text.substring(0, 30)}..." → {option.option_number}. {option.option_text}
                                    {option.next_step_id ? ' (already linked)' : ' (not linked)'}
                                  </span>
                                </label>
                              ))}
                            </div>
                            {newStep.linkedOptionIds.length > 0 && (
                              <div className="text-xs text-blue-400 bg-blue-500/10 p-2 rounded">
                                ✅ This step will be linked to {newStep.linkedOptionIds.length} selected option{newStep.linkedOptionIds.length > 1 ? 's' : ''}. When users choose any of these options, they'll go to this new step.
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={handleCreateStep}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Create Step
                          </button>
                          <button
                            onClick={() => {
                              setShowAddStep(false);
                              setNewStep({ questionText: '', parentStepId: null, linkedOptionIds: [] });
                            }}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Option Form */}
                  {showAddOption && editingStep && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-3">Add New Option to Step {editingStep.step_number}</h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={newOption.optionText}
                          onChange={(e) => setNewOption(prev => ({ ...prev, optionText: e.target.value }))}
                          className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                          placeholder="Option text"
                        />
                        <textarea
                          value={newOption.responseText}
                          onChange={(e) => setNewOption(prev => ({ ...prev, responseText: e.target.value }))}
                          className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                          rows={3}
                          placeholder="Response text"
                        />
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isBackOption"
                            checked={newOption.isBackOption}
                            onChange={(e) => setNewOption(prev => ({ ...prev, isBackOption: e.target.checked }))}
                            className="rounded"
                          />
                          <label htmlFor="isBackOption" className="text-sm text-gray-300">
                            This is a "Back" option
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isFinalResponse"
                            checked={newOption.isFinalResponse}
                            onChange={(e) => setNewOption(prev => ({ ...prev, isFinalResponse: e.target.checked }))}
                            className="rounded"
                          />
                          <label htmlFor="isFinalResponse" className="text-sm text-gray-300">
                            This is a final response (ends conversation)
                          </label>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleCreateOption}
                            className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Create Option
                          </button>
                          <button
                            onClick={() => {
                              setShowAddOption(false);
                              setNewOption({ optionText: '', responseText: '', nextStepId: null, isBackOption: false, isFinalResponse: false });
                            }}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">Select a flow to view and edit</div>
                  <button
                    onClick={handleCreateFlow}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    Create Your First Flow
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-400 mb-2">🔄 Conversation Flow Features:</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• <strong>Nested Responses:</strong> Create unlimited levels of questions and responses</li>
              <li>• <strong>Back Navigation:</strong> Users can go back to previous questions</li>
              <li>• <strong>Numbered Options:</strong> Users respond with numbers (1, 2, 3...)</li>
              <li>• <strong>Validation:</strong> Invalid responses show error messages</li>
              <li>• <strong>Flow Management:</strong> Create, edit, and delete steps and options</li>
            </ul>
          </div>
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">Bot Configuration</h3>
            
            {botConfig && (
              <div className="space-y-6">
                {/* Process Old Messages Setting */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-white mb-2">Process Old Messages</h4>
                      <p className="text-gray-400 text-sm">
                        Control whether the bot processes messages received before it was started
                      </p>
                    </div>
                    <div className="flex items-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={botConfig.processOldMessages}
                          onChange={(e) => updateBotConfig(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="bg-gray-600/50 rounded p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`w-3 h-3 rounded-full ${botConfig.processOldMessages ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
                      <span className="text-sm font-medium text-white">
                        {botConfig.processOldMessages ? '⚠️ Processing ALL messages' : '✅ Only processing NEW messages'}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      {botConfig.processOldMessages 
                        ? 'The bot will respond to all messages, including those received before it was started. This may result in unwanted responses to old messages.'
                        : 'The bot will only respond to messages received after it was started. This prevents unwanted responses to old messages.'
                      }
                    </p>
                  </div>
                </div>

                {/* Bot Status Information */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Bot Status</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${botConfig.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-gray-300">Connection Status:</span>
                      <span className={`font-medium ${botConfig.isConnected ? 'text-green-400' : 'text-red-400'}`}>
                        {botConfig.isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${botConfig.isReady ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span className="text-gray-300">Bot Status:</span>
                      <span className={`font-medium ${botConfig.isReady ? 'text-green-400' : 'text-yellow-400'}`}>
                        {botConfig.isReady ? 'Ready' : 'Initializing'}
                      </span>
                    </div>
                  </div>
                  
                  {botConfig.botStartTime && (
                    <div className="mt-4 pt-4 border-t border-gray-600">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-300">Bot Started:</span>
                        <span className="text-white font-mono text-sm">
                          {new Date(botConfig.botStartTime).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-blue-400 mb-2">💡 Recommendations:</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• <strong>Keep "Process Old Messages" OFF</strong> to avoid unwanted responses to old messages</li>
                    <li>• <strong>Only enable it temporarily</strong> if you specifically need to process old messages</li>
                    <li>• <strong>Restart the bot</strong> after changing this setting for it to take effect</li>
                    <li>• <strong>Monitor the logs</strong> to see which messages are being processed or ignored</li>
                  </ul>
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Updating configuration...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}


    </div>
  );
};

export default WhatsAppBot;
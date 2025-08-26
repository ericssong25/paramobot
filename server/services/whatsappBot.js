const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { getDatabase } = require('../database/init');
const ConversationFlowService = require('./conversationFlowService');

class WhatsAppBot {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isReady = false;
    this.db = getDatabase();
    this.messageRules = new Map();
    this.autoResponses = new Map();
    this.qrCodeDataUrl = null;
    this.statusCallbacks = [];
    this.welcomeConfig = {
      message: '¡Hola! Bienvenido a nuestro chat. ¿En qué puedo ayudarte? 😊',
      type: 'buttons',
      options: ['Ver productos', 'Consultar precios', 'Contactar'],
      enabled: true
    };
    this.flowConfig = {
      endMessage: '🏁 Conversación finalizada. ¡Gracias por tu tiempo!',
      backMessage: 'Volviendo al menú anterior...',
      errorMessage: '❌ Por favor, responde con un número válido (1, 2, 3...).'
    };
    this.seenContacts = new Set();
    this.lastResponses = new Map(); // Track last response sent to each user
    this.flowService = new ConversationFlowService();
    this.userFlows = new Map(); // Track current flow step for each user
    this.userNestedStates = new Map(); // Track nested response state for each user
    this.userNavigationHistory = new Map(); // Track user navigation history
    this.botStartTime = null; // Track when the bot started to ignore old messages
  }

  // Add callback for status updates
  onStatusUpdate(callback) {
    this.statusCallbacks.push(callback);
  }

  // Emit status update to all callbacks
  emitStatusUpdate(status) {
    this.statusCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }

  async initialize(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Initializing WhatsApp Bot... (Attempt ${attempt}/${maxRetries})`);
        
        // Create WhatsApp client
        this.client = new Client({
          authStrategy: new LocalAuth(),
          puppeteer: {
            headless: true,
            args: [
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-gpu',
              '--no-zygote',
              '--single-process',
              '--disable-extensions',
              '--disable-plugins',
              '--disable-images',
              '--disable-javascript',
              '--disable-background-networking',
              '--disable-sync',
              '--disable-translate',
              '--hide-scrollbars',
              '--mute-audio',
              '--no-first-run',
              '--disable-default-apps',
              '--disable-web-security',
              '--disable-features=VizDisplayCompositor',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
              '--disable-field-trial-config',
              '--disable-ipc-flooding-protection',
              '--no-default-browser-check',
              '--disable-software-rasterizer',
              '--disable-features=TranslateUI',
              '--disable-hang-monitor',
              '--disable-prompt-on-repost',
              '--disable-client-side-phishing-detection',
              '--disable-component-extensions-with-background-pages',
              '--disable-domain-reliability',
              '--disable-features=AudioServiceOutOfProcess',
              '--disable-print-preview',
              '--force-color-profile=srgb',
              '--metrics-recording-only',
              '--safebrowsing-disable-auto-update',
              '--enable-automation',
              '--password-store=basic',
              '--use-mock-keychain',
              '--disable-blink-features=AutomationControlled',
              '--memory-pressure-off',
              '--max_old_space_size=512',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
              '--disable-features=TranslateUI',
              '--disable-ipc-flooding-protection',
              '--disable-hang-monitor',
              '--disable-prompt-on-repost',
              '--disable-client-side-phishing-detection',
              '--disable-component-extensions-with-background-pages',
              '--disable-domain-reliability',
              '--disable-features=AudioServiceOutOfProcess',
              '--disable-print-preview',
              '--force-color-profile=srgb',
              '--metrics-recording-only',
              '--safebrowsing-disable-auto-update',
              '--enable-automation',
              '--password-store=basic',
              '--use-mock-keychain',
              '--disable-blink-features=AutomationControlled'
            ],
            timeout: 300000,
            protocolTimeout: 300000,
            executablePath: process.env.CHROME_BIN || undefined
          }
        });



      // Handle authentication
      this.client.on('authenticated', () => {
        console.log('🔐 WhatsApp authenticated successfully');
        this.qrCodeDataUrl = null;
        
        // Emit status update
        this.emitStatusUpdate({
          isConnected: false,
          isReady: false,
          qrCode: null,
          message: 'Authenticating...'
        });
      });

      // Handle authentication failure
      this.client.on('auth_failure', (msg) => {
        console.error('❌ WhatsApp authentication failed:', msg);
        this.isConnected = false;
        this.qrCodeDataUrl = null;
        
        // Emit status update
        this.emitStatusUpdate({
          isConnected: false,
          isReady: false,
          qrCode: null,
          message: 'Authentication failed'
        });
      });

      // Handle disconnection
      this.client.on('disconnected', (reason) => {
        console.log('🔌 WhatsApp disconnected:', reason);
        this.isConnected = false;
        this.isReady = false;
        this.qrCodeDataUrl = null;
        
        // Emit status update
        this.emitStatusUpdate({
          isConnected: false,
          isReady: false,
          qrCode: null,
          message: 'Disconnected: ' + reason
        });
      });

      // Handle incoming messages
      this.client.on('message', async (message) => {
        await this.handleIncomingMessage(message);
      });

      // Handle QR code generation
      this.client.on('qr', async (qr) => {
        console.log('📱 QR Code received, generating for frontend...');
        try {
          // Generate QR code as data URL for frontend
          this.qrCodeDataUrl = await qrcode.toDataURL(qr, {
            width: 300,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          // Emit status update with QR code
          this.emitStatusUpdate({
            isConnected: false,
            isReady: false,
            qrCode: this.qrCodeDataUrl,
            message: 'Scan QR code with WhatsApp'
          });
        } catch (error) {
          console.error('Error generating QR code:', error);
        }
      });

      // Handle ready event
      this.client.on('ready', async () => {
        console.log('✅ WhatsApp Bot is ready!');
        this.isReady = true;
        this.isConnected = true;
        this.qrCodeDataUrl = null;
        this.botStartTime = new Date(); // Set the bot start time
        console.log(`🕐 Bot started at: ${this.botStartTime.toISOString()}`);
        console.log('📝 Only messages received after this time will be processed');
        
        try {
          await this.loadMessageRules();
          await this.getWelcomeMessage(); // Load welcome message configuration
          await this.getFlowConfig(); // Load flow configuration
          
          // Debug flows on startup
          const flows = await this.flowService.getAllFlows();
          const activeFlows = flows.filter(flow => flow.is_active);
          console.log(`📋 Flows loaded: ${flows.length} total, ${activeFlows.length} active`);
          
          for (const flow of activeFlows) {
            const flowWithSteps = await this.flowService.getFlowWithSteps(flow.id);
            console.log(`  🔄 Flow "${flow.flow_name}" (ID: ${flow.id}): ${flowWithSteps.steps.length} steps`);
            
            for (const step of flowWithSteps.steps) {
              console.log(`    📝 Step ${step.step_number}: "${step.question_text}" (${step.options.length} options)`);
              
              for (const option of step.options) {
                console.log(`      ${option.option_number}. "${option.option_text}" -> Step ${option.next_step_id || 'END'}`);
              }
            }
          }
        } catch (error) {
          console.error('❌ Error loading configurations:', error);
        }
        
        // Emit final status update
        this.emitStatusUpdate({
          isConnected: true,
          isReady: true,
          qrCode: null,
          message: 'WhatsApp connected successfully!'
        });
      });





        // Initialize the client
        await this.client.initialize();
        
        console.log(`✅ WhatsApp Bot initialized successfully on attempt ${attempt}`);
        return true;
        
      } catch (error) {
        console.error(`❌ Error initializing WhatsApp Bot (Attempt ${attempt}/${maxRetries}):`, error);
        
        // Clean up client if it exists
        if (this.client) {
          try {
            await this.client.destroy();
          } catch (destroyError) {
            console.error('Error destroying client:', destroyError);
          }
          this.client = null;
        }
        
        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const waitTime = attempt * 5000; // 5s, 10s, 15s
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          // Last attempt failed
          console.error('❌ All initialization attempts failed');
          
          // Emit error status
          this.emitStatusUpdate({
            isConnected: false,
            isReady: false,
            qrCode: null,
            message: 'Initialization failed after ' + maxRetries + ' attempts: ' + error.message
          });
          
          return false;
        }
      }
    }
  }

  async loadMessageRules() {
    try {
      // Load message rules from database
      const rules = await new Promise((resolve, reject) => {
        this.db.all('SELECT * FROM whatsapp_rules WHERE is_active = 1', (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      // Clear existing rules
      this.messageRules.clear();
      this.autoResponses.clear();

      // Load rules into memory
      rules.forEach(rule => {
        this.messageRules.set(rule.trigger_text.toLowerCase(), rule);
        this.autoResponses.set(rule.trigger_text.toLowerCase(), rule.response_text);
      });

      console.log(`📋 Loaded ${rules.length} WhatsApp message rules`);
    } catch (error) {
      console.error('❌ Error loading message rules:', error);
    }
  }

  async handleIncomingMessage(message) {
    try {
      // Skip messages from self
      if (message.fromMe) return;

      // Skip messages from groups
      const ignoreGroupMessages = process.env.IGNORE_GROUP_MESSAGES !== 'false';
      if (ignoreGroupMessages && message.from.endsWith('@g.us')) {
        console.log(`👥 Ignoring group message from ${message.from}: "${message.body}"`);
        return;
      }

      // Check if this is an old message (received before bot started)
      const processOldMessages = process.env.PROCESS_OLD_MESSAGES === 'true';
      if (!processOldMessages && this.botStartTime && message.timestamp * 1000 < this.botStartTime.getTime()) {
        console.log(`⏰ Ignoring old message from ${message.from} (timestamp: ${new Date(message.timestamp * 1000).toISOString()}, bot started: ${this.botStartTime.toISOString()})`);
        return;
      }

      const messageText = message.body.toLowerCase();
      const sender = message.from;
      const chat = message.getChat();

      console.log(`📨 New message from ${sender}: "${message.body}"`);

      // Check if this is a new conversation (first message from this contact)
      const isNewConversation = !this.seenContacts.has(sender);
      
      // Send welcome message for new conversations
      if (isNewConversation) {
        await this.sendWelcomeMessage(sender);
        return; // Don't process rules for new conversations
      }

      // Check if user is in a conversation flow (priority over welcome message)
      if (this.userFlows.has(sender)) {
        const flowState = this.userFlows.get(sender);
        console.log(`🔄 User ${sender} is in flow state:`, flowState);
        const flowHandled = await this.handleFlowResponse(sender, message.body, flowState);
        if (flowHandled) {
          return;
        }
      }

      // Check if this is a number response to welcome message
      const numberMatch = message.body.match(/^[1-9]\d*$/);
      if (numberMatch && this.welcomeConfig && this.welcomeConfig.enabled) {
        console.log(`🔢 Detected number response to welcome message: ${message.body}`);
        await this.handleNumberResponse(sender, message.body, this.welcomeConfig.options);
        return;
      }

      // Check if user is in a nested response state
      if (this.userNestedStates.has(sender)) {
        const nestedState = this.userNestedStates.get(sender);
        const nestedHandled = await this.handleNestedFlowResponse(sender, message.body, nestedState);
        if (nestedHandled) {
          return;
        }
      }

      // Check if this is a nested response (after a conditional response)
      // We need to track the last response sent to each user
      if (this.lastResponses && this.lastResponses.has(sender)) {
        const lastResponse = this.lastResponses.get(sender);
        const nestedResponse = await this.handleNestedResponse(sender, message.body, lastResponse);
        if (nestedResponse) {
          return;
        }
      }

      // Check if message matches any rule
      let matchedRule = null;
      for (const [trigger, rule] of this.messageRules) {
        if (messageText.includes(trigger)) {
          matchedRule = rule;
          break;
        }
      }

      if (matchedRule) {
        console.log(`🎯 Rule matched! Trigger: "${matchedRule.trigger_text}" -> Response: "${matchedRule.response_text}"`);
        
        // Send automatic response
        await this.sendMessage(sender, matchedRule.response_text);
        
        // Update match count in database
        this.db.run(
          'UPDATE whatsapp_rules SET match_count = match_count + 1 WHERE id = ?',
          [matchedRule.id]
        );
        
        console.log(`✅ Auto-response sent to ${sender}`);
      } else {
        console.log(`⚠️ No matching rule found for message: "${message.body}"`);
      }

      // Record message in analytics
      this.recordMessageAnalytics(sender, message.body, matchedRule ? matchedRule.id : null);

    } catch (error) {
      console.error('❌ Error handling incoming message:', error);
    }
  }

  async sendMessage(to, message) {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp Bot is not ready');
      }

      await this.client.sendMessage(to, message);
      return true;
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      return false;
    }
  }

  async sendMessageToContact(contactName, message) {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp Bot is not ready');
      }

      // Search for contact by name
      const contacts = await this.client.getContacts();
      const contact = contacts.find(c => c.name === contactName || c.pushname === contactName);
      
      if (!contact) {
        throw new Error(`Contact "${contactName}" not found`);
      }

      await this.client.sendMessage(contact.id._serialized, message);
      return true;
    } catch (error) {
      console.error('❌ Error sending message to contact:', error);
      return false;
    }
  }

  async broadcastMessage(message, contacts = []) {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp Bot is not ready');
      }

      let targetContacts = contacts;
      
      // If no contacts specified, get all contacts
      if (contacts.length === 0) {
        const allContacts = await this.client.getContacts();
        targetContacts = allContacts.filter(c => c.isMyContact);
      }

      let successCount = 0;
      for (const contact of targetContacts) {
        try {
          await this.client.sendMessage(contact.id._serialized, message);
          successCount++;
          console.log(`✅ Message sent to ${contact.name || contact.pushname}`);
        } catch (error) {
          console.error(`❌ Failed to send message to ${contact.name || contact.pushname}:`, error);
        }
      }

      return { successCount, totalCount: targetContacts.length };
    } catch (error) {
      console.error('❌ Error broadcasting message:', error);
      return { successCount: 0, totalCount: 0 };
    }
  }

  async sendInteractiveMessage(to, message, options, type) {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp Bot is not ready');
      }

      console.log(`🎯 Sending interactive message to ${to} (type: ${type})`);

      // For now, we'll send a formatted text message instead of interactive buttons
      // This works with both WhatsApp Normal and Business
      let formattedMessage = message + '\n\n';
      
      if (type === 'buttons') {
        const buttons = options.filter(btn => btn.trim() !== '');
        if (buttons.length === 0) {
          throw new Error('At least one button is required');
        }

        formattedMessage += 'Opciones disponibles:\n';
        buttons.forEach((button, index) => {
          formattedMessage += `${index + 1}️⃣ ${button}\n`;
        });
        formattedMessage += '\nResponde con el número de tu interés (1, 2, 3...)';

      } else if (type === 'list') {
        const listItems = options.filter(item => item.title.trim() !== '');
        if (listItems.length === 0) {
          throw new Error('At least one list item is required');
        }

        formattedMessage += 'Opciones disponibles:\n';
        listItems.forEach((item, index) => {
          formattedMessage += `${index + 1}️⃣ ${item.title}`;
          if (item.description) {
            formattedMessage += ` - ${item.description}`;
          }
          formattedMessage += '\n';
        });
        formattedMessage += '\nResponde con el número de tu interés (1, 2, 3...)';

      } else {
        throw new Error('Invalid interactive message type');
      }

      await this.client.sendMessage(to, formattedMessage);
      console.log(`✅ Formatted message sent to ${to}`);
      return true;

    } catch (error) {
      console.error('❌ Error sending interactive message:', error);
      
      // Fallback to regular text message
      try {
        console.log(`🔄 Falling back to regular text message for ${to}`);
        await this.client.sendMessage(to, message);
        return true;
      } catch (fallbackError) {
        console.error('❌ Fallback message also failed:', fallbackError);
        return false;
      }
    }
  }

  async saveWelcomeMessage(message, type, options, enabled) {
    try {
      this.welcomeConfig = {
        message,
        type,
        options,
        enabled
      };

      // Save to database
      await new Promise((resolve, reject) => {
        this.db.run(
          'INSERT OR REPLACE INTO bot_settings (setting_key, setting_value) VALUES (?, ?)',
          ['welcome_message', JSON.stringify(this.welcomeConfig)],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      console.log('✅ Welcome message saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error saving welcome message:', error);
      return false;
    }
  }

  async getWelcomeMessage() {
    try {
      // Try to get from database first
      const result = await new Promise((resolve, reject) => {
        this.db.get(
          'SELECT setting_value FROM bot_settings WHERE setting_key = ?',
          ['welcome_message'],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (result && result.setting_value) {
        this.welcomeConfig = JSON.parse(result.setting_value);
      }

      return this.welcomeConfig;
    } catch (error) {
      console.error('❌ Error getting welcome message:', error);
      return this.welcomeConfig;
    }
  }

  async getFlowConfig() {
    try {
      const [endMessage, backMessage, errorMessage] = await Promise.all([
        this.getSetting('flow_end_message'),
        this.getSetting('flow_back_message'),
        this.getSetting('flow_error_message')
      ]);

      this.flowConfig = {
        endMessage: endMessage || '🏁 Conversación finalizada. ¡Gracias por tu tiempo!',
        backMessage: backMessage || 'Volviendo al menú anterior...',
        errorMessage: errorMessage || '❌ Por favor, responde con un número válido (1, 2, 3...).'
      };

      return this.flowConfig;
    } catch (error) {
      console.error('❌ Error getting flow config:', error);
      return this.flowConfig;
    }
  }

  // Add step to user navigation history
  addToNavigationHistory(sender, stepId, stepNumber, questionText, flowId) {
    console.log(`📚 Adding to navigation history for ${sender}: Step ${stepNumber} (ID: ${stepId})`);
    
    if (!this.userNavigationHistory.has(sender)) {
      this.userNavigationHistory.set(sender, []);
      console.log(`📚 Created new navigation history for ${sender}`);
    }
    
    const history = this.userNavigationHistory.get(sender);
    console.log(`📚 Current history length for ${sender}: ${history.length}`);
    
    // Don't add duplicate consecutive steps, but allow if it's a fresh start
    const lastStep = history.length > 0 ? history[history.length - 1] : null;
    const isDuplicate = lastStep && lastStep.stepId === stepId;
    
    if (!isDuplicate) {
      history.push({
        stepId,
        stepNumber,
        questionText,
        flowId,
        timestamp: Date.now()
      });
      
      // Keep only last 10 steps to prevent memory issues
      if (history.length > 10) {
        history.shift();
      }
      
      console.log(`📚 Added to navigation history for ${sender}: Step ${stepNumber} (ID: ${stepId}). Total history: ${history.length} steps`);
      console.log(`📚 Full history for ${sender}:`, history);
    } else {
      console.log(`📚 Skipped adding duplicate step ${stepId} for ${sender}`);
    }
  }

  // Get previous step from navigation history
  getPreviousStep(sender) {
    if (!this.userNavigationHistory.has(sender)) {
      console.log(`📚 No navigation history found for ${sender}`);
      return null;
    }
    
    const history = this.userNavigationHistory.get(sender);
    console.log(`📚 Current navigation history for ${sender}:`, history);
    
    // Remove current step and get the previous one
    if (history.length > 1) {
      // More than 1 step, remove current and get previous
      history.pop(); // Remove current step
      const previousStep = history[history.length - 1];
      console.log(`📚 Navigation history for ${sender}: ${history.length} steps, previous: Step ${previousStep.stepNumber} (ID: ${previousStep.stepId})`);
      return previousStep;
    } else {
      // Only 1 step or less, return to welcome
      console.log(`📚 Navigation history for ${sender}: Returning to welcome message (${history.length} steps)`);
      return { type: 'welcome' };
    }
  }

  // Clear navigation history for a user
  clearNavigationHistory(sender) {
    this.userNavigationHistory.delete(sender);
    console.log(`📚 Cleared navigation history for ${sender}`);
  }

  // Debug function to show navigation history
  debugNavigationHistory(sender) {
    if (!this.userNavigationHistory.has(sender)) {
      console.log(`📚 No navigation history for ${sender}`);
      return;
    }
    
    const history = this.userNavigationHistory.get(sender);
    console.log(`📚 Navigation history for ${sender}:`, JSON.stringify(history, null, 2));
  }

  // Helper function to add "Volver al inicio" option to question text
  addVolverAlInicioOption(questionText, optionsCount) {
    const nextOptionNumber = optionsCount + 1;
    return questionText + `\n${nextOptionNumber}️⃣ Volver al inicio`;
  }

  // Function to completely restart conversation for a user (Volver al inicio)
  async restartConversation(sender) {
    console.log(`🏠 Restarting conversation completely for ${sender}`);
    
    // Clear all user state
    this.userFlows.delete(sender);
    this.clearNavigationHistory(sender);
    this.userNestedStates.delete(sender);
    this.seenContacts.delete(sender);
    
    // Verify state is cleared
    console.log(`🧹 State cleared for ${sender}:`, {
      hasFlow: this.userFlows.has(sender),
      hasHistory: this.userNavigationHistory.has(sender),
      hasNested: this.userNestedStates.has(sender),
      isSeen: this.seenContacts.has(sender)
    });
    
    // Send restart confirmation
    await this.sendMessage(sender, '🏠 Reiniciando conversación...');
    
    // Get available flows to create welcome message
    const flows = await this.flowService.getAllFlows();
    const activeFlows = flows.filter(flow => flow.is_active);
    
    // Create welcome message
    let welcomeText = this.welcomeConfig.message + '\n\n';
    
    if (activeFlows.length > 0) {
      welcomeText += '💬 **Conversaciones disponibles:**\n';
      activeFlows.forEach((flow, index) => {
        welcomeText += `${index + 1}️⃣ ${flow.flow_name}\n`;
      });
      welcomeText += '\nResponde con el número de tu interés (1, 2, 3...)';
    } else {
      welcomeText += '💡 No hay conversaciones configuradas en este momento.';
    }
    
    // Send welcome message directly
    console.log(`📤 Sending restart welcome message to ${sender}:`, welcomeText);
    const success = await this.sendMessage(sender, welcomeText);
    
    if (success) {
      this.seenContacts.add(sender);
      console.log(`✅ Conversation restarted successfully for ${sender}`);
    } else {
      console.log(`❌ Failed to restart conversation for ${sender}`);
    }
    
    return success;
  }

  async getSetting(key) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT setting_value FROM bot_settings WHERE setting_key = ?',
        [key],
        (err, row) => {
          if (err) reject(err);
          else resolve(row ? row.setting_value : null);
        }
      );
    });
  }

  async saveFlowConfig(config) {
    try {
      await Promise.all([
        this.saveSetting('flow_end_message', config.endMessage),
        this.saveSetting('flow_back_message', config.backMessage),
        this.saveSetting('flow_error_message', config.errorMessage)
      ]);

      this.flowConfig = config;
      console.log('✅ Flow configuration saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error saving flow config:', error);
      return false;
    }
  }

  async saveSetting(key, value) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO bot_settings (setting_key, setting_value) VALUES (?, ?)',
        [key, value],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async sendWelcomeMessage(to) {
    try {
      console.log(`👋 Attempting to send welcome message to ${to}`);
      console.log(`👋 Welcome config enabled: ${this.welcomeConfig.enabled}`);
      console.log(`👋 Contact already seen: ${this.seenContacts.has(to)}`);
      
      if (!this.welcomeConfig.enabled) {
        console.log(`❌ Welcome config is disabled`);
        return false;
      }

      // Check if we've already sent welcome message to this contact
      if (this.seenContacts.has(to)) {
        console.log(`❌ Contact ${to} already seen, skipping welcome message`);
        return false;
      }

      console.log(`👋 Sending welcome message to ${to}`);
      
      // Get available flows to add to welcome message
      const flows = await this.flowService.getAllFlows();
      const activeFlows = flows.filter(flow => flow.is_active);
      
      console.log(`📋 Found ${activeFlows.length} active flows for welcome message`);
      
      // Create a simple formatted welcome message with only flows
      let welcomeText = this.welcomeConfig.message + '\n\n';
      
      if (activeFlows.length > 0) {
        welcomeText += '💬 **Conversaciones disponibles:**\n';
        activeFlows.forEach((flow, index) => {
          welcomeText += `${index + 1}️⃣ ${flow.flow_name}\n`;
        });
        welcomeText += '\nResponde con el número de tu interés (1, 2, 3...)';
      } else {
        welcomeText += '💡 No hay conversaciones configuradas en este momento.';
      }
      
      console.log(`📤 Sending welcome message to ${to}:`, welcomeText);
      const success = await this.sendMessage(to, welcomeText);

      if (success) {
        this.seenContacts.add(to);
        
        // Add welcome message to navigation history
        if (!this.userNavigationHistory.has(to)) {
          this.userNavigationHistory.set(to, []);
        }
        const history = this.userNavigationHistory.get(to);
        history.push({
          type: 'welcome',
          timestamp: Date.now()
        });
        
        console.log(`✅ Welcome message with ${activeFlows.length} flows sent to ${to}`);
      } else {
        console.log(`❌ Failed to send welcome message to ${to}`);
      }

      console.log(`✅ Welcome message result: ${success}`);
      return success;
    } catch (error) {
      console.error('❌ Error sending welcome message:', error);
      return false;
    }
  }

  async testWelcomeMessage(phoneNumber) {
    try {
      console.log(`🧪 Testing welcome message to ${phoneNumber}`);
      
      // Temporarily remove from seen contacts to force welcome message
      this.seenContacts.delete(phoneNumber);
      
      const success = await this.sendWelcomeMessage(phoneNumber);
      
      if (success) {
        console.log(`✅ Welcome message test sent to ${phoneNumber}`);
      } else {
        console.log(`❌ Welcome message test failed for ${phoneNumber}`);
      }
      
      return success;
    } catch (error) {
      console.error('❌ Error testing welcome message:', error);
      return false;
    }
  }

  async clearWelcomeHistory() {
    try {
      console.log('🧹 Clearing welcome message history...');
      this.seenContacts.clear();
      console.log('✅ Welcome message history cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing welcome message history:', error);
      return false;
    }
  }

  async handleNumberResponse(sender, message, options) {
    try {
      const number = parseInt(message.trim());
      console.log(`🔢 Processing number response from ${sender}: ${number}`);
      
      // Get available flows
      const flows = await this.flowService.getAllFlows();
      const activeFlows = flows.filter(flow => flow.is_active);
      console.log(`📋 Available active flows: ${activeFlows.length}`);
      activeFlows.forEach((flow, index) => {
        console.log(`  ${index + 1}. ${flow.flow_name} (ID: ${flow.id})`);
      });
      
      if (isNaN(number) || number < 1 || number > activeFlows.length) {
        console.log(`❌ Invalid number: ${number}, valid range: 1-${activeFlows.length}`);
        await this.sendMessage(sender, '❌ Por favor, responde con un número válido (1, 2, 3...).');
        return;
      }

      // Handle flow selection
      const selectedFlow = activeFlows[number - 1];
      console.log(`🔢 Flow selected from ${sender}: ${number} - "${selectedFlow.flow_name}" (ID: ${selectedFlow.id})`);
      
      // Start the conversation flow
      const flowStarted = await this.startConversationFlow(sender, selectedFlow.id);
      
      if (flowStarted) {
        console.log(`✅ Conversation flow "${selectedFlow.flow_name}" started for ${sender}`);
      } else {
        console.log(`❌ Failed to start conversation flow for ${sender}`);
        await this.sendMessage(sender, '❌ Error iniciando la conversación. Por favor, intenta de nuevo.');
      }
      
    } catch (error) {
      console.error('❌ Error handling number response:', error);
    }
  }

  async handleNestedResponse(sender, message, parentOption) {
    try {
      console.log(`🔄 Checking nested response for "${parentOption}" with message: "${message}"`);
      
      // Get nested conditional response from database
      const nestedResponse = await this.getNestedConditionalResponse(parentOption, message);
      
      if (nestedResponse) {
        await this.sendMessage(sender, nestedResponse);
        console.log(`✅ Nested conditional response sent to ${sender}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error handling nested response:', error);
      return false;
    }
  }

  async getNestedConditionalResponse(parentOption, triggerText) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT response_text FROM nested_conditional_responses WHERE parent_option = ? AND trigger_text LIKE ? AND is_active = 1',
        [parentOption, `%${triggerText.toLowerCase()}%`],
        (err, row) => {
          if (err) {
            console.error('❌ Error getting nested conditional response:', err);
            reject(err);
            return;
          }
          
          if (row) {
            // Update use count
            this.db.run(
              'UPDATE nested_conditional_responses SET use_count = use_count + 1 WHERE parent_option = ? AND trigger_text LIKE ?',
              [parentOption, `%${triggerText.toLowerCase()}%`]
            );
            
            resolve(row.response_text);
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  async handleNestedFlowResponse(sender, message, nestedState) {
    try {
      const { optionId, optionText, flowId, currentStepId } = nestedState;
      console.log(`🔄 Handling nested flow response from ${sender} for option ${optionId}`);
      
      // Find matching nested response
      const nestedResponse = await this.flowService.findMatchingNestedResponse(optionId, message);
      
      if (nestedResponse) {
        console.log(`📤 Sending nested response to ${sender}: "${nestedResponse.response_text}"`);
        await this.sendMessage(sender, nestedResponse.response_text);
        
        // Clear nested state and return to flow
        this.userNestedStates.delete(sender);
        
        // Send the current step question again
        const step = await this.flowService.getStepById(currentStepId);
        const options = await this.flowService.getStepOptions(currentStepId);
        
        let questionText = step.question_text;
        options.forEach((opt, index) => {
          questionText += `\n${opt.option_number}️⃣ ${opt.option_text}`;
        });
        
        console.log(`📤 Sending step question again to ${sender}: "${questionText}"`);
        await this.sendMessage(sender, questionText);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error handling nested flow response:', error);
      return false;
    }
  }

  async handleFlowResponse(sender, message, flowState) {
    try {
      const { flowId, currentStepId } = flowState;
      console.log(`🔄 Handling flow response from ${sender} for flow ${flowId}, step ${currentStepId}`);
      
      // Get current step and its options
      const step = await this.flowService.getStepById(currentStepId);
      const options = await this.flowService.getStepOptions(currentStepId);
      
      console.log(`📋 Step data:`, {
        stepId: step?.id,
        questionText: step?.question_text,
        optionsCount: options?.length || 0
      });
      
      if (!step || !options.length) {
        console.log(`❌ No step or options found for flow ${flowId}, step ${currentStepId}`);
        this.userFlows.delete(sender);
        return false;
      }

      // Check if message is a valid number response
      const numberMatch = message.match(/^[1-9]\d*$/);
      if (!numberMatch) {
        console.log(`❌ Invalid response format from ${sender}: "${message}"`);
        await this.sendMessage(sender, '❌ Por favor, responde con un número válido (1, 2, 3...).');
        return true;
      }

      const selectedNumber = parseInt(message);
      const selectedOption = options.find(opt => opt.option_number === selectedNumber);
      
      console.log(`🔢 Selected option:`, {
        selectedNumber,
        optionFound: !!selectedOption,
        optionText: selectedOption?.option_text,
        nextStepId: selectedOption?.next_step_id,
        isFinalResponse: selectedOption?.is_final_response,
        isBackOption: selectedOption?.is_back_option
      });
      
      // Check if user selected "Volver al inicio" (last option)
      const isVolverAlInicio = selectedNumber === options.length + 1;
      
      if (isVolverAlInicio) {
        console.log(`🏠 "Volver al inicio" selected by ${sender}`);
        await this.restartConversation(sender);
        return true;
      }
      
      if (!selectedOption) {
        console.log(`❌ Invalid option number ${selectedNumber} from ${sender}`);
        await this.sendMessage(sender, '❌ Opción no válida. Por favor, selecciona una opción de la lista.');
        return true;
      }

      // Send the response for the selected option
      console.log(`📤 Sending response to ${sender}: "${selectedOption.response_text}"`);
      await this.sendMessage(sender, selectedOption.response_text);

      // Update use count
      await this.flowService.updateOptionUseCount(selectedOption.id);

      // Check if this option has nested responses
      const nestedResponses = await this.flowService.getNestedResponses(selectedOption.id);
      if (nestedResponses && nestedResponses.length > 0) {
        console.log(`🔄 Option ${selectedOption.id} has ${nestedResponses.length} nested responses`);
        
        // Set user in nested response state
        this.userNestedStates.set(sender, {
          optionId: selectedOption.id,
          optionText: selectedOption.option_text,
          flowId,
          currentStepId
        });
        
        // Send instruction for nested response
        await this.sendMessage(sender, '💬 Puedes hacer preguntas adicionales sobre esta opción. Escribe tu pregunta:');
        
        return true;
      }

      // Handle navigation based on option type
      if (selectedOption.is_final_response) {
        // This is a final response, end the conversation
        console.log(`🏁 Final response selected, ending conversation for ${sender}`);
        this.userFlows.delete(sender);
        this.clearNavigationHistory(sender);
        await this.sendMessage(sender, this.flowConfig.endMessage);
      } else if (selectedOption.is_back_option) {
        // Go back using the configured next_step_id (parent step)
        console.log(`⬅️ Back option selected for ${sender}`);
        console.log(`🔍 Back option details:`, {
          optionId: selectedOption.id,
          optionText: selectedOption.option_text,
          currentStepId: currentStepId,
          flowId: flowId,
          nextStepId: selectedOption.next_step_id
        });
        
        // Send back message first
        await this.sendMessage(sender, this.flowConfig.backMessage);
        
        // Check if the back option has a configured next_step_id
        if (selectedOption.next_step_id) {
          console.log(`🔄 Back option has configured next_step_id: ${selectedOption.next_step_id}`);
          
          // Go to the configured parent step
          this.userFlows.set(sender, {
            flowId,
            currentStepId: selectedOption.next_step_id
          });
          
          // Send the parent step question
          const parentStep = await this.flowService.getStepById(selectedOption.next_step_id);
          const parentOptions = await this.flowService.getStepOptions(selectedOption.next_step_id);
          
          let questionText = parentStep.question_text;
          parentOptions.forEach((opt, index) => {
            questionText += `\n${opt.option_number}️⃣ ${opt.option_text}`;
          });
          
          // Add "Volver al inicio" option
          questionText = this.addVolverAlInicioOption(questionText, parentOptions.length);
          
          console.log(`📤 Sending parent step question to ${sender}: "${questionText}"`);
          await this.sendMessage(sender, questionText);
        } else {
          // No next_step_id configured, try fallback methods
          console.log(`⚠️ Back option has no next_step_id configured, trying fallback methods`);
          
          // Check if this is the first step of the flow
          const isFirstStep = step.step_number === 1;
          
          if (isFirstStep) {
            console.log(`🔄 First step detected, returning to welcome message for ${sender}`);
            this.userFlows.delete(sender);
            await this.sendWelcomeMessage(sender);
          } else if (step.parent_step_id) {
            // Fallback: use parent_step_id from database
            console.log(`🔄 Fallback: Going back to parent step ${step.parent_step_id}`);
            this.userFlows.set(sender, {
              flowId,
              currentStepId: step.parent_step_id
            });
            
            // Send the parent step question
            const parentStep = await this.flowService.getStepById(step.parent_step_id);
            const parentOptions = await this.flowService.getStepOptions(step.parent_step_id);
            
            let questionText = parentStep.question_text;
            parentOptions.forEach((opt, index) => {
              questionText += `\n${opt.option_number}️⃣ ${opt.option_text}`;
            });
            
            // Add "Volver al inicio" option
            questionText = this.addVolverAlInicioOption(questionText, parentOptions.length);
            
            console.log(`📤 Sending parent step question to ${sender}: "${questionText}"`);
            await this.sendMessage(sender, questionText);
          } else {
            // No fallback available, end flow
            console.log(`🏁 No fallback available, ending conversation for ${sender}`);
            this.userFlows.delete(sender);
            this.clearNavigationHistory(sender);
            await this.sendMessage(sender, this.flowConfig.endMessage);
          }
        }
      } else if (selectedOption.next_step_id) {
        // Go to next step
        console.log(`➡️ Next step option selected for ${sender}, going to step ${selectedOption.next_step_id}`);
        
        // Add current step to navigation history before moving to next
        console.log(`📚 Adding current step to navigation history: Step ${step.step_number} (ID: ${step.id})`);
        this.addToNavigationHistory(sender, step.id, step.step_number, step.question_text, flowId);
        
        this.userFlows.set(sender, {
          flowId,
          currentStepId: selectedOption.next_step_id
        });
        
        // Send the next step question
        const nextStep = await this.flowService.getStepById(selectedOption.next_step_id);
        const nextOptions = await this.flowService.getStepOptions(selectedOption.next_step_id);
        
        let questionText = nextStep.question_text;
        nextOptions.forEach((opt, index) => {
          questionText += `\n${opt.option_number}️⃣ ${opt.option_text}`;
        });
        
        // Add "Volver al inicio" option
        questionText = this.addVolverAlInicioOption(questionText, nextOptions.length);
        
        console.log(`📤 Sending next step question to ${sender}: "${questionText}"`);
        await this.sendMessage(sender, questionText);
      } else {
        // End of flow
        console.log(`🏁 No next step, ending conversation for ${sender}`);
        this.userFlows.delete(sender);
        this.clearNavigationHistory(sender);
        await this.sendMessage(sender, this.flowConfig.endMessage);
      }

      return true;
    } catch (error) {
      console.error('❌ Error handling flow response:', error);
      return false;
    }
  }

  async startConversationFlow(sender, flowId) {
    try {
      console.log(`🚀 Starting conversation flow ${flowId} for user ${sender}`);
      
      // Get the first step of the flow
      const flow = await this.flowService.getFlowWithSteps(flowId);
      console.log(`📋 Flow data retrieved:`, {
        flowId,
        flowName: flow?.flow_name,
        stepsCount: flow?.steps?.length || 0
      });
      
      if (!flow || !flow.steps || flow.steps.length === 0) {
        console.error(`❌ No steps found for flow ${flowId}`);
        return false;
      }

      const firstStep = flow.steps[0];
      const options = firstStep.options || [];
      
      console.log(`📝 First step:`, {
        stepId: firstStep.id,
        questionText: firstStep.question_text,
        optionsCount: options.length
      });

      // Set user in flow state
      this.userFlows.set(sender, {
        flowId,
        currentStepId: firstStep.id
      });
      console.log(`👤 User ${sender} added to flow state:`, this.userFlows.get(sender));

      // Add first step to navigation history
      this.addToNavigationHistory(sender, firstStep.id, firstStep.step_number, firstStep.question_text, flowId);

      // Send the first question
      let questionText = firstStep.question_text;
      options.forEach((opt, index) => {
        questionText += `\n${opt.option_number}️⃣ ${opt.option_text}`;
      });
      
      // Add "Volver al inicio" option
      questionText = this.addVolverAlInicioOption(questionText, options.length);

      console.log(`📤 Sending first question to ${sender}:`, questionText);
      await this.sendMessage(sender, questionText);
      console.log(`✅ Started conversation flow ${flowId} for user ${sender}`);
      return true;
    } catch (error) {
      console.error('❌ Error starting conversation flow:', error);
      return false;
    }
  }

  recordMessageAnalytics(sender, message, ruleId) {
    try {
      this.db.run(
        'INSERT INTO whatsapp_analytics (sender, message, rule_id, timestamp) VALUES (?, ?, ?, ?)',
        [sender, message, ruleId, new Date().toISOString()]
      );
    } catch (error) {
      console.error('❌ Error recording analytics:', error);
    }
  }

  async getStatus() {
    try {
      // Get flows info for debugging
      const flows = await this.flowService.getAllFlows();
      const activeFlows = flows.filter(flow => flow.is_active);
      
      return {
        isConnected: this.isConnected,
        isReady: this.isReady,
        messageRulesCount: this.messageRules.size,
        autoResponsesCount: this.autoResponses.size,
        qrCode: this.qrCodeDataUrl,
        message: this.isReady ? 'Connected' : this.qrCodeDataUrl ? 'Waiting for QR scan' : 'Disconnected',
        flowsInfo: {
          totalFlows: flows.length,
          activeFlows: activeFlows.length,
          flows: activeFlows.map(flow => ({
            id: flow.id,
            name: flow.flow_name,
            isActive: flow.is_active
          }))
        },
        userFlowsCount: this.userFlows.size
      };
    } catch (error) {
      console.error('❌ Error getting status:', error);
      return {
        isConnected: this.isConnected,
        isReady: this.isReady,
        messageRulesCount: this.messageRules.size,
        autoResponsesCount: this.autoResponses.size,
        qrCode: this.qrCodeDataUrl,
        message: this.isReady ? 'Connected' : this.qrCodeDataUrl ? 'Waiting for QR scan' : 'Disconnected',
        error: error.message
      };
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.destroy();
        this.isConnected = false;
        this.isReady = false;
        this.qrCodeDataUrl = null;
        console.log('🛑 WhatsApp Bot disconnected');
        
        // Emit status update
        this.emitStatusUpdate({
          isConnected: false,
          isReady: false,
          qrCode: null,
          message: 'Disconnected'
        });
      }
    } catch (error) {
      console.error('❌ Error disconnecting WhatsApp Bot:', error);
    }
  }
}

module.exports = WhatsAppBot;

const express = require('express');
const router = express.Router();
const WhatsAppBot = require('../services/whatsappBot');

// Initialize WhatsApp bot globally
if (!global.whatsappBot) {
  global.whatsappBot = new WhatsAppBot();
}

// Add logging middleware for debugging
router.use((req, res, next) => {
  console.log(`📡 [WhatsApp Routes] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'WhatsApp routes are working', timestamp: new Date().toISOString() });
});

// Store active connections for real-time updates
const activeConnections = new Set();

// Add connection to active connections
function addConnection(res) {
  activeConnections.add(res);
  
  // Remove connection when client disconnects
  res.on('close', () => {
    activeConnections.delete(res);
  });
}

// Broadcast status update to all active connections
function broadcastStatus(status) {
  activeConnections.forEach(res => {
    try {
      res.write(`data: ${JSON.stringify(status)}\n\n`);
    } catch (error) {
      // Remove broken connection
      activeConnections.delete(res);
    }
  });
}

// Set up status update callback
global.whatsappBot.onStatusUpdate(broadcastStatus);

// Real-time status updates endpoint (Server-Sent Events)
router.get('/status-stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial status
  global.whatsappBot.getStatus().then(status => {
    res.write(`data: ${JSON.stringify(status)}\n\n`);
  });

  // Add to active connections
  addConnection(res);
});

// Get WhatsApp bot status
router.get('/status', async (req, res) => {
  try {
    const status = await global.whatsappBot.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    res.status(500).json({ error: 'Failed to get WhatsApp status: ' + error.message });
  }
});

// Initialize WhatsApp bot
router.post('/initialize', async (req, res) => {
  try {
    const success = await global.whatsappBot.initialize();
    
    if (success) {
      res.json({
        message: 'WhatsApp Bot initialized successfully',
        success: true
      });
    } else {
      res.status(500).json({ error: 'Failed to initialize WhatsApp Bot' });
    }
  } catch (error) {
    console.error('Error initializing WhatsApp Bot:', error);
    res.status(500).json({ error: 'Failed to initialize WhatsApp Bot: ' + error.message });
  }
});

// Disconnect WhatsApp bot
router.post('/disconnect', async (req, res) => {
  try {
    await global.whatsappBot.disconnect();
    res.json({
      message: 'WhatsApp Bot disconnected successfully',
      success: true
    });
  } catch (error) {
    console.error('Error disconnecting WhatsApp Bot:', error);
    res.status(500).json({ error: 'Failed to disconnect WhatsApp Bot: ' + error.message });
  }
});

// Get WhatsApp message rules
router.get('/rules', async (req, res) => {
  try {
    const rules = await new Promise((resolve, reject) => {
      global.whatsappBot.db.all('SELECT * FROM whatsapp_rules ORDER BY created_at DESC', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json(rules);
  } catch (error) {
    console.error('Error getting WhatsApp rules:', error);
    res.status(500).json({ error: 'Failed to get WhatsApp rules: ' + error.message });
  }
});

// Create WhatsApp message rule
router.post('/rules', async (req, res) => {
  const { trigger_text, response_text, is_active = true } = req.body;
  
  if (!trigger_text || !response_text) {
    return res.status(400).json({ error: 'Trigger text and response text are required' });
  }

  try {
    const result = await new Promise((resolve, reject) => {
      global.whatsappBot.db.run(
        'INSERT INTO whatsapp_rules (trigger_text, response_text, is_active) VALUES (?, ?, ?)',
        [trigger_text, response_text, is_active ? 1 : 0],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    // Reload rules in memory
    await global.whatsappBot.loadMessageRules();
    
    res.json({
      id: result.id,
      trigger_text,
      response_text,
      is_active,
      message: 'WhatsApp rule created successfully'
    });
  } catch (error) {
    console.error('Error creating WhatsApp rule:', error);
    res.status(500).json({ error: 'Failed to create WhatsApp rule: ' + error.message });
  }
});

// Update WhatsApp message rule
router.put('/rules/:id', async (req, res) => {
  const { id } = req.params;
  const { trigger_text, response_text, is_active } = req.body;
  
  if (!trigger_text || !response_text) {
    return res.status(400).json({ error: 'Trigger text and response text are required' });
  }

  try {
    await new Promise((resolve, reject) => {
      global.whatsappBot.db.run(
        'UPDATE whatsapp_rules SET trigger_text = ?, response_text = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [trigger_text, response_text, is_active ? 1 : 0, id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Reload rules in memory
    await global.whatsappBot.loadMessageRules();
    
    res.json({
      message: 'WhatsApp rule updated successfully',
      success: true
    });
  } catch (error) {
    console.error('Error updating WhatsApp rule:', error);
    res.status(500).json({ error: 'Failed to update WhatsApp rule: ' + error.message });
  }
});

// Delete WhatsApp message rule
router.delete('/rules/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await new Promise((resolve, reject) => {
      global.whatsappBot.db.run(
        'DELETE FROM whatsapp_rules WHERE id = ?',
        [id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Reload rules in memory
    await global.whatsappBot.loadMessageRules();
    
    res.json({
      message: 'WhatsApp rule deleted successfully',
      success: true
    });
  } catch (error) {
    console.error('Error deleting WhatsApp rule:', error);
    res.status(500).json({ error: 'Failed to delete WhatsApp rule: ' + error.message });
  }
});

// Send WhatsApp message
router.post('/send-message', async (req, res) => {
  const { to, message } = req.body;
  
  if (!to || !message) {
    return res.status(400).json({ error: 'Recipient and message are required' });
  }

  try {
    const success = await global.whatsappBot.sendMessage(to, message);
    
    if (success) {
      res.json({
        message: 'WhatsApp message sent successfully',
        success: true
      });
    } else {
      res.status(500).json({ error: 'Failed to send WhatsApp message' });
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message: ' + error.message });
  }
});

// Send WhatsApp message to contact by name
router.post('/send-to-contact', async (req, res) => {
  const { contactName, message } = req.body;
  
  if (!contactName || !message) {
    return res.status(400).json({ error: 'Contact name and message are required' });
  }

  try {
    const success = await global.whatsappBot.sendMessageToContact(contactName, message);
    
    if (success) {
      res.json({
        message: 'WhatsApp message sent to contact successfully',
        success: true
      });
    } else {
      res.status(500).json({ error: 'Failed to send WhatsApp message to contact' });
    }
  } catch (error) {
    console.error('Error sending WhatsApp message to contact:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message to contact: ' + error.message });
  }
});

// Broadcast WhatsApp message
router.post('/broadcast', async (req, res) => {
  const { message, contacts = [] } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const result = await global.whatsappBot.broadcastMessage(message, contacts);
    
    res.json({
      message: 'WhatsApp broadcast completed',
      success: true,
      result: result
    });
  } catch (error) {
    console.error('Error broadcasting WhatsApp message:', error);
    res.status(500).json({ error: 'Failed to broadcast WhatsApp message: ' + error.message });
  }
});

// Send interactive WhatsApp message
router.post('/send-interactive', async (req, res) => {
  const { to, message, options, type } = req.body;
  
  if (!to || !message) {
    return res.status(400).json({ error: 'Recipient and message are required' });
  }

  try {
    const success = await global.whatsappBot.sendInteractiveMessage(to, message, options, type);
    
    if (success) {
      res.json({
        message: 'Interactive WhatsApp message sent successfully',
        success: true
      });
    } else {
      res.status(500).json({ error: 'Failed to send interactive WhatsApp message' });
    }
  } catch (error) {
    console.error('Error sending interactive WhatsApp message:', error);
    res.status(500).json({ error: 'Failed to send interactive WhatsApp message: ' + error.message });
  }
});

// Save welcome message configuration
router.post('/welcome-message', async (req, res) => {
  const { message, type, options, enabled } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Welcome message is required' });
  }

  try {
    const success = await global.whatsappBot.saveWelcomeMessage(message, type, options, enabled);
    
    if (success) {
      res.json({
        message: 'Welcome message saved successfully',
        success: true
      });
    } else {
      res.status(500).json({ error: 'Failed to save welcome message' });
    }
  } catch (error) {
    console.error('Error saving welcome message:', error);
    res.status(500).json({ error: 'Failed to save welcome message: ' + error.message });
  }
});

// Get welcome message configuration
router.get('/welcome-message', async (req, res) => {
  try {
    const welcomeConfig = await global.whatsappBot.getWelcomeMessage();
    res.json(welcomeConfig);
  } catch (error) {
    console.error('Error getting welcome message:', error);
    res.status(500).json({ error: 'Failed to get welcome message: ' + error.message });
  }
});

// Test welcome message
router.post('/test-welcome', async (req, res) => {
  const { phoneNumber } = req.body;
  
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    const success = await global.whatsappBot.testWelcomeMessage(phoneNumber);
    
    if (success) {
      res.json({
        message: 'Welcome message test sent successfully',
        success: true
      });
    } else {
      res.status(500).json({ error: 'Failed to send welcome message test' });
    }
  } catch (error) {
    console.error('Error testing welcome message:', error);
    res.status(500).json({ error: 'Failed to test welcome message: ' + error.message });
  }
});

// Clear welcome message history
router.post('/clear-welcome-history', async (req, res) => {
  try {
    const success = await global.whatsappBot.clearWelcomeHistory();
    
    if (success) {
      res.json({
        message: 'Welcome message history cleared successfully',
        success: true
      });
    } else {
      res.status(500).json({ error: 'Failed to clear welcome message history' });
    }
  } catch (error) {
    console.error('Error clearing welcome message history:', error);
    res.status(500).json({ error: 'Failed to clear welcome message history: ' + error.message });
  }
});

// Save flow configuration
router.post('/flow-config', async (req, res) => {
  const { endMessage, backMessage, errorMessage } = req.body;
  
  if (!endMessage || !backMessage || !errorMessage) {
    return res.status(400).json({ error: 'All flow configuration fields are required' });
  }

  try {
    const success = await global.whatsappBot.saveFlowConfig({
      endMessage,
      backMessage,
      errorMessage
    });
    
    if (success) {
      res.json({
        message: 'Flow configuration saved successfully',
        success: true
      });
    } else {
      res.status(500).json({ error: 'Failed to save flow configuration' });
    }
  } catch (error) {
    console.error('Error saving flow configuration:', error);
    res.status(500).json({ error: 'Failed to save flow configuration: ' + error.message });
  }
});

// Get flow configuration
router.get('/flow-config', async (req, res) => {
  try {
    const flowConfig = await global.whatsappBot.getFlowConfig();
    res.json(flowConfig);
  } catch (error) {
    console.error('Error getting flow configuration:', error);
    res.status(500).json({ error: 'Failed to get flow configuration: ' + error.message });
  }
});

// Get nested responses for an option
router.get('/flow-options/:optionId/nested-responses', async (req, res) => {
  try {
    const optionId = parseInt(req.params.optionId);
    const nestedResponses = await global.whatsappBot.flowService.getNestedResponses(optionId);
    res.json(nestedResponses);
  } catch (error) {
    console.error('Error getting nested responses:', error);
    res.status(500).json({ error: 'Failed to get nested responses: ' + error.message });
  }
});

// Add nested response to an option
router.post('/flow-options/:optionId/nested-responses', async (req, res) => {
  try {
    const optionId = parseInt(req.params.optionId);
    const { triggerText, responseText } = req.body;
    
    if (!triggerText || !responseText) {
      return res.status(400).json({ error: 'Trigger text and response text are required' });
    }
    
    const result = await global.whatsappBot.flowService.addNestedResponse(optionId, triggerText, responseText);
    res.json({
      message: 'Nested response added successfully',
      success: true,
      id: result.id
    });
  } catch (error) {
    console.error('Error adding nested response:', error);
    res.status(500).json({ error: 'Failed to add nested response: ' + error.message });
  }
});

// Update nested response
router.put('/flow-nested-responses/:responseId', async (req, res) => {
  try {
    const responseId = parseInt(req.params.responseId);
    const { triggerText, responseText } = req.body;
    
    if (!triggerText || !responseText) {
      return res.status(400).json({ error: 'Trigger text and response text are required' });
    }
    
    await global.whatsappBot.flowService.updateNestedResponse(responseId, triggerText, responseText);
    res.json({
      message: 'Nested response updated successfully',
      success: true
    });
  } catch (error) {
    console.error('Error updating nested response:', error);
    res.status(500).json({ error: 'Failed to update nested response: ' + error.message });
  }
});

// Delete nested response
router.delete('/flow-nested-responses/:responseId', async (req, res) => {
  try {
    const responseId = parseInt(req.params.responseId);
    await global.whatsappBot.flowService.deleteNestedResponse(responseId);
    res.json({
      message: 'Nested response deleted successfully',
      success: true
    });
  } catch (error) {
    console.error('Error deleting nested response:', error);
    res.status(500).json({ error: 'Failed to delete nested response: ' + error.message });
  }
});

// Get all flow options for linking new steps
router.get('/flows/:flowId/options', async (req, res) => {
  try {
    const flowId = parseInt(req.params.flowId);
    const options = await global.whatsappBot.flowService.getAllFlowOptions(flowId);
    res.json(options);
  } catch (error) {
    console.error('Error getting flow options:', error);
    res.status(500).json({ error: 'Failed to get flow options: ' + error.message });
  }
});

// Get option with context
router.get('/flow-options/:optionId/context', async (req, res) => {
  try {
    const optionId = parseInt(req.params.optionId);
    const option = await global.whatsappBot.flowService.getOptionWithContext(optionId);
    res.json(option);
  } catch (error) {
    console.error('Error getting option context:', error);
    res.status(500).json({ error: 'Failed to get option context: ' + error.message });
  }
});

// Fix back options for a flow
router.post('/flows/:flowId/fix-back-options', async (req, res) => {
  try {
    const flowId = parseInt(req.params.flowId);
    const fixedCount = await global.whatsappBot.flowService.fixBackOptions(flowId);
    res.json({
      message: `Fixed ${fixedCount} back options`,
      success: true,
      fixedCount
    });
  } catch (error) {
    console.error('Error fixing back options:', error);
    res.status(500).json({ error: 'Failed to fix back options: ' + error.message });
  }
});

// Get WhatsApp analytics
router.get('/analytics', async (req, res) => {
  try {
    const analytics = await new Promise((resolve, reject) => {
      global.whatsappBot.db.all(`
        SELECT wa.*, wr.trigger_text 
        FROM whatsapp_analytics wa 
        LEFT JOIN whatsapp_rules wr ON wa.rule_id = wr.id 
        ORDER BY wa.timestamp DESC 
        LIMIT 100
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    res.json(analytics);
  } catch (error) {
    console.error('Error getting WhatsApp analytics:', error);
    res.status(500).json({ error: 'Failed to get WhatsApp analytics: ' + error.message });
  }
});



  // ===== CONVERSATION FLOWS ROUTES =====

  // Get all flows
  router.get('/flows', async (req, res) => {
    try {
      const ConversationFlowService = require('../services/conversationFlowService');
      const flowService = new ConversationFlowService();
      const flows = await flowService.getAllFlows();
      res.json(flows);
    } catch (error) {
      console.error('Error getting flows:', error);
      res.status(500).json({ error: 'Failed to get flows: ' + error.message });
    }
  });

  // Get flow with all steps and options
  router.get('/flows/:flowId', async (req, res) => {
    const { flowId } = req.params;
    
    try {
      const ConversationFlowService = require('../services/conversationFlowService');
      const flowService = new ConversationFlowService();
      const flow = await flowService.getFlowWithSteps(flowId);
      res.json(flow);
    } catch (error) {
      console.error('Error getting flow:', error);
      res.status(500).json({ error: 'Failed to get flow: ' + error.message });
    }
  });

  // Create new flow
  router.post('/flows', async (req, res) => {
    const { flowName } = req.body;
    
    if (!flowName) {
      return res.status(400).json({ error: 'Flow name is required' });
    }

    try {
      const ConversationFlowService = require('../services/conversationFlowService');
      const flowService = new ConversationFlowService();
      const flow = await flowService.createFlow(flowName);
      res.json({
        message: 'Flow created successfully',
        flow,
        success: true
      });
    } catch (error) {
      console.error('Error creating flow:', error);
      res.status(500).json({ error: 'Failed to create flow: ' + error.message });
    }
  });

  // Delete complete flow
  router.delete('/flows/:flowId', async (req, res) => {
    const { flowId } = req.params;
    console.log(`🗑️ [DELETE FLOW] Attempting to delete flow ID: ${flowId}`);
    
    try {
      const ConversationFlowService = require('../services/conversationFlowService');
      const flowService = new ConversationFlowService();
      console.log(`🗑️ [DELETE FLOW] Calling deleteFlow service for flow ID: ${flowId}`);
      await flowService.deleteFlow(flowId);
      console.log(`✅ [DELETE FLOW] Flow ${flowId} deleted successfully`);
      res.json({
        message: 'Flow deleted successfully with all its steps and options',
        success: true
      });
    } catch (error) {
      console.error(`❌ [DELETE FLOW] Error deleting flow ${flowId}:`, error);
      res.status(500).json({ error: 'Failed to delete flow: ' + error.message });
    }
  });

  // Create new step
  router.post('/flows/:flowId/steps', async (req, res) => {
    const { flowId } = req.params;
    const { stepNumber, parentStepId, questionText } = req.body;
    
    if (!questionText) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    try {
      const ConversationFlowService = require('../services/conversationFlowService');
      const flowService = new ConversationFlowService();
      const step = await flowService.createStep(flowId, stepNumber, parentStepId, questionText);
      res.json({
        message: 'Step created successfully',
        step,
        success: true
      });
    } catch (error) {
      console.error('Error creating step:', error);
      res.status(500).json({ error: 'Failed to create step: ' + error.message });
    }
  });

  // Create new option
  router.post('/steps/:stepId/options', async (req, res) => {
    const { stepId } = req.params;
    const { optionNumber, optionText, responseText, nextStepId, isBackOption, isFinalResponse } = req.body;
    
    console.log(`📝 [CREATE OPTION ROUTE] Request received:`, {
      stepId,
      optionNumber,
      optionText,
      responseText,
      nextStepId,
      isBackOption,
      isFinalResponse
    });
    
    if (!optionText || !responseText) {
      console.log(`❌ [CREATE OPTION ROUTE] Validation failed: missing optionText or responseText`);
      return res.status(400).json({ error: 'Option text and response text are required' });
    }

    try {
      const ConversationFlowService = require('../services/conversationFlowService');
      const flowService = new ConversationFlowService();
      console.log(`🔧 [CREATE OPTION ROUTE] Calling createOption service...`);
      const option = await flowService.createOption(stepId, optionNumber, optionText, responseText, nextStepId, isBackOption, isFinalResponse);
      console.log(`✅ [CREATE OPTION ROUTE] Option created successfully:`, option);
      res.json({
        message: 'Option created successfully',
        option,
        success: true
      });
    } catch (error) {
      console.error(`❌ [CREATE OPTION ROUTE] Error creating option:`, error);
      res.status(500).json({ error: 'Failed to create option: ' + error.message });
    }
  });

  // Update step
  router.put('/steps/:stepId', async (req, res) => {
    const { stepId } = req.params;
    const { questionText } = req.body;
    
    if (!questionText) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    try {
      const ConversationFlowService = require('../services/conversationFlowService');
      const flowService = new ConversationFlowService();
      await flowService.updateStep(stepId, questionText);
      res.json({
        message: 'Step updated successfully',
        success: true
      });
    } catch (error) {
      console.error('Error updating step:', error);
      res.status(500).json({ error: 'Failed to update step: ' + error.message });
    }
  });

  // Update option
  router.put('/options/:optionId', async (req, res) => {
    const { optionId } = req.params;
    const { optionText, responseText, nextStepId, isBackOption, isFinalResponse } = req.body;
    
    if (!optionText || !responseText) {
      return res.status(400).json({ error: 'Option text and response text are required' });
    }

    try {
      const ConversationFlowService = require('../services/conversationFlowService');
      const flowService = new ConversationFlowService();
      await flowService.updateOption(optionId, optionText, responseText, nextStepId, isBackOption, isFinalResponse);
      res.json({
        message: 'Option updated successfully',
        success: true
      });
    } catch (error) {
      console.error('Error updating option:', error);
      res.status(500).json({ error: 'Failed to update option: ' + error.message });
    }
  });

  // Delete step
  router.delete('/steps/:stepId', async (req, res) => {
    const { stepId } = req.params;
    
    try {
      const ConversationFlowService = require('../services/conversationFlowService');
      const flowService = new ConversationFlowService();
      await flowService.deleteStep(stepId);
      res.json({
        message: 'Step deleted successfully',
        success: true
      });
    } catch (error) {
      console.error('Error deleting step:', error);
      res.status(500).json({ error: 'Failed to delete step: ' + error.message });
    }
  });

  // Delete option
  router.delete('/options/:optionId', async (req, res) => {
    const { optionId } = req.params;
    
    try {
      const ConversationFlowService = require('../services/conversationFlowService');
      const flowService = new ConversationFlowService();
      await flowService.deleteOption(optionId);
      res.json({
        message: 'Option deleted successfully',
        success: true
      });
    } catch (error) {
      console.error('Error deleting option:', error);
      res.status(500).json({ error: 'Failed to delete option: ' + error.message });
    }
  });

  // Start conversation flow for a user
  router.post('/flows/:flowId/start', async (req, res) => {
    const { flowId } = req.params;
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    try {
      const success = await global.whatsappBot.startConversationFlow(phoneNumber, flowId);
      
      if (success) {
        res.json({
          message: 'Conversation flow started successfully',
          success: true
        });
      } else {
        res.status(500).json({ error: 'Failed to start conversation flow' });
      }
    } catch (error) {
      console.error('Error starting conversation flow:', error);
      res.status(500).json({ error: 'Failed to start conversation flow: ' + error.message });
    }
  });

  // Get bot configuration
  router.get('/config', (req, res) => {
    try {
      const config = {
        processOldMessages: process.env.PROCESS_OLD_MESSAGES === 'true',
        botStartTime: global.whatsappBot.botStartTime ? global.whatsappBot.botStartTime.toISOString() : null,
        isConnected: global.whatsappBot.isConnected,
        isReady: global.whatsappBot.isReady
      };
      res.json(config);
    } catch (error) {
      console.error('Error getting bot configuration:', error);
      res.status(500).json({ error: 'Failed to get bot configuration: ' + error.message });
    }
  });

  // Update bot configuration
  router.put('/config', (req, res) => {
    try {
      const { processOldMessages } = req.body;
      
      if (typeof processOldMessages === 'boolean') {
        process.env.PROCESS_OLD_MESSAGES = processOldMessages.toString();
        console.log(`🔧 Bot configuration updated: PROCESS_OLD_MESSAGES = ${processOldMessages}`);
        
        res.json({
          message: 'Bot configuration updated successfully',
          success: true,
          config: {
            processOldMessages: processOldMessages,
            botStartTime: global.whatsappBot.botStartTime ? global.whatsappBot.botStartTime.toISOString() : null
          }
        });
      } else {
        res.status(400).json({ error: 'processOldMessages must be a boolean' });
      }
    } catch (error) {
      console.error('Error updating bot configuration:', error);
      res.status(500).json({ error: 'Failed to update bot configuration: ' + error.message });
    }
  });

  // 404 handler for WhatsApp routes
  router.use('*', (req, res) => {
    console.log(`❌ [404] Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      error: 'Route not found', 
      method: req.method, 
      path: req.originalUrl,
      availableRoutes: [
        'GET /api/whatsapp/test',
        'GET /api/whatsapp/flows',
        'GET /api/whatsapp/flows/:flowId',
        'POST /api/whatsapp/flows',
        'DELETE /api/whatsapp/flows/:flowId',
        'POST /api/whatsapp/flows/:flowId/steps',
        'POST /api/whatsapp/steps/:stepId/options',
        'PUT /api/whatsapp/steps/:stepId',
        'PUT /api/whatsapp/options/:optionId',
        'DELETE /api/whatsapp/steps/:stepId',
        'DELETE /api/whatsapp/options/:optionId',
        'POST /api/whatsapp/flows/:flowId/start'
      ]
    });
  });

module.exports = router;

const WhatsAppBot = require('./server/services/whatsappBot');

async function testWhatsAppBot() {
  console.log('🧪 Testing WhatsApp Bot...');
  
  const bot = new WhatsAppBot();
  
  try {
    // Test 1: Get initial status
    console.log('\n📊 Test 1: Getting initial status...');
    const initialStatus = await bot.getStatus();
    console.log('Initial status:', initialStatus);
    
    // Test 2: Initialize bot
    console.log('\n🚀 Test 2: Initializing bot...');
    const initResult = await bot.initialize();
    console.log('Initialization result:', initResult);
    
    // Test 3: Get status after initialization
    console.log('\n📊 Test 3: Getting status after initialization...');
    const statusAfterInit = await bot.getStatus();
    console.log('Status after initialization:', statusAfterInit);
    
    // Test 4: Load message rules
    console.log('\n📋 Test 4: Loading message rules...');
    await bot.loadMessageRules();
    const rulesStatus = await bot.getStatus();
    console.log('Rules loaded:', rulesStatus.messageRulesCount);
    
    // Test 5: Disconnect
    console.log('\n🛑 Test 5: Disconnecting...');
    await bot.disconnect();
    const finalStatus = await bot.getStatus();
    console.log('Final status:', finalStatus);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testWhatsAppBot();

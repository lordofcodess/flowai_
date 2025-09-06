// Simple test to verify payment integration
import { paymentChatIntegration } from './services/basepay/chatIntegration';

async function testPaymentIntegration() {
  try {
    console.log('Testing payment integration...');
    
    // Initialize without wallet client for testing
    await paymentChatIntegration.initialize(null);
    
    // Test balance query
    const balanceResult = await paymentChatIntegration.processMessage('What is my balance?');
    console.log('Balance query result:', balanceResult);
    
    // Test payment command
    const paymentResult = await paymentChatIntegration.processMessage('Send 0.1 ETH to 0x742d35Cc6634C0532925a3b8D5C0B4F3e8dCdD98');
    console.log('Payment command result:', paymentResult);
    
    // Test help message
    const helpMessage = paymentChatIntegration.getHelpMessage();
    console.log('Help message:', helpMessage);
    
    console.log('Payment integration test completed successfully!');
  } catch (error) {
    console.error('Payment integration test failed:', error);
  }
}

// Export for manual testing
export { testPaymentIntegration };

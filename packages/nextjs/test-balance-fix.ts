// Test balance functionality after fixing the getBalances method
import { paymentChatIntegration } from './services/basepay/chatIntegration';

async function testBalanceFunction() {
  console.log('Testing balance functionality...');
  
  try {
    // Initialize payment integration
    await paymentChatIntegration.initialize(null);
    
    // Test balance query
    const balanceResult = await paymentChatIntegration.processMessage('What is my balance?');
    console.log('Balance query result:', balanceResult);
    
    // Test with a specific address
    const specificBalanceResult = await paymentChatIntegration.processMessage(
      'What is my balance?', 
      '0x742d35Cc6634C0532925a3b8D5C0B4F3e8dCdD98'
    );
    console.log('Specific balance query result:', specificBalanceResult);
    
    console.log('Balance functionality test completed!');
  } catch (error) {
    console.error('Balance functionality test failed:', error);
  }
}

// Export for manual testing
export { testBalanceFunction };

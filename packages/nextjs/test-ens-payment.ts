// Test ENS resolution in payment system
import { paymentENSResolver } from './services/basepay/ensResolver';

async function testENSResolution() {
  console.log('Testing ENS resolution for payments...');
  
  try {
    // Test resolving blockdevrel.eth (you mentioned this works)
    const result1 = await paymentENSResolver.resolveENSName('blockdevrel.eth');
    console.log('blockdevrel.eth resolution:', result1);
    
    // Test resolving alex.eth
    const result2 = await paymentENSResolver.resolveENSName('alex.eth');
    console.log('alex.eth resolution:', result2);
    
    // Test invalid ENS name
    const result3 = await paymentENSResolver.resolveENSName('nonexistent12345.eth');
    console.log('nonexistent12345.eth resolution:', result3);
    
    console.log('ENS resolution test completed!');
  } catch (error) {
    console.error('ENS resolution test failed:', error);
  }
}

// Export for manual testing
export { testENSResolution };

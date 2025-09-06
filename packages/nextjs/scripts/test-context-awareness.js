#!/usr/bin/env node

/**
 * Test script to verify context awareness is working
 * Run with: node scripts/test-context-awareness.js
 */

async function testContextAwareness() {
  const baseUrl = 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/ens/chat`;
  
  console.log('🧪 Testing ENS AI Context Awareness\n');
  
  try {
    // Test 1: Initial query about an ENS name
    console.log('Test 1: Initial ENS query');
    const response1 = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Is mytest.eth available?',
        userAddress: 'test-user-123'
      })
    });
    
    const result1 = await response1.json();
    console.log('✅ Response 1:', result1.message);
    console.log('📊 Context:', result1.conversationContext);
    
    // Test 2: Follow-up question using "it"
    console.log('\nTest 2: Follow-up question with pronoun');
    const response2 = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How much does it cost?',
        userAddress: 'test-user-123'
      })
    });
    
    const result2 = await response2.json();
    console.log('✅ Response 2:', result2.message);
    console.log('📊 Context:', result2.conversationContext);
    
    // Test 3: Another follow-up
    console.log('\nTest 3: Another follow-up question');
    const response3 = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What can I do with it?',
        userAddress: 'test-user-123'
      })
    });
    
    const result3 = await response3.json();
    console.log('✅ Response 3:', result3.message);
    console.log('📊 Context:', result3.conversationContext);
    
    // Verify context persistence
    if (result1.conversationContext?.lastENSName === 'mytest.eth' &&
        result2.conversationContext?.lastENSName === 'mytest.eth' &&
        result3.conversationContext?.lastENSName === 'mytest.eth') {
      console.log('\n🎉 Context awareness test PASSED!');
      console.log('✅ ENS name context persisted across all requests');
      console.log(`✅ Conversation length increased: ${result1.conversationContext?.historyLength} → ${result3.conversationContext?.historyLength}`);
    } else {
      console.log('\n❌ Context awareness test FAILED!');
      console.log('❌ ENS name context was not properly maintained');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.log('\n💡 Make sure your Next.js server is running on localhost:3000');
  }
}

// Run the test
testContextAwareness();

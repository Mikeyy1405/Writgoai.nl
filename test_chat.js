// Test chat API met veilige message validatie
const testMessage = {
  message: "Hoi, wat kun je voor mij doen?",
  clientId: "test-client-123",
  conversationHistory: [],
  stream: false
};

console.log('📤 Sending test message:', testMessage);

fetch('http://localhost:3000/api/ai-agent/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testMessage)
})
.then(res => {
  console.log('📥 Response status:', res.status);
  return res.json();
})
.then(data => {
  console.log('✅ Response:', data);
})
.catch(err => {
  console.error('❌ Error:', err);
});

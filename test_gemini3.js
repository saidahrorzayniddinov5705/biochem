import fetch from 'node-fetch';

async function test() {
  const response = await fetch('http://localhost:3000/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Hello', model: 'gemini-3-flash-preview' })
  });
  const data = await response.json();
  console.log(data);
}
test();

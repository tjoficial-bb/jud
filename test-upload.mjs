import fs from 'fs';

async function run() {
  try {
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin' })
    });
    const loginData = await loginRes.json();
    console.log('Login result:', loginData);
    const token = loginData.token;

    const formData = new FormData();
    formData.append('files', new Blob(['fake pdf data'], { type: 'application/pdf' }), 'matricula_acento.pdf');
    formData.append('doc_type', 'Processo');
    formData.append('property_id', 'temp_123');

    const res = await fetch('http://localhost:3000/api/documents', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const data = await res.text();
    console.log('Upload Status:', res.status);
    console.log('Upload Response:', data);
  } catch (err) {
    console.error('Test error:', err);
  }
}
run();

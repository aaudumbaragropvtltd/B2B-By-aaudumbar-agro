async function debugFetch() {
  const res = await fetch('http://localhost:3000/api/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: 'test' })
  });
  console.log('Status:', res.status, 'Type:', res.headers.get('content-type'));
  const text = await res.text();
  console.log('Body preview:', text.slice(0, 300));
}

debugFetch();

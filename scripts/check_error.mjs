async function checkError() {
  const res = await fetch('http://localhost:3000/api/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: 'test', razorpay_payment_id: 'test' })
  });
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('HTML preview:');
  const match = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i) || text.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (match) console.log(match[0]);
  else console.log(text.slice(0, 500));
}

checkError();

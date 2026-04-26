import { useEffect, useState, useRef } from 'react';

function loadPayPalScript(clientId, env = 'sandbox') {
  return new Promise((resolve, reject) => {
    if (window.paypal) {
      resolve(window.paypal);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&intent=capture`;
    script.async = true;
    script.onload = () => resolve(window.paypal);
    script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
    document.body.appendChild(script);
  });
}

export default function PayPalButton({ selectedViews, reelLink, onSuccess, onError }) {
  const [paypalReady, setPaypalReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const res = await fetch('/api/paypal/config');
        const data = await res.json();
        const clientId = data.clientId || 'AaCi1aE_vOFlp3hyWA4CSiebcp37z5YaFDIEctTELT43J5OrdQxZUDLAvzW4fl0TKR_AYeRyBmTovSfE';
        const env = data.env || 'live';
        if (cancelled) return;

        await loadPayPalScript(clientId, env);
        if (cancelled) return;

        setPaypalReady(true);
        setLoading(false);
      } catch (err) {
        // Fallback: load PayPal directly with hardcoded client ID
        if (!cancelled) {
          try {
            await loadPayPalScript('AaCi1aE_vOFlp3hyWA4CSiebcp37z5YaFDIEctTELT43J5OrdQxZUDLAvzW4fl0TKR_AYeRyBmTovSfE', 'live');
            setPaypalReady(true);
          } catch {
            setConfigError('PayPal failed to load');
          }
          setLoading(false);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!paypalReady || !buttonRef.current || !selectedViews) return;

    // Clear previous button before rendering new one
    buttonRef.current.innerHTML = '';

    const price = selectedViews.price.replace('$', '');

    window.paypal
      .Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'pay',
        },
        createOrder: async () => {
          try {
            const res = await fetch('/api/paypal/create-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                price,
                label: selectedViews.label,
                link: reelLink,
                quantity: selectedViews.value,
              }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
              throw new Error(data.error || 'Failed to create order');
            }
            return data.orderId;
          } catch (err) {
            onError(err.message);
            throw err;
          }
        },
        onApprove: async (data) => {
          try {
            const res = await fetch('/api/paypal/capture-order', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderID,
                link: reelLink,
                quantity: selectedViews.value,
              }),
            });
            const result = await res.json();
            if (!res.ok || result.error) {
              throw new Error(result.error || 'Payment capture failed');
            }
            onSuccess(result);
          } catch (err) {
            onError(err.message);
          }
        },
        onError: (err) => {
          onError(typeof err === 'string' ? err : 'PayPal checkout error');
        },
        onCancel: () => {
          onError('Payment was cancelled');
        },
      })
      .render(buttonRef.current);
  }, [paypalReady, selectedViews, reelLink, onSuccess, onError]);

  if (loading) {
    return (
      <div className="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-center text-sm text-gray-400">
        Loading PayPal...
      </div>
    );
  }

  if (configError) {
    return (
      <div className="w-full py-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
        <p className="text-sm text-yellow-400 mb-1">PayPal not configured</p>
        <p className="text-xs text-yellow-400/70">Add PAYPAL_CLIENT_ID to your .env file</p>
      </div>
    );
  }

  return <div ref={buttonRef} className="w-full" />;
}

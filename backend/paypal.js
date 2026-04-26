import axios from 'axios';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'AaCi1aE_vOFlp3hyWA4CSiebcp37z5YaFDIEctTELT43J5OrdQxZUDLAvzW4fl0TKR_AYeRyBmTovSfE';
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'EDr3uQNujs88bhpXbODjfr72PeFUV2MjKsWE0G26P9Rt0WTRuCoZP2pVyEHl7hPSwBW6R6zpdJPDuQq_';
const PAYPAL_ENV = process.env.PAYPAL_ENV || 'live';

const BASE_URL = PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

/**
 * Get PayPal access token
 */
async function getAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await axios.post(
    `${BASE_URL}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data.access_token;
}

/**
 * Create a PayPal order
 */
async function createPayPalOrder({ price, label, link, quantity }) {
  const accessToken = await getAccessToken();

  const response = await axios.post(
    `${BASE_URL}/v2/checkout/orders`,
    {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: price,
          },
          description: `BoostFlow - ${label} Instagram Views`,
          custom_id: JSON.stringify({ link, quantity, label }),
        },
      ],
      application_context: {
        brand_name: 'BoostFlow',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: '',
        cancel_url: '',
      },
    },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

/**
 * Capture a PayPal order
 */
async function capturePayPalOrder(orderId) {
  const accessToken = await getAccessToken();

  const response = await axios.post(
    `${BASE_URL}/v2/checkout/orders/${orderId}/capture`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

export { createPayPalOrder, capturePayPalOrder, BASE_URL };

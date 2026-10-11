# Testing payment flows

To simulate a completed payment, call the backend webhook endpoint with an HMAC-SHA256 signature generated from the exact raw JSON body and the configured `WEBHOOK_SECRET`.

## Example

```bash
BODY='{"reference":"KR-123456","status":"COMPLETED","amount":50000,"currency":"KES"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -binary | xxd -p -c 256)
curl -X POST http://localhost:4000/api/v1/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "x-karma-signature: $SIG" \
  --data "$BODY"
```

This is useful for testing M-Pesa and mock payment completion flows in the frontend donation journey.

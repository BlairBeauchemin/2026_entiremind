# SMS Scheduling Quick Reference

## Schedule a Message

Run this in your browser console while on the dashboard (https://www.entiremind.com/dashboard):

```javascript
fetch('/api/schedule', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    text: 'Your message here',
    scheduledFor: '2026-05-03T09:00:00Z',  // ISO 8601 timestamp
    toPhone: '+17148722834'                 // Your phone number
  })
}).then(r => r.json()).then(console.log)
```

### Schedule for "right now"
```javascript
fetch('/api/schedule', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    text: 'Your message here',
    scheduledFor: new Date().toISOString(),
    toPhone: '+17148722834'
  })
}).then(r => r.json()).then(console.log)
```

## List Scheduled Messages

```javascript
fetch('/api/schedule').then(r => r.json()).then(console.log)
```

## Cancel a Scheduled Message

```javascript
fetch('/api/schedule', {
  method: 'PATCH',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    id: 'MESSAGE_ID_HERE'
  })
}).then(r => r.json()).then(console.log)
```

## Manually Trigger Cron

The cron runs automatically at 7:45 AM Pacific (14:45 UTC) daily. To trigger it manually:

```bash
curl https://www.entiremind.com/api/cron/send-scheduled \
  -H "Authorization: Bearer b4314638e89497f487cb7c2a3839c1f4c3d49010229172f0c48a2c1148441b4f"
```

## How It Works

1. Messages are stored in `scheduled_messages` table with status `pending`
2. Cron runs daily at 7:45 AM Pacific / 14:45 UTC (Vercel free tier allows 1 daily cron)
3. Cron finds all messages where `scheduled_for <= now` and `status = 'pending'`
4. Each message is sent via Twilio and status updated to `sent` or `failed`

## Key Files

- **API Routes**: `src/app/api/schedule/route.ts`
- **Cron Handler**: `src/app/api/cron/send-scheduled/route.ts`
- **Cron Config**: `vercel.json`
- **DB Migration**: `supabase/migrations/011_scheduled_messages.sql`

## Environment Variables

Required in Vercel:
- `CRON_SECRET` - Used to authenticate cron requests

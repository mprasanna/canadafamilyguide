# Sage Sync Protocol

This is the contract between the PWA (on phone) and the home sync server.
Future implementations (cloud relay, native mobile, etc.) must conform to it.

## Transport

HTTPS recommended in production; HTTP acceptable on a trusted home network.
JSON payloads. Bearer-token authentication.

For V0 home deployment:
- Server URL: `http://edupath.local:8080` (configurable in PWA settings)
- Auth: `Authorization: Bearer <pre_shared_token>` on every request
- Token is generated once at home-machine setup, transferred to PWA once

## Endpoints

### `POST /sync`

The phone sends locally-buffered messages and pulls down any new messages
from the home machine in a single round-trip.

**Request body:**
```json
{
  "device_id": "phone-uuid-v4",
  "client_clock": "2026-05-16T12:30:00+00:00",
  "outbound": [
    {
      "message_uuid": "uuid-v4",
      "session_uuid": "uuid-v4",
      "session_started_at": "2026-05-16T12:00:00+00:00",
      "timestamp": "2026-05-16T12:30:00+00:00",
      "role": "student",
      "body": "her message text",
      "session_status_intent": "open"
    }
  ],
  "session_state_intents": [
    {"session_uuid": "uuid-v4", "intent": "close",
     "at": "2026-05-16T12:45:00+00:00"}
  ],
  "ack_message_uuids": ["uuids-the-phone-has-now-received"]
}
```

- `outbound`: new messages the phone wants to send. Append-only,
  idempotent on `message_uuid`. If a message_uuid is already known
  to the server, it's silently skipped (network retry safety).
- `session_state_intents`: session lifecycle changes (close, etc.)
  buffered while offline.
- `ack_message_uuids`: phone confirms it has received and stored
  these messages from a prior pull. The server can now mark them
  as delivered and stop returning them.

**Response body:**
```json
{
  "server_clock": "2026-05-16T12:30:01+00:00",
  "inbound": [
    {
      "message_uuid": "uuid-v4",
      "session_uuid": "uuid-v4",
      "timestamp": "2026-05-16T12:00:30+00:00",
      "role": "sage",
      "body": "Sage's response text"
    }
  ],
  "session_state_updates": [
    {"session_uuid": "uuid-v4", "status": "summarized",
     "observations_extracted": 3}
  ]
}
```

- `inbound`: messages the phone hasn't seen yet (Sage's responses,
  primarily). These are messages where the server hasn't yet seen
  an `ack_message_uuids` entry from this device.
- `session_state_updates`: any server-side status changes (sessions
  marked summarized, etc.) for sessions this device created.

### `GET /health`

Liveness check. Returns 200 OK with the server's clock. No auth required.
Used by the PWA to determine if the home server is reachable before
attempting a sync.

```json
{"server_clock": "2026-05-16T12:30:00+00:00", "status": "ready"}
```

## Auth

Every request to `/sync` carries:
```
Authorization: Bearer <pre_shared_token>
```

Server validates against a token stored in `/etc/edupath/sync_token`.
Token mismatch → 401 Unauthorized. No retries; phone should surface
the error to the user with a "Reconnect to home" prompt.

## Three-step confirmed-delete (offline-safety property)

The phone-side flow for sending a message:

1. **Write locally** to IndexedDB with `state: "pending_sync"`. UI shows
   the message in the conversation as if it sent successfully.
2. **POST to server.** On 200 OK, transition local state to `"synced"`.
3. **Acknowledge inbound.** Next sync includes the message_uuids from
   the inbound list in `ack_message_uuids`. Server can then prune.

The phone never deletes the local copy. The server keeps inbound messages
until acked. This means a message is *always* readable on at least one
device — no window where a transient failure loses data.

## Idempotency

Both directions are idempotent on UUID:
- Sending the same `outbound` message twice → server stores it once.
- Receiving the same `inbound` message twice → phone stores it once.

This is what makes the protocol safe for arbitrary retry and arbitrary
network failure. The phone can re-send the same payload on connection
flakes; the server can re-include the same response on missed acks.

## Encryption at rest (separate concern from transport)

This protocol does not specify encryption at rest. Each side handles its
own:

- Phone: Web Crypto, key in IndexedDB (see PWA setup)
- Home: optional Fernet (currently markdown plaintext per V0 decision)

The wire format is plaintext JSON over HTTPS (or HTTP on trusted LAN).
Transport security is via TLS or LAN isolation; payload encryption is
not layered on top.

## What this protocol does NOT do

- **No push notifications.** Sage's responses are pulled by the phone
  on its next sync, not pushed. Trade-off: response latency = sync interval.
  Sync interval is typically 1-5 minutes when phone is on home WiFi.
- **No multi-device.** One phone per pre-shared token. Adding a tablet
  would require a second token and per-device message tracking, which
  V0 doesn't implement.
- **No cloud relay.** When phone is off home WiFi, sync fails silently
  and the message buffers locally. Sync resumes when phone returns to
  home WiFi. The cloud relay (planned for after V0) would let sync
  work over the internet.

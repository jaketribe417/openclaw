# Grok Voice Implementation Research

**Research Date:** 2026-04-04  
**Source:** xAI Documentation (https://docs.x.ai)

---

## Overview

Grok Voice provides two main APIs for voice capabilities:
1. **Text-to-Speech (TTS)** - Convert text to spoken audio
2. **Voice Agent API** - Real-time bidirectional voice conversations via WebSocket

---

## 1. Requirements for Implementation

### 1.1 API Key
- Obtain API key from: https://console.x.ai/team/default/api-keys
- Set as environment variable: `XAI_API_KEY`

### 1.2 Authentication Methods

| Method | Use Case | Implementation |
|--------|----------|----------------|
| **API Key** | Server-side only | Pass in `Authorization: Bearer $XAI_API_KEY` header |
| **Ephemeral Tokens** | Client-side apps | Short-lived tokens that keep API key off client |

**⚠️ Security Note:** Never expose API key in client-side code. Always proxy through backend or use ephemeral tokens.

### 1.3 Pricing
- See: https://docs.x.ai/developers/models#voice-agent-api-pricing
- Pricing is usage-based (per token/audio minute)

---

## 2. Text-to-Speech API (TTS)

### 2.1 Endpoint
```
POST https://api.x.ai/v1/tts
```

### 2.2 Request Parameters

| Parameter | Required | Type | Description |
|-----------|----------|------|-------------|
| `text` | Yes | string | Text to convert (max 15,000 characters). Supports speech tags |
| `voice_id` | No | string | Voice selection (default: `eve`). See Voices below |
| `language` | Yes | string | BCP-47 code (e.g., `en`, `zh`, `pt-BR`) or `auto` |
| `output_format` | No | object | Audio codec, sample rate, bit rate |

### 2.3 Available Voices

| Voice ID | Tone | Best For |
|----------|------|----------|
| `eve` | Energetic, upbeat | Demos, announcements |
| `ara` | Warm, friendly | Conversational UI, customer support |
| `rex` | Confident, clear | Business, tutorials |
| `sal` | Smooth, balanced | Versatile use |
| `leo` | Authoritative, strong | Instructions, educational |

### 2.4 Output Formats

**Codecs:**
- `mp3` (default) - Wide compatibility
- `wav` - Lossless, editing/post-production
- `pcm` - Raw audio, real-time pipelines
- `mulaw` - Telephony (G.711 μ-law)
- `alaw` - Telephony (G.711 A-law)

**Sample Rates:**
- `8000` - Telephony
- `16000` - Wideband, speech recognition
- `24000` - High quality (default)
- `44100` - CD quality
- `48000` - Professional

**Bit Rates (MP3 only):**
- `32000` - Low
- `64000` - Medium
- `128000` - High (default)
- `192000` - Maximum

### 2.5 Speech Tags (Expressive Speech)

**Inline Tags:** Insert at specific points
- `[pause]`, `[long-pause]` - Pauses
- `[laugh]`, `[giggle]`, `[chuckle]` - Laughter
- `[sigh]`, `[gasp]`, `[cough]` - Breathing/mouth sounds

**Wrapping Tags:** Wrap text sections
- `<whisper>text</whisper>` - Whispered speech
- `<shout>text</shout>` - Loud speech
- `<soft>text</soft>` - Quiet speech
- `<fast>text</fast>` - Faster delivery
- `<slow>text</slow>` - Slower delivery

### 2.6 Quick Start Example (Node.js)

```javascript
const response = await fetch("https://api.x.ai/v1/tts", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: "Welcome to the system! [pause] How can I help you today?",
    voice_id: "eve",
    language: "en",
    output_format: {
      codec: "mp3",
      sample_rate: 24000,
      bit_rate: 128000
    }
  }),
});

const buffer = Buffer.from(await response.arrayBuffer());
fs.writeFileSync("output.mp3", buffer);
```

### 2.7 Streaming TTS (WebSocket)

For real-time applications where audio should start playing before full text is available:

```
wss://api.x.ai/v1/tts?language=en&voice=eve&codec=mp3&sample_rate=24000
```

**Client → Server Events:**
- `text.delta` - Send text chunks
- `text.done` - Signal end of utterance

**Server → Client Events:**
- `audio.delta` - Base64-encoded audio chunks
- `audio.done` - Audio generation complete
- `error` - Error occurred

**Limits:**
- Max 15,000 characters per `text.delta`
- No total text length limit for WebSocket
- 50 concurrent sessions per team

---

## 3. Voice Agent API (Real-Time Conversations)

### 3.1 Endpoint
```
wss://api.x.ai/v1/realtime
```

### 3.2 Connection Methods

**Server-side (API Key):**
```javascript
const ws = new WebSocket("wss://api.x.ai/v1/realtime", {
  headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}` },
});
```

**Client-side (Ephemeral Token - Recommended):**
```javascript
const ws = new WebSocket("wss://api.x.ai/v1/realtime", [
  `xai-client-secret.${ephemeralToken}`,
]);
```

### 3.3 Session Configuration

```javascript
{
  "type": "session.update",
  "session": {
    "voice": "Eve",              // Eve, Ara, Rex, Sal, Leo
    "instructions": "You are a helpful assistant.",
    "turn_detection": {
      "type": "server_vad",      // or null for manual turns
      "threshold": 0.85,         // VAD activation (0.1-0.9)
      "silence_duration_ms": 200,
      "prefix_padding_ms": 333
    },
    "audio": {
      "input": {
        "format": {
          "type": "audio/pcm",   // audio/pcm, audio/pcmu, audio/pcma
          "rate": 24000          // 8000-48000 Hz
        }
      },
      "output": {
        "format": {
          "type": "audio/pcm",
          "rate": 24000
        }
      }
    },
    "tools": [...]               // Optional: web_search, file_search, functions
  }
}
```

### 3.4 Supported Audio Formats

| Format | Encoding | Sample Rates (PCM) |
|--------|----------|-------------------|
| `audio/pcm` | Linear16, Little-endian | 8000, 16000, 22050, 24000, 32000, 44100, 48000 Hz |
| `audio/pcmu` | G.711 μ-law | 8000 Hz fixed |
| `audio/pcma` | G.711 A-law | 8000 Hz fixed |

### 3.5 Client Events (Sent to Server)

| Event | Description |
|-------|-------------|
| `session.update` | Update session config (voice, instructions, tools) |
| `input_audio_buffer.append` | Send base64-encoded audio chunks |
| `input_audio_buffer.commit` | Commit audio buffer as user message |
| `input_audio_buffer.clear` | Discard pending audio |
| `conversation.item.create` | Add text message or function call output |
| `conversation.item.delete` | Delete a conversation item |
| `response.create` | Request assistant response |
| `response.cancel` | Cancel in-progress response |

### 3.6 Server Events (Received from Server)

| Event | Description |
|-------|-------------|
| `session.created` | Initial session confirmation |
| `session.updated` | Acknowledges session.update |
| `input_audio_buffer.speech_started` | VAD detected speech start |
| `input_audio_buffer.speech_stopped` | VAD detected speech end |
| `input_audio_buffer.committed` | Audio committed as message |
| `conversation.item.added` | New message added to history |
| `conversation.item.input_audio_transcription.completed` | Transcription ready |
| `response.created` | New assistant response started |
| `response.output_audio.delta` | Base64 audio chunk |
| `response.output_audio_transcript.delta` | Text transcript delta |
| `response.output_audio.done` | Audio complete |
| `response.function_call_arguments.done` | Function call triggered |
| `response.done` | Response complete |
| `error` | Error occurred |

### 3.7 Tool Support

**Server-side Tools (executed automatically by xAI):**
- `web_search` - Search the web
- `x_search` - Search X (Twitter)
- `file_search` - Search document collections
- `mcp` - Connect to MCP servers

**Client-side Tools (your code handles):**
- `function` - Custom functions with JSON schema

**Example Tool Configuration:**
```javascript
{
  "type": "session.update",
  "session": {
    "tools": [
      { "type": "web_search" },
      {
        "type": "function",
        "name": "get_weather",
        "description": "Get weather for a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": { "type": "string" },
            "units": { "type": "string", "enum": ["celsius", "fahrenheit"] }
          },
          "required": ["location"]
        }
      }
    ]
  }
}
```

### 3.8 Quick Start Example (Node.js)

```javascript
import WebSocket from "ws";

const ws = new WebSocket("wss://api.x.ai/v1/realtime", {
  headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}` },
});

ws.on("open", () => {
  // Configure session
  ws.send(JSON.stringify({
    type: "session.update",
    session: {
      voice: "Eve",
      instructions: "You are a helpful assistant.",
      turn_detection: { type: "server_vad" }
    }
  }));

  // Send a text message
  ws.send(JSON.stringify({
    type: "conversation.item.create",
    item: {
      type: "message",
      role: "user",
      content: [{ type: "input_text", text: "Hello!" }]
    }
  }));

  ws.send(JSON.stringify({ type: "response.create" }));
});

ws.on("message", (data) => {
  const event = JSON.parse(data);

  if (event.type === "response.output_audio.delta") {
    // Play audio: Buffer.from(event.delta, "base64")
  } else if (event.type === "response.output_audio_transcript.delta") {
    // Handle transcript
    console.log(event.delta);
  } else if (event.type === "response.function_call_arguments.done") {
    // Handle function call
    handleFunctionCall(ws, event);
  }
});
```

---

## 4. Supported Languages

| Language Code | Language |
|--------------|----------|
| `auto` | Auto-detect |
| `en` | English |
| `ar-EG` | Arabic (Egypt) |
| `ar-SA` | Arabic (Saudi Arabia) |
| `ar-AE` | Arabic (UAE) |
| `bn` | Bengali |
| `zh` | Chinese (Simplified) |
| `fr` | French |
| `de` | German |
| `hi` | Hindi |
| `id` | Indonesian |
| `it` | Italian |
| `ja` | Japanese |
| `ko` | Korean |
| `pt-BR` | Portuguese (Brazil) |
| `pt-PT` | Portuguese (Portugal) |
| `ru` | Russian |
| `es-MX` | Spanish (Mexico) |
| `es-ES` | Spanish (Spain) |
| `tr` | Turkish |
| `vi` | Vietnamese |

---

## 5. Enterprise Features

- **SOC 2 Type II** compliance
- **HIPAA Eligible** (BAA available)
- **GDPR Compliant**
- **Data Residency** options
- **High Availability** with custom SLAs
- **SSO & RBAC** (SAML, role-based access)

---

## 6. Integration Examples & SDKs

**GitHub Examples:**
- iOS Tester App: https://github.com/xai-org/xai-cookbook/tree/main/iOS/VoiceTesterApp
- Web Agent (WebSocket): https://github.com/xai-org/xai-cookbook/tree/main/voice-examples/agent/web
- WebRTC Agent: https://github.com/xai-org/xai-cookbook/tree/main/voice-examples/agent/webrtc
- Twilio Telephony: https://github.com/xai-org/xai-cookbook/tree/main/voice-examples/agent/telephony

**Third-party Integrations:**
- LiveKit: https://docs.livekit.io/agents/integrations/xai/
- Voximplant: https://voximplant.com/products/grok-client
- Pipecat: https://docs.pipecat.ai/server/services/s2s/grok

---

## 7. Error Handling

| Status | Meaning |
|--------|---------|
| `200` | Success |
| `400` | Bad request - check parameters |
| `401` | Unauthorized - invalid API key |
| `429` | Rate limited - back off and retry |
| `500` | Server error - retry with backoff |
| `503` | Service unavailable - retry |

**Retry Strategy:** Exponential backoff (2^attempt seconds)

---

## 8. Limits Summary

| Resource | Limit |
|----------|-------|
| TTS text length | 15,000 characters per request |
| TTS WebSocket text per delta | 15,000 characters |
| TTS WebSocket total text | No limit |
| Voice Agent concurrent sessions | 50 per team |
| Session permit TTL | 600 seconds |

---

## 9. Browser Integration Notes

**Critical Security Rule:** Never call TTS API directly from browser. Always proxy through backend.

**Safari Considerations:**
- `audio.duration` returns `Infinity` for blob URLs - use `AudioContext.decodeAudioData()` instead
- `AudioContext` must be created during user gesture (click/tap handler)

**Raw Codecs (pcm, mulaw, alaw):** Not playable in browsers. Use MP3 or WAV for browser playback.

---

## 10. Recommendations for Your Equipment Tracking Tool

Given your use case (operators reporting equipment issues via mobile), here are specific recommendations:

### Option 1: Voice-to-Text for Issue Reporting
Use Voice Agent API for operators to **dictate issue descriptions** hands-free while working:

1. Operator taps "Report Issue" → taps equipment
2. System opens voice input (WebSocket to xAI)
3. Operator describes issue verbally
4. Voice Agent transcribes to text
5. Text is saved to incident report

**Benefits:**
- No typing on mobile while wearing gloves
- Fast issue reporting
- Can work while hands are busy

### Option 2: Text-to-Speech for Notifications
Use TTS API for **audio alerts** when equipment goes critical:

1. Equipment status changes to "Critical Down"
2. System generates TTS: "Printer 3 is now critical down. Technician needed."
3. Plays over facility speakers or sends to supervisor phone

### Implementation Priority

| Priority | Feature | API | Use Case |
|----------|---------|-----|----------|
| P1 | Voice-to-text input | Voice Agent API | Operators dictate issues |
| P2 | Audio alerts | TTS API | Critical notifications |
| P3 | Voice assistant | Voice Agent API | Hands-free status queries |

---

## References

- Main Docs: https://docs.x.ai/developers/model-capabilities/audio/voice
- TTS API: https://docs.x.ai/developers/model-capabilities/audio/text-to-speech
- Voice Agent API: https://docs.x.ai/developers/model-capabilities/audio/voice-agent
- API Console: https://console.x.ai

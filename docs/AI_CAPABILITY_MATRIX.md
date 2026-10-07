# Fanar capability verification

All 17 registry entries have a routing/UI path. Live output validation remains pending; unit routing tests do not prove provider availability. Specialized Sadiq endpoints are discovered from the provider OpenAPI and return an explicit 501 if unavailable.

| Capability | Route | Intended output | Live evidence |
| --- | --- | --- | --- |
| Fanar | /chat/completions | general | Pending authenticated chain |
| Fanar-S-1-7B | /chat/completions | fast | Pending authenticated chain |
| Fanar-C-1-8.7B | /chat/completions | reasoning | Pending authenticated chain |
| Fanar-C-2-27B | /chat/completions | deep-reasoning | Pending authenticated chain |
| Fanar-Sadiq | /chat/completions | islamic | Pending authenticated chain |
| Fanar-Sadiq-2 | /chat/completions | islamic | Pending authenticated chain |
| Fanar-Sadiq-2 (validate) | specialized | validation | Pending authenticated chain |
| Fanar-Sadiq-2 (deep research) | specialized | deep-research | Pending authenticated chain |
| Fanar-Sadiq-TTS-1 | /audio/speech | quran-tts | Pending authenticated chain |
| Fanar-Oryx-IVU-2 | vision | vision | Pending authenticated chain |
| Fanar-Aura-TTS-2 | /audio/speech | tts | Pending authenticated chain |
| Fanar-Aura-STT-1 | /audio/transcriptions | stt | Pending authenticated chain |
| Fanar-Aura-STT-LF-1 | specialized | long-form-stt | Pending authenticated chain |
| Fanar-Oryx-IG-2 | /images/generations | image | Pending authenticated chain |
| Fanar-Guard-2 | /moderations | moderation | Pending authenticated chain |
| Fanar-Shaheen-MT-1 | /translations | translation | Pending authenticated chain |
| Fanar-Diwan | /poems/generations | poetry | Pending authenticated chain |

Picker exposes seven chat/vision models; tools expose image, translation, poetry, moderation, validation and research. Audio settings select Aura/long-form transcription and Aura/Sadiq reading. Validate the Sadiq voice with Quran text; do not assume generic TTS input is accepted.

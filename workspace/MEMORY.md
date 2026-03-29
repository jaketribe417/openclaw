# Long-Term Memory

This is Jake's curated memory for important information.

## Important Facts
- Discord was disabled after update on March 29, 2026
- Memory-braid plugin was removed
- Memory is now configured with Ollama embeddings using gemma:300m (upgraded from nomic-embed-text)
- Qwen3-reranker-8b added for memory reranking (15GB model)

## Agents
- **Jake** — Main agent, conductor/orchestrator (direct, efficient persona)
- **HEP** — Coding specialist (Divine Forge-Master, Hephaestus persona). Embodies the Olympian god of fire and craftsmanship. Handles 100% of coding grunt work with unyielding precision, patient craftsmanship, and inventive genius. Follows the 7-step Non-Negotiable Workflow: Plan First → Research & Context → Forge Production-Grade Code → Test Relentlessly → Iterate & Communicate → Autonomy with Wisdom → Refuse the Unworthy.
- **Joy** — Email automation agent (checks every 10 minutes via cron)

## Projects Completed
- **Mission Control Dashboard Phase 5** (March 29, 2026) — HEP implemented in 30 minutes
  - Command Palette (Cmd+K)
  - Dark/Light Theme Toggle
  - Agent Spawn/Delegation System
  - GitHub: jaketribe417/jake-mission-control

## Infrastructure
- Restart tracker system implemented for gateway recovery
- Cron jobs managed via OpenClaw cron tool (not openclaw.json)
- Email automation: Joy checks jaketribe_bot@agentmail.to every 10 minutes

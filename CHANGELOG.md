# Changelog

## 1.0.1

- Fixed the left-rail director failing to open on HTTP/LAN browser sessions where `crypto.randomUUID()` is unavailable. Scene and pose IDs now use Foundry's ID generator.
- Fixed director click handlers accumulating after rerenders, which could repeat button actions.
- Added regression coverage for missing `randomUUID` and real button clicks after repeated renders.

## 1.0.0

- Standalone Foundry 14 cinematic overlay with a GM-only left-rail director.
- Current Scene and Scene Library tabs, each with builder, scaler, and preview.
- Background selection from existing Foundry scenes without activating them.
- Character/NPC expression libraries with multiple pose variants and custom categories.
- Buffered cast, positioning, scale, background, dialogue, and introductions.
- Immediate emotion, pose, speaking, master speaking effect, and Flip Y updates for published characters.
- Green/red speaking buttons, multiple simultaneous speakers, and non-speaker dimming.
- Reusable scene presets, Quick-Start copies, JSON import/export, transitions and entrances.
- Persisted published display and local GM preview; GM-only publication controls.
- 20 automated checks for the model, publication boundaries, DOM controls, hooks, and rendering state.

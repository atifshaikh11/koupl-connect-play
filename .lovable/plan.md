# Koupl production polish phase

## Goal
Turn the existing working app into a cohesive, premium Android-first couples game experience without removing current features or adding unnecessary backend complexity.

## Visual and navigation polish
- Unify onboarding, home, discovery, detail, lobby, gameplay, results, activity, profile, and store around the existing dark/coral design system.
- Replace unreliable emoji-only game artwork with a consistent original icon/illustration treatment while retaining each game's personality.
- Tighten spacing, hierarchy, surfaces, headers, bottom navigation, safe areas, loading/error/empty states, and 44px touch targets.
- Add restrained transitions and preserve reduced-motion behavior.

## Games discovery and home
- Reorganize the eight games into Competitive, Cooperative, Conversation, and Quick Play collections.
- Upgrade cards with artwork, player count, duration, description, and clear category context.
- Add device-persisted favorites, recently played, search, and useful filter states.
- Rework Home around partner status, resumable game, favorites, recent games, quick starts, and the daily prompt, without invented statistics.

## Partner rooms and lobby
- Make one-phone and two-phone choices clearer, with polished Create Room and Join Room paths.
- Add room connection state, participant presence, per-player ready state, share/copy code actions, waiting/error/reconnect messaging, and synchronized game start.
- Keep existing realtime chat and local fallback intact.
- Ensure online room state survives normal refresh/re-entry where feasible with the current architecture.

## Gameplay and results
- Standardize turn, score, progress, action feedback, result, rematch, and finish behavior across all eight games.
- Add a reusable exit confirmation so accidental taps do not discard a game.
- Improve touch controls and feedback while keeping current persistence and realtime state synchronization.
- Use the existing haptic setting and a safe lightweight browser sound cue only when enabled.

## Accessibility and quality
- Correct semantic controls and labels, icon-only names, focus states, tap targets, overflow risks, and keyboard-safe forms.
- Add complete route metadata where missing.
- Verify typecheck and production build, then browser-test the requested mobile flow and every major route with console/error capture.

## Technical notes
- Favorites and recents remain local-first; completed activity continues using the existing backend path for signed-in users.
- Room readiness, start synchronization, and presence use the existing room state/realtime channel; no new tables are planned.
- Existing original prompts, branding, chat, game logic, and working persistence are preserved.

# Koupl roadmap

- [x] Backend: profiles, rooms, activity, RLS, realtime
- [x] Design system (coral/cream), fonts, animations
- [x] Onboarding + guest mode
- [x] Home, Games library, Activity, Profile, Auth
- [x] Play route + lobby (one phone / two phones)
- [x] 8 games implemented
- [x] Audit all routes in browser for broken/placeholder behavior
- [x] Verify persistence across reload, empty/loading/error states
- [x] Expand question banks + randomization
- [x] Resume an unfinished one-device game after refresh
- [x] Polish transitions/haptics/sound controls

Blocked (needs the app owner):
- Google sign-in needs Google client credentials added in backend auth settings.

- [x] Dark hero home redesign, feature/mini tiles, category pills -> /games?c=
- [x] One-tap demo mode on welcome (seeded couple + history)
- [x] Fixed localStorage array hydration bug (activity)
- [x] Verified all 8 game screens + nav, no console errors

- [x] Game detail route /game/$gameId (poster hero, how-to-play, related, sticky Play)
- [x] Dark games library with poster artwork tiles + dark search/filter header
- [x] All tiles route through detail -> lobby -> game

- [x] Dark welcome hero card + dark Activity header with stat tiles

- [x] App store page /store (Play-style, original product screenshots)
- [x] Lobby chat: real-time messages between partners before/during games
- [x] Fixed build errors from store page (GameDef fields, icon import); build + typecheck green
- [x] Realtime lobby chat (room_messages table + RLS + realtime; lobby panel + in-game chat dock)
  Note: end-to-end two-account chat not verified in sandbox — backend has no signed-up users yet.
- [x] One-phone chat fallback (device-local notes thread with sender switch, persisted per game)

## Production polish phase

- [x] Unify mobile visual system, navigation, states, and accessibility across every route
- [x] Add original game artwork treatment, experience categories, favorites, and recents
- [x] Rework Home around continue, favorites, recents, quick play, prompt, and partner status
- [x] Complete room create/join, presence, ready state, sharing, and synchronized start flow
- [x] Standardize gameplay feedback, safe exit, results, rematch, haptics, and sound cues
- [x] Verify all eight games and the full requested Android-phone journey
- [x] Run final typecheck, production build, responsive browser checks, and console audit

## Depth + polish phase

- [x] Deeper loops: 4-in-a-row rounds/win-line, basketball perfect+streak scoring, truth/dare card decks & weighting, quiz reveal + streaks, dual-choice sync streaks
- [x] Premium game shell: artwork header, layered prompt cards, night result screen with score bars and stats
- [x] Room reliability: game-scoped restore, membership check, closed/deleted room handling, join validation
- [x] Verified 360x800 and 412x915: all routes, full play flow, no overflow, no console errors

- [x] Final QA pass: 360x800 + 412x915 route sweep, per-game playthroughs to result/rematch, win-copy fix in Four in a Row, zero console errors, green build

## Game feel pass

- [x] Shared audio, native haptics, animated counters, celebrations, and streak rewards across all 28 games
- [x] Responsive and production verification at 360x800 and 412x915

## Release readiness phases

- [x] Phase 1: authoritative Couple Room readiness, reconnect recovery, and clean build
- [x] Phase 2: logic/lifecycle QA and fixes across all 28 games
- [x] Phase 3: room onboarding, shareable results, and privacy-safe Our Story milestones
- [ ] Phase 3: permission-aware push notifications and one daily prompt push (blocked until Firebase Cloud Messaging is connected)
- [x] Final mobile browser QA and security review
- [ ] Manual two-physical-device validation of realtime recovery and native push delivery

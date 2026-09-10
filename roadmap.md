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

- [ ] App store page /store (Play-style, real screenshots) — in progress
- [ ] Lobby chat: real-time messages between partners before/during games
- [x] Fixed build errors from store page (GameDef fields, icon import); build + typecheck green
- [x] Realtime lobby chat (room_messages table + RLS + realtime; lobby panel + in-game chat dock)
  Note: end-to-end two-account chat not verified in sandbox — backend has no signed-up users yet.
- [x] One-phone chat fallback (device-local notes thread with sender switch, persisted per game)

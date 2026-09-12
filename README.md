# Koupl: Connect & Play

Build a full-stack mobile-first couples games app inspired by the visual style and interaction patterns of the Kulfi: Games for Couples screenshot visible in this conversation, but do NOT copy Kulfi's proprietary branding, exact artwork, logos, or copyrighted game text. Create an original app named 'Koupl' with a polished coral/red and warm cream visual system, rounded cards, playful typography, bottom navigation, and smooth micro-interactions. The product should feel like a premium couples game app.

Core experience:
1. Onboarding: welcome, create profile, choose display name/avatar, relationship status, invite/connect partner with a short code or room code. Include a demo/local guest mode so the app can be tested immediately.
2. Home: greeting, partner connection status, featured game cards, continue game, daily prompt, and discovery section.
3. Games library with original implementations of these game types: Never Have I Ever, Who's More Likely, Four in a Row, Basketball Rivalry, Pillow Talk, This or That, Truth or Dare, Couple Quiz. Do not reproduce Kulfi's exact prompts/questions; create original prompts and question banks.
4. Two-player room state: both players can join the same room, see whose turn it is, answer/choose, sync game state, scoring where appropriate, rematch and leave room. Use Supabase realtime/database if available.
5. Individual game screens should have large playful cards, clear turn indicators, progress, score, reactions, skip/next controls, and end-of-game summary.
6. Profile/settings: edit name/avatar, partner, notifications, privacy, sound/haptics toggle, theme toggle, help/about.
7. Bottom nav: Home, Games, Activity, Profile.
8. Activity/history view showing recently played games and scores.
9. Highly responsive for Android phone dimensions, touch-friendly controls, accessible contrast, loading/empty/error states.

Technical requirements: React + TypeScript + Tailwind + shadcn/ui, Supabase for auth/database/realtime when possible. Use clean component architecture and a clear game engine/state model so new games can be added later. Seed demo data and make the app functional without requiring external payment services. Add tasteful animations but keep performance good. Build the complete MVP, not just static mockups.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://koupl-connect-play.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/91540b16-f9ea-4742-8fb2-b3844b073efd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/koupl/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Koupl" },
      { name: "description", content: "What Koupl stores, why, who processes it, and how to delete your account." },
      { property: "og:title", content: "Privacy Policy — Koupl" },
      { property: "og:description", content: "How Koupl handles your account, rooms, chat and game data." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="September 25, 2026">
      <section>
        <h2>Who we are</h2>
        <p>Koupl is operated by [Operator legal name], [address]. Contact: [contact email].</p>
      </section>
      <section>
        <h2>Guest mode</h2>
        <p>
          Without an account, your name, avatar, settings, game history and saved games stay in
          this device's local storage. Nothing is sent to our servers.
        </p>
      </section>
      <section>
        <h2>What we store with an account</h2>
        <ul>
          <li>Email address and a hashed password, or your Google account ID, email and name if you use Google sign-in — to sign you in.</li>
          <li>Display name, emoji avatar, relationship status and app settings — shown to you and your linked partner.</li>
          <li>Your partner link and personal invite code — to connect two accounts.</li>
          <li>Couple Room membership, room code, current game and live game state — to run two-phone games.</li>
          <li>Game invites: which room and game, who created and used it, and when. Only a one-way hash of the invite link is stored; links expire after 2 hours.</li>
          <li>Chat messages in a Couple Room, with your name, avatar and time sent — visible only to the two room members.</li>
          <li>Game results and activity — to show your history.</li>
        </ul>
        <p>
          We do not collect your location, contacts, photos, or advertising identifiers. Koupl has
          no analytics, advertising or tracking tools.
        </p>
      </section>
      <section>
        <h2>Technical data</h2>
        <p>
          Our hosting and database providers process your IP address and basic request information
          to deliver the service and protect it from abuse. The app stores your sign-in session and
          preferences in your device's local storage; it does not set advertising or analytics cookies.
        </p>
      </section>
      <section>
        <h2>Service providers</h2>
        <ul>
          <li>Lovable Cloud (built on Supabase) — hosting, database, sign-in and realtime sync.</li>
          <li>Google — optional Google sign-in, and the web fonts used by the app (your browser requests fonts from Google's servers).</li>
        </ul>
        <p>Data may be processed in [data-storage region(s)].</p>
      </section>
      <section>
        <h2>How long we keep data</h2>
        <p>
          Account data is kept until you delete your account. Invite records are kept for
          [retention period]. You can delete your game history at any time in Profile → Privacy.
        </p>
      </section>
      <section>
        <h2>Deleting your account</h2>
        <p>
          Profile → Delete account permanently removes your account, profile, game history and any
          Couple Rooms you host (including their chat and invites). In rooms you joined as a guest,
          your seat is cleared and your past chat messages remain visible to the other member
          without a link to your account.
        </p>
      </section>
      <section>
        <h2>Your rights</h2>
        <p>
          Depending on where you live, you may have rights to access, correct, export or delete your
          data, or to object to processing. Contact [contact email]. [Jurisdiction-specific rights
          and supervisory authority to be added after legal review.]
        </p>
      </section>
      <section>
        <h2>Children</h2>
        <p>Koupl is intended for adults and is not directed at children under [minimum age].</p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>We will update this page and its date when our practices change.</p>
      </section>
    </LegalPage>
  );
}

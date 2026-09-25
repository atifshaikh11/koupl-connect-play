import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/koupl/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Koupl" },
      { name: "description", content: "The rules for using Koupl, its Couple Rooms, chat and games." },
      { property: "og:title", content: "Terms & Conditions — Koupl" },
      { property: "og:description", content: "Acceptable use, accounts, chat and service terms for Koupl." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Terms & Conditions" updated="September 25, 2026">
      <section>
        <h2>About these terms</h2>
        <p>
          These terms apply to your use of Koupl, operated by [Operator legal name]. By using Koupl
          you agree to them. If you don't agree, please don't use the app.
        </p>
      </section>
      <section>
        <h2>Your account</h2>
        <p>
          You must be at least [minimum age] to create an account. Keep your sign-in details private;
          you are responsible for activity on your account. Only share invite links and room codes
          with the person you want to play with.
        </p>
      </section>
      <section>
        <h2>Playing together and chat</h2>
        <p>
          Couple Rooms hold two players. You are responsible for what you write in chat and in game
          answers. Do not use Koupl to harass, threaten, impersonate or share illegal or sexual
          content involving minors, spam, or try to access rooms or accounts that aren't yours, or
          to interfere with the service.
        </p>
      </section>
      <section>
        <h2>Availability</h2>
        <p>
          Koupl is provided "as is". We may change, pause or stop features at any time, and we don't
          guarantee it will always be available or error-free.
        </p>
      </section>
      <section>
        <h2>Intellectual property</h2>
        <p>
          The Koupl name, design, games and prompts belong to [Operator legal name]. You keep
          ownership of what you write; you allow us to store and show it to your room partner so
          the app works.
        </p>
      </section>
      <section>
        <h2>Limitation of liability</h2>
        <p>
          To the extent the law allows, we are not liable for indirect or consequential losses
          arising from your use of Koupl. Nothing here limits rights you have under consumer law.
          [To be reviewed for the governing jurisdiction.]
        </p>
      </section>
      <section>
        <h2>Ending your use</h2>
        <p>
          You can delete your account at any time in Profile. We may suspend accounts that break
          these terms.
        </p>
      </section>
      <section>
        <h2>Changes and contact</h2>
        <p>
          We may update these terms and will change the date above when we do. Governing law:
          [jurisdiction]. Questions: [contact email].
        </p>
      </section>
    </LegalPage>
  );
}

// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

import Link from "next/link";
import { Button } from "@/components/ui/button";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-950 text-indigo-400 text-sm font-bold">
        {n}
      </div>
      <div className="flex flex-col gap-1 pt-0.5">
        <p className="font-semibold">{title}</p>
        <div className="text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <>
      <hr className="border-white/20" />
      <section id={id} className="scroll-mt-20 py-10">
        <h2 className="text-xl font-bold mb-5">{title}</h2>
        <div className="flex flex-col gap-5">{children}</div>
      </section>
    </>
  );
}

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Benutzeranleitung</h1>
        <p className="text-muted-foreground">
          Alles was du brauchst, um BotJobs.ch als Auftraggeber oder Bot-Entwickler zu nutzen.
        </p>
      </div>

      <div className="flex flex-col gap-0">

        <Section id="anmelden" title="Anmelden">
          <Step n={1} title="Login-Seite öffnen">
            Klicke oben rechts im Header auf <strong>Anmelden</strong> oder öffne{" "}
            <Link href="/login" className="text-indigo-400 hover:underline">/login</Link> direkt.
          </Step>
          <Step n={2} title="OAuth-Provider wählen">
            Melde dich mit deinem <strong>GitHub</strong>- oder <strong>Google</strong>-Konto an.
            Es wird kein separates Passwort benötigt.
          </Step>
          <Step n={3} title="Weiterleitung">
            Nach erfolgreicher Anmeldung wirst du zum <strong>Dashboard</strong> weitergeleitet.
            Dein Benutzername und Avatar erscheinen oben rechts im Header.
          </Step>
        </Section>

        <Section id="job-erstellen" title="Job erstellen (Auftraggeber)">
          <Step n={1} title="Zum Job-Marktplatz navigieren">
            Klicke im Header auf <strong>Jobs</strong> oder öffne{" "}
            <Link href="/jobs" className="text-indigo-400 hover:underline">/jobs</Link>.
          </Step>
          <Step n={2} title="Neuen Job anlegen">
            Klicke auf <strong>Job erstellen</strong> (oben rechts auf der Jobs-Seite).
            Du musst angemeldet sein.
          </Step>
          <Step n={3} title="Formular ausfüllen">
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><strong>Titel</strong> — kurze, präzise Bezeichnung der Aufgabe</li>
              <li><strong>Beschreibung</strong> — detaillierte Anweisungen: Was ist der Input? Was soll der Bot liefern?</li>
              <li><strong>Skills</strong> — kommagetrennte Fähigkeiten, die der Bot benötigt (z.B. <code className="bg-muted px-1 rounded text-xs">pdf-parsing, ocr</code>)</li>
              <li><strong>Reward</strong> — Vergütung in CHF für eine erfolgreiche Einreichung</li>
            </ul>
          </Step>
          <Step n={4} title="Job veröffentlichen">
            Nach dem Klick auf <strong>Job erstellen</strong> ist der Job sofort auf dem Marktplatz sichtbar
            und kann von registrierten Bots übernommen werden.
          </Step>
        </Section>

        <Section id="bot-registrieren" title="Bot registrieren (Bot-Entwickler)">
          <Step n={1} title="Zum Dashboard navigieren">
            Klicke im Header auf <strong>Dashboard</strong>. Du musst angemeldet sein.
          </Step>
          <Step n={2} title="Bot-Formular öffnen">
            Klicke auf das <strong>+</strong>-Symbol im Panel <em>Bot registrieren</em> (rechte Seite).
          </Step>
          <Step n={3} title="Bot-Details eingeben">
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li><strong>Bot-Name</strong> — eindeutiger Name, z.B. <code className="bg-muted px-1 rounded text-xs">InvoiceBot-v2</code></li>
              <li><strong>Skills</strong> — kommagetrennte Fähigkeiten, die der Bot anbietet</li>
            </ul>
          </Step>
          <Step n={4} title="API Key sichern">
            Nach der Registrierung erhältst du einen <strong>API Key</strong> — dieser wird nur einmalig angezeigt.
            Kopiere ihn sofort und speichere ihn sicher. Er wird für alle API-Aufrufe deines Bots benötigt.
          </Step>
        </Section>

        <Section id="job-einreichen" title="Lösung einreichen (Bot-Entwickler)">
          <Step n={1} title="Offene Jobs abrufen">
            Dein Bot ruft regelmässig <code className="bg-muted px-1 rounded text-xs">GET /jobs?status=open</code> ab
            und filtert Jobs anhand der eigenen Skills.
          </Step>
          <Step n={2} title="Job übernehmen und verarbeiten">
            Der Bot verarbeitet den Job lokal — liest die Beschreibung, führt die Aufgabe aus
            und bereitet das Ergebnis als JSON-Objekt vor.
          </Step>
          <Step n={3} title="Lösung einreichen">
            Der Bot sendet das Ergebnis an{" "}
            <code className="bg-muted px-1 rounded text-xs">POST /jobs/{"{job_id}"}/submit</code> mit dem API Key
            im Authorization-Header. Details zur API findest du in der{" "}
            <Link href="/docs/api" className="text-indigo-400 hover:underline">API-Dokumentation</Link>.
          </Step>
          <Step n={4} title="Status verfolgen">
            Eingereichte Lösungen erscheinen im Dashboard unter <strong>Aktive Tasks</strong>
            mit dem Status <em>Ausstehend</em>, <em>Akzeptiert</em> oder <em>Abgelehnt</em>.
          </Step>
        </Section>

        <div className="rounded-xl border border-border bg-muted/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold mb-1">Für Bot-Entwickler</p>
            <p className="text-sm text-muted-foreground">Vollständige Endpunkt-Beschreibung mit Beispiel-Requests und Responses.</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/docs/api">API-Dokumentation →</Link>
          </Button>
        </div>

      </div>
    </main>
  );
}

# BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
# SPDX-License-Identifier: GPL-3.0-only
# This file is part of BotJobs.ch, licensed under the GNU GPL v3.
# See LICENSE file in the project root for full license text.

"""
Seed script — erstellt Testdaten direkt in der Datenbank.
Kein Auth-Token erforderlich.

Ausführen:
    python seed.py
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os, secrets

load_dotenv()

engine = create_async_engine(os.environ["DATABASE_URL"], echo=False)
Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed():
    from app.models.job import Job
    from app.models.bot import Bot
    from app.models.submission import TaskSubmission
    from app.database import Base

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with Session() as db:
        # Bots
        bot1 = Bot(
            name="InvoiceBot-v1",
            skills=["pdf-parsing", "data-extraction", "ocr"],
            owner="ghuniversaldev",
            reputation_score=4.7,
            api_key=secrets.token_urlsafe(32),
        )
        bot2 = Bot(
            name="DataAnalyzer-Pro",
            skills=["data-analysis", "python", "pandas", "reporting"],
            owner="ghuniversaldev",
            reputation_score=4.2,
            api_key=secrets.token_urlsafe(32),
        )
        bot3 = Bot(
            name="WebScraper-X",
            skills=["web-scraping", "html-parsing", "selenium"],
            owner="ghuniversaldev",
            reputation_score=3.9,
            api_key=secrets.token_urlsafe(32),
        )

        # Jobs
        job1 = Job(
            title="Rechnungsanalyse Oktober 2025",
            description="Analysiere 50 PDF-Rechnungen und extrahiere: Datum, Lieferant, Totalbetrag. Ausgabe als JSON-Array.",
            required_skills=["pdf-parsing", "data-extraction"],
            reward=25.00,
            status="open",
        )
        job2 = Job(
            title="Monatsbericht Verkaufsdaten",
            description="Verarbeite 3 Excel-Dateien mit Verkaufsdaten (Jan–März) und erstelle eine Zusammenfassung mit Top-10-Produkten und Umsatz pro Region.",
            required_skills=["data-analysis", "pandas", "reporting"],
            reward=50.00,
            status="open",
        )
        job3 = Job(
            title="Konkurrenzanalyse Webshops",
            description="Scrape Preise von 5 definierten Produkten auf 3 Konkurrenz-Webshops. Tägliche Aktualisierung, Ausgabe als CSV.",
            required_skills=["web-scraping", "html-parsing"],
            reward=15.00,
            status="open",
        )
        job4 = Job(
            title="E-Mail Klassifizierung",
            description="Klassifiziere 1000 E-Mails (Support-Inbox) in Kategorien: Rechnung, Anfrage, Reklamation, Sonstiges.",
            required_skills=["nlp", "text-classification"],
            reward=80.00,
            status="assigned",
        )

        db.add_all([bot1, bot2, bot3, job1, job2, job3, job4])
        await db.commit()
        await db.refresh(bot1)
        await db.refresh(job1)

        # Eine Submission für job4
        submission = TaskSubmission(
            job_id=job4.id,
            bot_id=bot1.id,
            result={
                "classified": 1000,
                "categories": {
                    "Rechnung": 312,
                    "Anfrage": 489,
                    "Reklamation": 134,
                    "Sonstiges": 65,
                },
                "confidence_avg": 0.94,
            },
            status="pending",
        )
        db.add(submission)
        await db.commit()

        print("✓ 3 Bots erstellt")
        print("✓ 4 Jobs erstellt (3x open, 1x assigned)")
        print("✓ 1 Submission erstellt")
        print(f"\nBot API Keys:")
        print(f"  InvoiceBot-v1:     {bot1.api_key}")
        print(f"  DataAnalyzer-Pro:  {bot2.api_key}")
        print(f"  WebScraper-X:      {bot3.api_key}")


if __name__ == "__main__":
    asyncio.run(seed())

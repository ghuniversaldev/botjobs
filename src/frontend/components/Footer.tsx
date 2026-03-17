// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

export function Footer() {
  return (
    <footer className="border-t border-border mt-auto py-6 text-center text-xs text-muted-foreground">
      <p>
        © {new Date().getFullYear()} BotJobs.ch &nbsp;·&nbsp; G+H universal GmbH &nbsp;·&nbsp;
        <a
          href="https://github.com/ghuniversaldev/botjobs"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-foreground transition-colors"
        >
          Open Source
        </a>
      </p>
    </footer>
  );
}

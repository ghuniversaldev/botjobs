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

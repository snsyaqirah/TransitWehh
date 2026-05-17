import { Card, CardContent } from '@/components/ui/card'

export function Privacy() {
  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Last updated: May 2026</p>
      </div>

      <Card>
        <CardContent className="pt-5 prose prose-sm dark:prose-invert max-w-none">
          <div className="space-y-4 text-sm leading-relaxed text-foreground">
            <p>
              TransitWehh is a read-only public data dashboard. We do not collect, store, or process
              any personal data. No cookies are used. No user accounts exist. Data displayed is
              sourced from the Malaysian government's open data portal (
              <a
                href="https://data.gov.my"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:opacity-80"
              >
                data.gov.my
              </a>
              ).
            </p>

            <div>
              <h3 className="font-semibold mb-1">What we do not collect</h3>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>No personal information (names, emails, identifiers)</li>
                <li>No location data</li>
                <li>No usage analytics or tracking pixels</li>
                <li>No third-party advertising scripts</li>
                <li>No session cookies or persistent storage beyond local theme preference</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Local storage</h3>
              <p className="text-muted-foreground">
                This site stores a single key (<code className="text-xs bg-muted px-1 py-0.5 rounded">transitwehh_theme</code>)
                in your browser's localStorage to remember your light/dark mode preference.
                This data never leaves your device and is not transmitted to any server.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Data sources</h3>
              <p className="text-muted-foreground">
                All ridership data is fetched from the TransitWehh API, which in turn sources data
                from{' '}
                <a
                  href="https://data.gov.my"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  data.gov.my
                </a>
                , the Malaysian Government Open Data portal. No personal data is involved in this pipeline.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Contact</h3>
              <p className="text-muted-foreground">
                This is an open-source project. For questions about data handling, please refer to the
                project repository or contact the maintainer.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

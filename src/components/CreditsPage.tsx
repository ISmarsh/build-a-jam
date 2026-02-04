/**
 * CreditsPage Component
 *
 * Displays licensing and attribution information for exercise data sources.
 * CC BY-SA requires attribution with Title, Author, Source, and License (TASL).
 *
 * ANGULAR vs REACT:
 * - Angular: a routed component declared in a route config array
 * - React: a component passed as a <Route element={...} />
 * - Angular uses routerLink; React uses <Link> from react-router-dom
 *
 * DATA LOADING:
 * - We import JSON directly (Vite handles this at build time)
 * - In Angular, you'd use HttpClient to fetch JSON
 * - In React, static imports are simpler for bundled data
 */

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

// Import exercise data to extract attribution info
// Vite automatically parses these as JSON objects at build time
import learnimprovData from '../data/learnimprov-exercises.json';
import improwikiData from '../data/improwiki-exercises.json';

// TypeScript interface for modification entries
interface Modification {
  date: string;
  description: string;
}

// TypeScript interface for attribution blocks in our JSON files
interface Attribution {
  source: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  note: string;
  scrapedAt: string;
  modifications?: Modification[];
}

// Extract attribution from imported data
// The 'as Attribution' cast tells TypeScript the shape of the data
const dataSources: Attribution[] = [
  learnimprovData.attribution as Attribution,
  improwikiData.attribution as Attribution,
];

function CreditsPage() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold text-foreground">Credits &amp; Licenses</h1>
      <p className="mb-8 text-muted-foreground">
        Build-a-Jam application code is licensed under the{' '}
        <a
          href="https://opensource.org/licenses/MIT"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline hover:text-primary-hover"
        >
          MIT License
        </a>
        . Exercise data is sourced from the following third parties under their own licenses.
      </p>

      <div className="space-y-4">
        {/* map() is like Angular's *ngFor - iterates over an array */}
        {dataSources.map((source) => (
          <Card key={source.source}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-primary">
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-primary-hover"
                  >
                    {source.source}
                  </a>
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-green-700 text-green-700 dark:border-green-600 dark:text-green-400"
                >
                  <a
                    href={source.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-600 dark:hover:text-green-300"
                  >
                    {source.license}
                  </a>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-secondary-foreground">{source.note}</p>

              {/* Conditional rendering - only show if modifications exist */}
              {/* Like Angular's *ngIf */}
              {source.modifications && source.modifications.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                    Modifications:
                  </h3>
                  <ul className="space-y-2">
                    {source.modifications.map((mod, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        <span className="text-muted-foreground">{mod.date}:</span> {mod.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 border-t pt-6 text-sm text-muted-foreground">
        <p>
          For full licensing details see{' '}
          <a
            href="https://github.com/ISmarsh/build-a-jam/blob/main/LICENSE-DATA"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary-hover"
          >
            LICENSE-DATA
          </a>{' '}
          in the repository.
        </p>
      </div>
    </div>
  );
}

export default CreditsPage;

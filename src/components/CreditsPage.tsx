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

import { Link } from 'react-router-dom';
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
      {/* Link component — like Angular's routerLink directive */}
      <Link
        to="/"
        className="mb-6 inline-block text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        &larr; Back to exercises
      </Link>

      <h1 className="text-3xl font-bold text-white mb-2">
        Credits &amp; Licenses
      </h1>
      <p className="text-gray-400 mb-8">
        Build-a-Jam application code is licensed under the{' '}
        <a
          href="https://opensource.org/licenses/MIT"
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline"
        >
          MIT License
        </a>
        . Exercise data is sourced from the following third parties under their
        own licenses.
      </p>

      <div className="space-y-4">
        {/* map() is like Angular's *ngFor - iterates over an array */}
        {dataSources.map((source) => (
          <Card
            key={source.source}
            className="bg-gray-800 border-gray-700"
          >
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-indigo-500">
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-indigo-400 underline"
                  >
                    {source.source}
                  </a>
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-gray-700 text-green-400 border-green-600"
                >
                  <a
                    href={source.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-green-300"
                  >
                    {source.license}
                  </a>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 mb-4">{source.note}</p>

              {/* Conditional rendering - only show if modifications exist */}
              {/* Like Angular's *ngIf */}
              {source.modifications && source.modifications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">
                    Modifications:
                  </h3>
                  <ul className="space-y-2">
                    {source.modifications.map((mod, index) => (
                      <li key={index} className="text-sm text-gray-400">
                        <span className="text-gray-500">{mod.date}:</span>{' '}
                        {mod.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-700 text-gray-500 text-sm">
        <p>
          For full licensing details see{' '}
          <a
            href="https://github.com/ISmarsh/build-a-jam/blob/main/LICENSE-DATA"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline"
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

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
 */

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface DataSource {
  name: string;
  url: string;
  license: string | null;
  licenseUrl: string | null;
  description: string;
  status: 'clear' | 'unclear';
}

const dataSources: DataSource[] = [
  {
    name: 'learnimprov.com',
    url: 'https://www.learnimprov.com/',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    description:
      'A collection of improv warm-ups, exercises, handles, and long forms. ' +
      'Descriptions have been adapted for use in Build-a-Jam.',
    status: 'clear',
  },
  {
    name: 'improwiki.com',
    url: 'https://improwiki.com/en',
    license: 'CC BY-SA 3.0 DE',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/de/deed.en',
    description:
      'A wiki of improv exercises and games. ' +
      'Descriptions have been adapted for use in Build-a-Jam.',
    status: 'clear',
  },
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
        {dataSources.map((source) => (
          <Card
            key={source.name}
            className="bg-gray-800 border-gray-700"
          >
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-indigo-500">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-indigo-400 underline"
                  >
                    {source.name}
                  </a>
                </CardTitle>
                {source.license ? (
                  <Badge
                    variant="outline"
                    className="bg-gray-700 text-green-400 border-green-600"
                  >
                    <a
                      href={source.licenseUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-green-300"
                    >
                      {source.license}
                    </a>
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-gray-700 text-yellow-400 border-yellow-600"
                  >
                    No clear license
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">{source.description}</p>
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

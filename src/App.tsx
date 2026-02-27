/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Game from './components/Game';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <Game />
    </ErrorBoundary>
  );
}

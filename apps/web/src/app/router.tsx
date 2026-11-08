import { createBrowserRouter, RouterProvider } from 'react-router';
import { AdminPage } from '../features/admin/AdminPage';
import { UsersPage } from '../features/admin/UsersPage';
import { CardsPage } from '../features/cards/CardsPage';
import { DecksPage } from '../features/decks/DecksPage';
import { EffectsPage } from '../features/effects/EffectsPage';
import { HistoryPage } from '../features/history/HistoryPage';
import { HomePage } from '../features/home/HomePage';
import { JudgePage } from '../features/judge/JudgePage';
import { RulesPage } from '../features/rules/RulesPage';
import { SearchPage } from '../features/search/SearchPage';
import { AppLayout } from './AppLayout';
import { NotFoundPage } from './NotFoundPage';
import { RouteErrorPage } from './RouteErrorPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'cards', element: <CardsPage /> },
      { path: 'rules', element: <RulesPage /> },
      { path: 'judge', element: <JudgePage /> },
      { path: 'effects', element: <EffectsPage /> },
      { path: 'decks', element: <DecksPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'admin/users', element: <UsersPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}

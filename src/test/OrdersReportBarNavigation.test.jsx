import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import OrdersReportComponent from '../components/admin/orders/OrdersReportComponent.jsx';
import OrdersKanbanComponent from '../components/admin/orders/OrdersKanbanComponent.jsx';
import orderService from '../services/OrderService.js';
import AuthenticationService from '../services/AuthenticationService.js';
import { parseReportBarFilter, REPORT_BAR_FILTERS } from '../components/admin/orders/OrdersReportHelper.js';

vi.mock('../components/dashboard/HeaderComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/dashboard/FooterComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/admin/AdminNav.jsx', () => ({ default: () => null }));
vi.mock('../components/navigation/NavigationComponent.jsx', () => ({ default: (Component) => Component }));

const item = { productId: 'p', name: 'Tangerine 10 g', quantity: 1, unitPrice: 0 };

function renderWithRoutes(initialEntry, orders) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  vi.spyOn(AuthenticationService, 'isUserAdmin').mockReturnValue(true);
  vi.spyOn(orderService, 'getAllOrders').mockResolvedValue(orders);
  function LocationProbe() {
    return <output data-testid="location">{useLocation().pathname + useLocation().search}</output>;
  }
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/admin/orders/report" element={<OrdersReportComponent />} />
          <Route path="/admin/orders" element={<><OrdersKanbanComponent navigate={vi.fn()} /><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('report bar navigation to admin orders', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it('opens the admin orders page filtered by the clicked bar and the report date', async () => {
    const now = new Date().toISOString();
    renderWithRoutes('/admin/orders/report', [{ id: 1, status: 'PAGADA', items: [item], total: 1000, createdAt: now }]);

    const bar = await screen.findByRole('link', { name: /Por empacar: 1/ });
    fireEvent.click(bar);

    const location = await screen.findByTestId('location');
    expect(location.textContent).toMatch(/^\/admin\/orders\?/);
    expect(location.textContent).toContain('filter=toPack');
    expect(location.textContent).toContain('period=day');
  });
});

describe('admin orders page honours period and bar filter from the URL', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthenticationService, 'isUserAdmin').mockReturnValue(true);
  });
  afterEach(() => {
    cleanup();
  });

  const at = (day) => new Date(2026, 9, day, 10).toISOString();
  const orders = [
    { id: 1, status: 'PAGADA', items: [item], total: 1000, createdAt: at(6) },
    { id: 2, status: 'EMPACADA', items: [item], total: 1000, createdAt: at(7) },
    { id: 3, status: 'ENTREGADA', items: [item], total: 1000, createdAt: at(8) },
    { id: 4, status: 'EMPACADA', items: [item], total: 1000, createdAt: at(20) },
  ];

  function renderKanbanAt(search) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.spyOn(orderService, 'getAllOrders').mockResolvedValue(orders);
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[`/admin/orders${search}`]}>
          <OrdersKanbanComponent navigate={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  it('shows every order of the week when only the period is provided', async () => {
    renderKanbanAt('?date=2026-10-08&period=week');

    expect(await screen.findByLabelText(/Estado 1$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Estado 2$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Estado 3$/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Estado 4$/)).not.toBeInTheDocument();
  });

  it('applies the bar filter within the period', async () => {
    renderKanbanAt('?date=2026-10-08&period=week&filter=toDeliver');

    expect(await screen.findByLabelText(/Estado 2$/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Estado 1$/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Estado 3$/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Estado 4$/)).not.toBeInTheDocument();
  });

  it('ignores unknown filter values', async () => {
    renderKanbanAt('?date=2026-10-08&period=day&filter=bogus');

    expect(await screen.findByLabelText(/Estado 3$/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Estado 1$/)).not.toBeInTheDocument();
    expect(parseReportBarFilter('bogus')).toBeNull();
    expect(parseReportBarFilter('constructor')).toBeNull();
  });
});

describe('REPORT_BAR_FILTERS', () => {
  it('paid bar excludes PQR orders, matching the report counts', () => {
    const delivered = { status: 'ENTREGADA', items: [] };
    const pqrDelivered = { status: 'ENTREGADA', pqr: true, items: [] };
    expect(REPORT_BAR_FILTERS.paid.matches(delivered)).toBe(true);
    expect(REPORT_BAR_FILTERS.paid.matches(pqrDelivered)).toBe(false);
    expect(REPORT_BAR_FILTERS.pqr.matches(pqrDelivered)).toBe(true);
  });
});

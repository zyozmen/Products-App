import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MyOrdersComponent from '../components/orders/MyOrdersComponent.jsx';
import orderService from '../services/OrderService.js';

vi.mock('../components/dashboard/HeaderComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/dashboard/FooterComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/navigation/NavigationComponent.jsx', () => ({
  default: () => (Component) => (props) => <Component {...props} />,
}));

const renderOrders = (orders) => {
  vi.spyOn(orderService, 'getMyOrders').mockResolvedValue(orders);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MyOrdersComponent />
    </QueryClientProvider>,
  );
};

describe('MyOrdersComponent', () => {
  it('shows the cash-on-delivery label for orders flagged as contra entrega in any status', async () => {
    renderOrders([
      { id: 7, status: 'PAGADA', cashOnDelivery: true, items: [], total: 1000 },
      { id: 8, status: 'ENTREGADA', cashOnDelivery: true, items: [], total: 1000 },
      { id: 9, status: 'CREADA', cashOnDelivery: false, items: [], total: 1000 },
    ]);

    expect(await screen.findByText('Orden #7')).toBeInTheDocument();
    expect(screen.getAllByText('Contra entrega')).toHaveLength(2);
  });

  it('shows cash and card amounts only when the backend returns them', async () => {
    renderOrders([
      { id: 10, status: 'ENTREGADA', cashOnDelivery: true, cashAmount: 70000, cardAmount: 30000, items: [], total: 100000 },
      { id: 11, status: 'ENTREGADA', items: [], total: 1000 },
    ]);

    expect(await screen.findByText('Orden #10')).toBeInTheDocument();
    expect(screen.getByText(/Efectivo:/)).toHaveTextContent('Efectivo:');
    expect(screen.getByText(/Tarjeta:/)).toHaveTextContent('Tarjeta:');
    expect(screen.getAllByText(/Efectivo:/)).toHaveLength(1);
  });

  it('fills the order thermometer up to the current status', async () => {
    renderOrders([
      { id: 12, status: 'PAGADA', items: [], total: 1000 },
      { id: 13, status: 'ENTREGADA', items: [], total: 1000 },
      { id: 14, status: 'CANCELADA', items: [], total: 1000 },
    ]);

    const bars = await screen.findAllByRole('progressbar');
    expect(bars).toHaveLength(3);
    expect(bars[0]).toHaveAttribute('aria-valuenow', '1');
    expect(bars[1]).toHaveAttribute('aria-valuenow', '3');
    expect(bars[2]).toHaveAttribute('aria-valuenow', '0');
  });

  it('accumulates the fill from the initial 15% through each station up to Entregada', async () => {
    renderOrders([
      { id: 16, status: 'CREADA', items: [], total: 1000 },
      { id: 17, status: 'PAGADA', items: [], total: 1000 },
      { id: 18, status: 'EMPACADA', items: [], total: 1000 },
      { id: 19, status: 'ENTREGADA', items: [], total: 1000 },
    ]);

    const bars = await screen.findAllByRole('progressbar');
    const widths = bars.map((bar) => parseFloat(bar.firstChild.firstChild.style.width));
    expect(widths[0]).toBeCloseTo(15, 5);
    expect(widths[1]).toBeCloseTo(15 + 85 / 3, 5);
    expect(widths[2]).toBeCloseTo(15 + (85 / 3) * 2, 5);
    expect(widths[3]).toBeCloseTo(100, 5);
  });

  it('shows only Creada and Cancelada labels on a cancelled order thermometer', async () => {
    renderOrders([{ id: 15, status: 'CANCELADA', items: [], total: 1000 }]);

    const bar = await screen.findByRole('progressbar');
    expect(within(bar).getByText('Creada')).toBeInTheDocument();
    expect(within(bar).getByText('Cancelada')).toBeInTheDocument();
    expect(within(bar).queryByText('Pagada')).not.toBeInTheDocument();
    expect(within(bar).queryByText('Empacada')).not.toBeInTheDocument();
    expect(within(bar).queryByText('Entregada')).not.toBeInTheDocument();
  });
});

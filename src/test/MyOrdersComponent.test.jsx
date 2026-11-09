import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MyOrdersComponent from '../components/orders/MyOrdersComponent.jsx';
import orderService from '../services/OrderService.js';
import AuthenticationService from '../services/AuthenticationService.js';

vi.mock('../components/dashboard/HeaderComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/dashboard/FooterComponent.jsx', () => ({ default: () => null }));
vi.mock('../components/navigation/NavigationComponent.jsx', () => ({
  default: () => (Component) => (props) => <Component {...props} />,
}));

const renderOrders = (orders) => {
  vi.spyOn(AuthenticationService, 'getLoggedInUser').mockReturnValue({ username: 'cliente' });
  vi.spyOn(orderService, 'getMyOrders').mockResolvedValue(orders);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MyOrdersComponent />
    </QueryClientProvider>,
  );
};

describe('MyOrdersComponent', () => {
  it('shows the presentation content and base unit beside each product when supplied', async () => {
    renderOrders([{
      id: 24, status: 'CREADA', total: 30,
      items: [
        { productId: 'p1', name: 'Producto A', quantity: 1, unitPrice: 10, contenidoUnidad: 40.5, unidadBase: 'GRAMOS' },
        { productId: 'p2', name: 'Producto B', quantity: 1, unitPrice: 10, contenidoUnidad: 0, unidadBase: 'ML' },
        { productId: 'p3', name: 'Producto anterior', quantity: 1, unitPrice: 10 },
      ],
    }]);

    await screen.findByText('Orden #24');
    expect(screen.getByText('Producto A').closest('td')).toHaveTextContent('Producto A 40.5 GRAMOS');
    expect(screen.getByText('Producto B').closest('td')).toHaveTextContent('Producto B 0 ML');
    expect(screen.getByText('Producto anterior').closest('td')).toHaveTextContent('Producto anterior');
    expect(screen.getByText('Producto anterior').closest('td')).not.toHaveTextContent(/undefined|null/);
  });

  it('filters by local creation date and product name independently and together', async () => {
    const date1 = new Date(2026, 9, 23, 23, 30).toISOString();
    const date2 = new Date(2026, 9, 24, 0, 30).toISOString();
    renderOrders([
      { id: 1, status: 'CREADA', createdAt: date1, items: [{ productId: 'p1', name: 'Fertilizante Orgánico', quantity: 1, unitPrice: 10 }, { productId: 'p2', name: 'Maceta', quantity: 1, unitPrice: 5 }], total: 15 },
      { id: 2, status: 'ENTREGADA', createdAt: date2, items: [{ productId: 'p1', name: 'Fertilizante Orgánico', quantity: 1, unitPrice: 10 }], total: 10 },
      { id: 3, status: 'CREADA', items: [{ productId: 'p3', name: 'Semillas', quantity: 1, unitPrice: 5 }], total: 5 },
    ]);

    await screen.findByText('Orden #1');
    const date = screen.getByLabelText('Fecha de creación');
    const product = screen.getByLabelText('Producto');
    fireEvent.change(product, { target: { value: '  ORGANICO  ' } });
    expect(screen.getByText('Orden #1')).toBeInTheDocument();
    expect(screen.getByText('Orden #2')).toBeInTheDocument();
    expect(screen.queryByText('Orden #3')).not.toBeInTheDocument();
    expect(screen.getByText('Maceta')).toBeInTheDocument();

    fireEvent.change(date, { target: { value: '2026-10-23' } });
    expect(screen.getByText('Orden #1')).toBeInTheDocument();
    expect(screen.queryByText('Orden #2')).not.toBeInTheDocument();
    fireEvent.change(product, { target: { value: 'semillas' } });
    expect(screen.getByText('No se encontraron órdenes con esa búsqueda')).toBeInTheDocument();
    expect(screen.queryByText('Aún no has realizado órdenes.')).not.toBeInTheDocument();
    fireEvent.change(date, { target: { value: '' } });
    expect(screen.getByText('Orden #3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /limpiar/i }));
    expect(date).toHaveValue('');
    expect(product).toHaveValue('');
    expect(screen.getByText('Orden #1')).toBeInTheDocument();
    expect(screen.getByText('Orden #2')).toBeInTheDocument();
    expect(screen.getByText('Orden #3')).toBeInTheDocument();
  });

  it('keeps the original empty state when there are no orders', async () => {
    renderOrders([]);
    expect(await screen.findByText('Aún no has realizado órdenes.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Fecha de creación')).not.toBeInTheDocument();
  });

  it('shows the cash-on-delivery label for orders flagged as contra entrega in any status', async () => {
    renderOrders([
      { id: 7, status: 'PAGADA', cashOnDelivery: true, items: [], total: 1000 },
      { id: 8, status: 'ENTREGADA', cashOnDelivery: true, items: [], total: 1000 },
      { id: 9, status: 'CREADA', cashOnDelivery: false, items: [], total: 1000 },
    ]);

    expect(await screen.findByText('Orden #7')).toBeInTheDocument();
    expect(screen.getAllByText('Contra entrega')).toHaveLength(2);
  });

  it('shows the PQR label only on flagged orders, independently of status and cash on delivery', async () => {
    renderOrders([
      { id: 20, status: 'CREADA', pqr: true, items: [], total: 0 },
      { id: 21, status: 'CANCELADA', pqr: true, cashOnDelivery: true, items: [], total: 0 },
      { id: 22, status: 'ENTREGADA', pqr: false, cashOnDelivery: true, items: [], total: 1000 },
      { id: 23, status: 'CREADA', items: [], total: 1000 },
    ]);

    await screen.findByText('Orden #20');
    const card = (id) => screen.getByText(`Orden #${id}`).closest('section');
    expect(within(card(20)).getByText('PQR')).toBeInTheDocument();
    expect(within(card(21)).getByText('PQR')).toBeInTheDocument();
    expect(within(card(21)).getByText('Contra entrega')).toBeInTheDocument();
    expect(within(card(22)).queryByText('PQR')).not.toBeInTheDocument();
    expect(within(card(22)).getByText('Contra entrega')).toBeInTheDocument();
    expect(within(card(23)).queryByText('PQR')).not.toBeInTheDocument();
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

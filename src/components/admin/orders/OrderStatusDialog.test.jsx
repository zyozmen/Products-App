import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import OrderStatusDialog from './OrderStatusDialog';

const translate = (key) => key;

describe('OrderStatusDialog', () => {
  it('confirms paid status with the cash-on-delivery option', async () => {
    const onConfirm = vi.fn();
    render(
      <OrderStatusDialog
        order={{ id: 'order-1', total: 100 }}
        status="PAGADA"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
        t={translate}
      />,
    );

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'accept' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({ cashOnDelivery: true }));
  });

  it('warns that a paid sale cannot be cancelled and explains cost recognition', () => {
    render(
      <OrderStatusDialog order={{ id: 'order-1', total: 100 }} status="PAGADA"
        onCancel={vi.fn()} onConfirm={vi.fn()} t={translate} />,
    );
    const note = screen.getByRole('note');
    expect(note).toHaveTextContent('order_paid_irreversible');
    expect(note).toHaveTextContent('order_paid_recognition_info');
    fireEvent.click(screen.getByRole('checkbox'));
    expect(note).toHaveTextContent('order_paid_cod_info');
  });

  it('blocks repeated submission while the change is in progress', () => {
    const onConfirm = vi.fn();
    render(
      <OrderStatusDialog order={{ id: 'order-1', total: 100 }} status="PAGADA"
        onCancel={vi.fn()} onConfirm={onConfirm} t={translate} isSubmitting />,
    );
    expect(screen.getByRole('button', { name: 'loading' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'cancel' })).toBeDisabled();
  });

  it('validates payment amounts and submits matching delivery amounts', async () => {
    const onConfirm = vi.fn();
    render(
      <OrderStatusDialog
        order={{ id: 'order-1', total: 100, cashOnDelivery: true }}
        status="ENTREGADA"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
        t={translate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'accept' }));
    expect(await screen.findByText('payment_detail_required')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('report_cash'), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText('report_card'), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: 'accept' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({ cashAmount: 40, cardAmount: 60 }));
  });

  it('rejects payment details that do not match the order total', async () => {
    const onConfirm = vi.fn();
    render(
      <OrderStatusDialog
        order={{ id: 'order-1', total: 100, cashOnDelivery: false }}
        status="ENTREGADA"
        onCancel={vi.fn()}
        onConfirm={onConfirm}
        t={translate}
      />,
    );

    fireEvent.change(screen.getByLabelText('report_cash'), { target: { value: '40' } });
    fireEvent.change(screen.getByLabelText('report_card'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'accept' }));

    expect(await screen.findByText('payment_detail_mismatch')).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('accepts the backend 0.01 tolerance and rejects larger differences', async () => {
    const onConfirm = vi.fn();
    render(
      <OrderStatusDialog order={{ id: 'order-1', total: 34800, cashOnDelivery: true }} status="ENTREGADA"
        onCancel={vi.fn()} onConfirm={onConfirm} t={translate} serverError="Error del servidor" />,
    );
    expect(screen.getByText('Error del servidor')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('order_delivery_recognition_info');
    fireEvent.change(screen.getByLabelText('report_cash'), { target: { value: '30000' } });
    fireEvent.change(screen.getByLabelText('report_card'), { target: { value: '4800.02' } });
    fireEvent.click(screen.getByRole('button', { name: 'accept' }));
    expect(await screen.findByText('payment_detail_mismatch')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('report_card'), { target: { value: '4800.01' } });
    fireEvent.click(screen.getByRole('button', { name: 'accept' }));
    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith({ cashAmount: 30000, cardAmount: 4800.01 }));
  });
});

import React, { useState } from 'react';
import HeaderComponent from '../../dashboard/HeaderComponent.jsx';
import AdminNav from '../AdminNav.jsx';
import FooterComponent from '../../dashboard/FooterComponent.jsx';
import navigationComponent from '../../navigation/NavigationComponent.jsx';
import useTranslation from '../../../hooks/useTranslation.js';
import { useAdminOrders } from '../../../hooks/useApiQueries.ts';
import translationService from '../../../services/TranslationService.js';
import { formatCOP } from '../../../Interfaces/ProductInterface.js';
import { Button, Card, ErrorNotice, Field, Input, Select } from '../../ui/shadcn';
import {
    REPORT_PERIODS,
    buildOrdersReport,
    getPeriodRange,
    monthInputToDate,
    toDateInputValue,
    toMonthInputValue,
    toWeekInputValue,
    weekInputToDate,
} from './OrdersReportHelper.js';

const COLORS = {
    total: 'var(--dark)',
    paid: 'var(--primary)',
    toPack: 'var(--warning)',
    toDeliver: 'var(--info)',
    cancelled: 'var(--danger)',
    pqr: '#8A949B',
};

const CHART = { width: 640, height: 300, top: 30, bottom: 50, left: 20, right: 20 };
const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);

function OrdersReportComponent() {
    const t = useTranslation();
    const [date, setDate] = useState(() => toDateInputValue(new Date()));
    const [period, setPeriod] = useState('day');
    const ordersQuery = useAdminOrders();
    const orders = ordersQuery.data ?? [];
    const { isPending, isFetching, isError, error, refetch } = ordersQuery;

    const range = getPeriodRange(date, period);
    const report = buildOrdersReport(orders, range);
    const locale = translationService.getLanguage() === 'EN' ? 'en-US' : 'es-CO';
    const lastDay = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate() - 1);
    const rangeLabel = period === 'day'
        ? range.start.toLocaleDateString(locale)
        : `${range.start.toLocaleDateString(locale)} - ${lastDay.toLocaleDateString(locale)}`;
    const bars = [
        { key: 'total', label: t('report_total_orders'), value: report.totalOrders, color: COLORS.total },
        { key: 'paid', label: t('report_paid_orders'), value: report.paid.count, color: COLORS.paid },
        { key: 'toPack', label: t('report_to_pack'), value: report.toPack, color: COLORS.toPack },
        { key: 'toDeliver', label: t('report_to_deliver'), value: report.toDeliver, color: COLORS.toDeliver },
        { key: 'cancelled', label: t('report_cancelled_orders'), value: report.cancelled, color: COLORS.cancelled },
        { key: 'pqr', label: t('report_pqr_orders'), value: report.pqr, color: COLORS.pqr },
    ];

    const renderChart = () => {
        const { width, height, top, bottom, left, right } = CHART;
        const plotHeight = height - top - bottom;
        const slot = (width - left - right) / bars.length;
        const barWidth = Math.min(64, slot * 0.6);
        const maxValue = Math.max(1, ...bars.map((bar) => bar.value));

        return (
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="hu-w-full hu-text-slate-800"
                role="img"
                aria-label={t('report_chart_title')}
                style={{ maxHeight: '340px' }}
            >
                <line
                    x1={left}
                    x2={width - right}
                    y1={height - bottom}
                    y2={height - bottom}
                    stroke="currentColor"
                    strokeOpacity="0.3"
                />
                {bars.map((bar, index) => {
                    const barHeight = (bar.value / maxValue) * plotHeight;
                    const x = left + slot * index + (slot - barWidth) / 2;
                    const y = height - bottom - barHeight;
                    return (
                        <g key={bar.key}>
                            <rect x={x} y={y} width={barWidth} height={barHeight} fill={bar.color} rx="3">
                                <title>{`${bar.label}: ${bar.value}`}</title>
                            </rect>
                            <text
                                x={x + barWidth / 2}
                                y={y - 8}
                                textAnchor="middle"
                                fontSize="16"
                                fontWeight="700"
                                fill="currentColor"
                            >
                                {bar.value}
                            </text>
                            <text
                                x={x + barWidth / 2}
                                y={height - bottom + 20}
                                textAnchor="middle"
                                fontSize="12"
                                fill="currentColor"
                            >
                                {bar.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        );
    };

    const renderPaymentBreakdown = () => {
        const parts = [
            { key: 'cash', label: t('report_cash'), value: report.paid.cash, color: COLORS.paid },
            { key: 'card', label: t('report_card'), value: report.paid.card, color: COLORS.total },
            { key: 'undetailed', label: t('report_undetailed'), value: report.paid.undetailed, color: COLORS.pqr },
        ];
        const sum = parts.reduce((total, part) => total + part.value, 0);

        return (
            <div>
                <div
                    className="hu-flex hu-h-7 hu-overflow-hidden hu-rounded"
                    style={{ background: 'rgba(138,148,155,0.25)' }}
                    aria-label={t('report_payment_breakdown')}
                >
                    {sum > 0 && parts.filter((part) => part.value > 0).map((part) => (
                        <div
                            key={part.key}
                            title={`${part.label}: ${formatCOP(part.value)}`}
                            style={{ width: `${(part.value / sum) * 100}%`, background: part.color }}
                        />
                    ))}
                </div>
                <ul className="hu-mb-0 hu-mt-3 hu-grid hu-list-none hu-gap-2 hu-p-0">
                    {parts.map((part) => (
                        <li key={part.key} className="hu-flex hu-items-center hu-justify-between hu-gap-3 hu-text-sm">
                            <span className="hu-flex hu-items-center hu-gap-2">
                                <span
                                    className="hu-inline-block hu-h-3 hu-w-3 hu-rounded-sm"
                                    style={{ background: part.color }}
                                    aria-hidden="true"
                                />
                                {part.label}
                            </span>
                            <strong>{formatCOP(part.value)}</strong>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const handleDateChange = (event) => {
        const raw = event.target.value;
        const nextDate = period === 'week'
            ? weekInputToDate(raw)
            : period === 'month'
                ? monthInputToDate(raw)
                : raw;
        if (nextDate) setDate(nextDate);
    };

    const displayError = error instanceof Error ? error.message : '';

    return (
        <div className="hu-flex hu-min-h-screen hu-flex-col admin-page-bg hu-text-slate-900">
            <HeaderComponentWithNavigation />
            <AdminNav />
            <main className="hu-mx-auto hu-w-full hu-max-w-[1600px] hu-flex-1 hu-px-4 hu-py-8 md:hu-px-8">
                <div className="hu-mb-6">
                    <h1 className="hu-m-0 hu-text-3xl hu-font-bold hu-tracking-tight">{t('orders_report')}</h1>
                </div>

                <Card className="hu-mb-5 hu-p-5 kanban-board">
                    <div className="hu-grid hu-items-end hu-gap-4 md:hu-grid-cols-2 xl:hu-grid-cols-4 ">
                        <Field label={t('report_date')} htmlFor="report-date">
                            <Input
                                id="report-date"
                                type={period === 'week' ? 'week' : period === 'month' ? 'month' : 'date'}
                                value={
                                    period === 'week' ? toWeekInputValue(date)
                                        : period === 'month' ? toMonthInputValue(date)
                                            : date
                                }
                                onChange={handleDateChange}
                            />
                        </Field>
                        <Field label={t('report_group_by')} htmlFor="report-period">
                            <Select
                                id="report-period"
                                value={period}
                                onChange={(event) => setPeriod(event.target.value)}
                            >
                                {REPORT_PERIODS.map((option) => (
                                    <option key={option} value={option}>{t('report_period_' + option)}</option>
                                ))}
                            </Select>
                        </Field>
                        <Button type="button" onClick={() => void refetch()} disabled={isFetching}>
                            {isFetching ? t('loading') : t('update')}
                        </Button>
                        <p className="hu-m-0 hu-text-sm hu-text-slate-600 md:hu-text-right">
                            {t('report_range')}: <strong className="hu-text-slate-900">{rangeLabel}</strong>
                        </p>
                    </div>
                </Card>

                {isError && (
                    <div className="hu-mb-5">
                        <ErrorNotice>
                            <span>{displayError || t('orders_load_error')}</span>
                            <Button
                                type="button"
                                variant="secondary"
                                className="hu-ml-3 hu-py-1.5"
                                onClick={() => void refetch()}
                                disabled={isFetching}
                            >
                                {t('retry')}
                            </Button>
                        </ErrorNotice>
                    </div>
                )}
                {isPending ? (
                    <p className="hu-p-5 hu-text-sm hu-text-slate-600" role="status">{t('loading')}</p>
                ) : (
                    ordersQuery.data === undefined && isError ? null : (
                    <>
                        {report.totalOrders === 0 && !isError && (
                            <div className="hu-mb-5 hu-rounded-lg hu-border hu-border-blue-200 hu-bg-blue-50 hu-p-4 hu-text-sm hu-text-blue-900" role="status">
                                {t('report_no_orders')}
                            </div>
                        )}
                        <div className="hu-grid hu-gap-5 lg:hu-grid-cols-3">
                            <Card className="hu-p-5 lg:hu-col-span-2 kanban-board">
                                <h2 className="hu-mb-4 hu-mt-0 hu-text-lg hu-font-bold">{t('report_chart_title')}</h2>
                                {renderChart()}
                            </Card>
                            <Card className="hu-p-5 kanban-board">
                                <h2 className="hu-mb-1 hu-mt-0 hu-text-lg hu-font-bold">{t('report_paid_orders')}</h2>
                                <p className="hu-mb-3 hu-mt-0 hu-text-sm hu-text-slate-500">{t('report_paid_note')}</p>
                                <p className="hu-mb-1 hu-text-3xl hu-font-bold hu-text-green-800">{formatCOP(report.paid.total)}</p>
                                <p className="hu-mb-4 hu-mt-0 hu-text-sm">
                                    {report.paid.count} {t('report_orders_unit')}
                                </p>
                                <h3 className="hu-mb-3 hu-mt-0 hu-text-sm hu-font-semibold">{t('report_payment_breakdown')}</h3>
                                {renderPaymentBreakdown()}
                            </Card>
                        </div>
                    </>
                    )
                )}
            </main>
            <FooterComponent />
        </div>
    );
}

export default OrdersReportComponent;

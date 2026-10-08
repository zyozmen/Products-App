import React, { Component } from 'react';
import HeaderComponent from '../dashboard/HeaderComponent.jsx';
import FooterComponent from '../dashboard/FooterComponent.jsx';
import navigationComponent from '../navigation/NavigationComponent.jsx';
import AuthenticationService from '../../services/AuthenticationService.js';
import translationService from '../../services/TranslationService.js';
import orderService from '../../services/OrderService.js';
import { formatCOP } from '../../Interfaces/ProductInterface';
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

class OrdersReportComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            orders: [],
            loading: true,
            error: '',
            date: toDateInputValue(new Date()),
            period: 'day',
            currentLanguage: translationService.getLanguage(),
        };
        this.unsubscribeFromLanguage = null;
        this.loadOrders = this.loadOrders.bind(this);
    }

    async componentDidMount() {
        if (!AuthenticationService.isUserAdmin()) {
            this.props.navigate('/welcome');
            return;
        }
        this.unsubscribeFromLanguage = translationService.subscribe((lang) => {
            this.setState({ currentLanguage: lang });
        });
        await this.loadOrders();
    }

    componentWillUnmount() {
        if (this.unsubscribeFromLanguage) {
            this.unsubscribeFromLanguage();
        }
    }

    async loadOrders() {
        this.setState({ loading: true, error: '' });
        try {
            const orders = await orderService.getAllOrders();
            this.setState({ orders, loading: false });
        } catch (error) {
            this.setState({ loading: false, error: error.message });
        }
    }

    renderChart(bars, t) {
        const { width, height, top, bottom, left, right } = CHART;
        const plotHeight = height - top - bottom;
        const slot = (width - left - right) / bars.length;
        const barWidth = Math.min(64, slot * 0.6);
        const maxValue = Math.max(1, ...bars.map((bar) => bar.value));

        return (
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-100"
                role="img"
                aria-label={t('report_chart_title')}
                style={{ maxHeight: '340px', color: 'inherit' }}
            >
                <line
                    x1={left} x2={width - right}
                    y1={height - bottom} y2={height - bottom}
                    stroke="currentColor" strokeOpacity="0.3"
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
                                x={x + barWidth / 2} y={y - 8}
                                textAnchor="middle" fontSize="16" fontWeight="700" fill="currentColor"
                            >
                                {bar.value}
                            </text>
                            <text
                                x={x + barWidth / 2} y={height - bottom + 20}
                                textAnchor="middle" fontSize="12" fill="currentColor"
                            >
                                {bar.label}
                            </text>
                        </g>
                    );
                })}
            </svg>
        );
    }

    renderPaymentBreakdown(paid, t) {
        const parts = [
            { key: 'cash', label: t('report_cash'), value: paid.cash, color: COLORS.paid },
            { key: 'card', label: t('report_card'), value: paid.card, color: COLORS.total },
            { key: 'undetailed', label: t('report_undetailed'), value: paid.undetailed, color: COLORS.pqr },
        ];
        const sum = parts.reduce((total, part) => total + part.value, 0);

        return (
            <div>
                <div className="d-flex" style={{ height: '28px', borderRadius: '4px', overflow: 'hidden', background: 'rgba(138,148,155,0.25)' }}>
                    {sum > 0 && parts.filter((part) => part.value > 0).map((part) => (
                        <div
                            key={part.key}
                            title={`${part.label}: ${formatCOP(part.value)}`}
                            style={{ width: `${(part.value / sum) * 100}%`, background: part.color }}
                        />
                    ))}
                </div>
                <ul className="list-unstyled mt-3 mb-0">
                    {parts.map((part) => (
                        <li key={part.key} className="d-flex justify-content-between align-items-center mb-1">
                            <span>
                                <span
                                    className="d-inline-block mr-2"
                                    style={{ width: '12px', height: '12px', background: part.color, borderRadius: '2px' }}
                                />
                                {part.label}
                            </span>
                            <strong>{formatCOP(part.value)}</strong>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    render() {
        const HeaderComponentWithNavigation = navigationComponent(HeaderComponent);
        const t = (key) => translationService.t(key);
        const { orders, loading, error, date, period, currentLanguage } = this.state;

        const range = getPeriodRange(date, period);
        const report = buildOrdersReport(orders, range);
        const locale = currentLanguage === 'EN' ? 'en-US' : 'es-CO';
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

        return (
            <>
                <HeaderComponentWithNavigation />
                <div className="container-fluid pb-5">
                    <div className="row px-xl-5">
                        <div className="col">
                            <h2 className="section-title position-relative text-uppercase my-4">
                                <span className="bg-secondary pr-3">{t('orders_report')}</span>
                            </h2>

                            <div className="bg-light p-30 mb-4">
                                <div className="form-row align-items-end">
                                    <div className="form-group col-md-3">
                                        <label htmlFor="report-date">{t('report_date')}</label>
                                        <input
                                            id="report-date"
                                            type={period === 'week' ? 'week' : period === 'month' ? 'month' : 'date'}
                                            className="form-control"
                                            value={
                                                period === 'week' ? toWeekInputValue(date)
                                                    : period === 'month' ? toMonthInputValue(date)
                                                        : date
                                            }
                                            onChange={(e) => {
                                                const raw = e.target.value;
                                                const next = period === 'week' ? weekInputToDate(raw)
                                                    : period === 'month' ? monthInputToDate(raw)
                                                        : raw;
                                                if (next) {
                                                    this.setState({ date: next });
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="form-group col-md-3">
                                        <label htmlFor="report-period">{t('report_group_by')}</label>
                                        <select
                                            id="report-period"
                                            className="form-control"
                                            value={period}
                                            onChange={(e) => this.setState({ period: e.target.value })}
                                        >
                                            {REPORT_PERIODS.map((option) => (
                                                <option key={option} value={option}>{t('report_period_' + option)}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group col-md-3">
                                        <button type="button" className="btn btn-primary" onClick={this.loadOrders}>
                                            {t('update')}
                                        </button>
                                    </div>
                                    <div className="form-group col-md-3 text-md-right">
                                        <span className="text-muted">{t('report_range')}: </span>
                                        <strong>{rangeLabel}</strong>
                                    </div>
                                </div>
                            </div>

                            {error && <div className="alert alert-danger">{error}</div>}
                            {loading ? (
                                <p>{t('loading')}</p>
                            ) : (
                                <>
                                    {report.totalOrders === 0 && (
                                        <div className="alert alert-info">{t('report_no_orders')}</div>
                                    )}
                                    <div className="row">
                                        <div className="col-lg-8 mb-4">
                                            <div className="bg-light p-30 h-100">
                                                <h5 className="mb-3">{t('report_chart_title')}</h5>
                                                {this.renderChart(bars, t)}
                                            </div>
                                        </div>
                                        <div className="col-lg-4 mb-4">
                                            <div className="bg-light p-30 h-100">
                                                <h5 className="mb-1">{t('report_paid_orders')}</h5>
                                                <p className="text-muted small">{t('report_paid_note')}</p>
                                                <h3 className="text-primary">{formatCOP(report.paid.total)}</h3>
                                                <p className="mb-3">{report.paid.count} {t('report_orders_unit')}</p>
                                                <h6 className="mb-2">{t('report_payment_breakdown')}</h6>
                                                {this.renderPaymentBreakdown(report.paid, t)}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <FooterComponent />
            </>
        );
    }
}

export default OrdersReportComponent;

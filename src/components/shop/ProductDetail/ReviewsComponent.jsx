import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import useTranslation from '../../../hooks/useTranslation.js';
import { reviewSchema } from '../../../schemas/review';
import { Button, Card, Field, Input } from '../../ui/shadcn';
import Reviews from './Reviews';

function ReviewsComponent() {
    const t = useTranslation();
    const [notice, setNotice] = useState('');
    const form = useForm({
        resolver: zodResolver(reviewSchema),
        defaultValues: { message: '', name: '', email: '' },
    });
    const fieldError = (name) => {
        const message = form.formState.errors[name]?.message;
        return message ? t(message) : undefined;
    };

    const onSubmit = form.handleSubmit(() => {
        setNotice(t('review_submission_unavailable'));
    });

    return (
        <div className="hu-grid hu-gap-6 md:hu-grid-cols-2">
            <div className="hu-rounded-xl hu-border hu-border-slate-200 hu-bg-white hu-p-5">
                <Reviews t={t} />
            </div>
            <Card className="hu-p-5">
                <h2 className="hu-mb-2 hu-mt-0 hu-text-xl hu-font-bold">{t('leave_review')}</h2>
                <p className="hu-mb-4 hu-mt-0 hu-text-sm hu-text-slate-600">{t('review_email_notice')}</p>
                <div className="hu-mb-4 hu-flex hu-items-center hu-gap-2 hu-text-sm">
                    <span>{t('your_rating')}</span>
                    <span className="hu-text-amber-500" aria-label="5 stars">★★★★★</span>
                </div>
                {notice && <div className="hu-mb-4 hu-rounded-lg hu-border hu-border-amber-200 hu-bg-amber-50 hu-p-3 hu-text-sm hu-text-amber-900" role="status">{notice}</div>}
                <form className="hu-grid hu-gap-4" onSubmit={onSubmit} noValidate>
                    <Field label={t('your_review')} htmlFor="message" error={fieldError('message')}>
                        <textarea
                            id="message"
                            rows={5}
                            className="hu-w-full hu-rounded-lg hu-border hu-border-slate-300 hu-bg-white hu-px-3 hu-py-2.5 hu-text-sm hu-text-slate-900 hu-outline-none focus:hu-border-blue-600 focus:hu-ring-2 focus:hu-ring-blue-100"
                            aria-invalid={Boolean(form.formState.errors.message)}
                            {...form.register('message')}
                        />
                    </Field>
                    <Field label={t('your_name')} htmlFor="name" error={fieldError('name')}>
                        <Input id="name" autoComplete="name" aria-invalid={Boolean(form.formState.errors.name)} {...form.register('name')} />
                    </Field>
                    <Field label={t('your_email')} htmlFor="email" error={fieldError('email')}>
                        <Input id="email" type="email" autoComplete="email" aria-invalid={Boolean(form.formState.errors.email)} {...form.register('email')} />
                    </Field>
                    <div><Button type="submit">{t('submit_review')}</Button></div>
                </form>
            </Card>
        </div>
    );
}

export default ReviewsComponent;

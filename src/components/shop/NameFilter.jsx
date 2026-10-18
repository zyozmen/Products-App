import { useEffect, useState } from 'react';
import useTranslation from '../../hooks/useTranslation.js';
import { Button, Input } from '../ui/shadcn';

function NameFilter({ nameFilter, onNameFilterChange }) {
    const t = useTranslation();
    const [localName, setLocalName] = useState(nameFilter || '');

    useEffect(() => setLocalName(nameFilter || ''), [nameFilter]);

    const submit = (event) => {
        event.preventDefault();
        onNameFilterChange?.(localName);
    };
    const clear = () => {
        setLocalName('');
        onNameFilterChange?.('');
    };

    return (
        <form className="hu-grid hu-gap-2 hu-rounded-xl hu-border hu-border-slate-200 hu-bg-white hu-p-4" onSubmit={submit}>
            <label className="hu-sr-only" htmlFor="product-name-filter">{t('filter_name_placeholder')}</label>
            <div className="hu-flex">
                <Input
                    id="product-name-filter"
                    className="hu-rounded-r-none"
                    type="search"
                    value={localName}
                    onChange={(event) => setLocalName(event.target.value)}
                    placeholder={t('filter_name_placeholder')}
                />
                <Button type="submit" className="hu-rounded-l-none hu-px-3" aria-label={t('filter_name_placeholder')}>
                    <i className="fa fa-search" aria-hidden="true" />
                </Button>
            </div>
            {localName.trim() && <Button type="button" variant="secondary" className="hu-justify-self-start" onClick={clear}>{t('clear_btn')}</Button>}
        </form>
    );
}

export default NameFilter;

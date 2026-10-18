import { Button } from './shadcn';

function ConfirmationModal({ title, message, acceptLabel, onAccept }) {
    return (
        <div className="hu-fixed hu-inset-0 hu-z-50 hu-grid hu-place-items-center hu-bg-slate-950/60 hu-p-4">
            <section
                className="hu-w-full hu-max-w-md hu-rounded-2xl hu-bg-white hu-p-6 hu-text-center hu-shadow-2xl"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirmation-modal-title"
                aria-describedby={message ? 'confirmation-modal-message' : undefined}
            >
                <h2 id="confirmation-modal-title" className="hu-m-0 hu-text-xl hu-font-bold hu-text-slate-900">{title}</h2>
                {message && <p id="confirmation-modal-message" className="hu-mb-5 hu-mt-3 hu-text-sm hu-leading-6 hu-text-slate-600">{message}</p>}
                {!message && <div className="hu-h-5" />}
                <Button type="button" onClick={onAccept} autoFocus>{acceptLabel}</Button>
            </section>
        </div>
    );
}

export default ConfirmationModal;

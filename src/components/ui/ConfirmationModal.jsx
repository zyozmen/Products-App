import React from "react";
import "./ConfirmationModal.css";

function ConfirmationModal({ title, message, acceptLabel, onAccept }) {
    return (
        <div className="cart-checkout-modal-backdrop">
            <section
                className="cart-checkout-modal"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirmation-modal-title"
                aria-describedby={message ? "confirmation-modal-message" : undefined}
            >
                <h2 id="confirmation-modal-title">{title}</h2>
                {message && <p id="confirmation-modal-message">{message}</p>}
                <button type="button" className="btn btn-primary" onClick={onAccept} autoFocus>
                    {acceptLabel}
                </button>
            </section>
        </div>
    );
}

export default ConfirmationModal;

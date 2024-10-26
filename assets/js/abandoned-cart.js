class CheckoutFormHandler {
    constructor() {
        this.quillcrmAbandonedCart = window?.['quillcrm_abandoned_cart'] || {};
        this.checkoutForm = document.querySelector('form.checkout');
        this.fieldsValues = {};
        this.checkoutFields = [
            'billing_email', 'billing_first_name', 'billing_last_name', 'billing_company', 'billing_phone',
            'billing_country', 'billing_address_1', 'billing_address_2', 'billing_city',
            'billing_state', 'billing_postcode', 'shipping_first_name', 'shipping_last_name',
            'shipping_company', 'shipping_country', 'shipping_address_1', 'shipping_address_2',
            'shipping_city', 'shipping_state', 'shipping_postcode', 'shipping_phone',
        ];
        this.isLoading = false;
        this.init();
    }

    init() {
        if (this.checkoutForm) {
            console.log('Checkout form found2');
            this.attachEventListeners();
        }

        this.maybeAddGDPRConsent();
    }

    maybeAddGDPRConsent() {
        const enableGdpr = this.quillcrmAbandonedCart.gdpr_compliance;
        if (enableGdpr) {
            // Check if gdpr_consent field already exists
            if (document.querySelector('.quillcrm-gdpr-message')) {
                return;
            }

            const gdprMessage = this.quillcrmAbandonedCart.gdpr_message;
            const gdprMessageEl = document.createElement('div');
            gdprMessageEl.className = 'quillcrm-gdpr-message';
            gdprMessageEl.style.marginTop = '10px';
            gdprMessageEl.style.fontSize = 'small';
            gdprMessageEl.innerHTML = `
                <p>${gdprMessage}</p>
            `;

            // Add after the email field
            const emailField = document.querySelector('#billing_email_field, .wc-block-components-address-form__email');
            if (emailField) {
                emailField.insertAdjacentElement('afterend', gdprMessageEl);
            } else {
                setTimeout(() => {
                    this.maybeAddGDPRConsent();
                }, 3000);
            }

            // Add event listener for opt-out
            const optOutLink = document.querySelector('#quillcrm-opt-out');
            if (optOutLink) {
                optOutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Opting out');
                    fetch(this.quillcrmAbandonedCart.ajax_url, {
                        method: 'POST',
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                        },
                        body: new URLSearchParams({
                            action: 'quillcrm_opt_out_abandoned_cart',
                            nonce: this.quillcrmAbandonedCart.nonce,
                        }),
                    })
                        .then(response => response.json())
                        .then(data => {
                            const messageEl = document.querySelector('.quillcrm-gdpr-message');
                            if (messageEl) {
                                messageEl.innerHTML = `<p>${data.data.message}</p>`;

                                setTimeout(() => {
                                    messageEl.style.display = 'none';
                                }, 5000);
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                        });
                });
            }
        }
    }

    attachEventListeners() {
        this.checkoutFields.forEach(field => {
            const input = document.querySelector(`#${field}`);
            if (input) {
                // Check if type checkbox or radio or select
                if (input.type === 'checkbox' || input.type === 'radio' || input.tagName === 'SELECT') {
                    input.addEventListener('change', this.changeHandler.bind(this));
                } else {
                    input.addEventListener('blur', this.changeHandler.bind(this));
                }
            }
        });
    }

    changeHandler(e) {
        const { id, value } = e.target;
        this.fieldsValues[id] = value;

        if (this.isEmailFilled()) {
            this.saveAbandonedCart();
        }
    }

    isEmailFilled() {
        return this.fieldsValues.billing_email !== undefined && this.fieldsValues.billing_email !== '';
    }

    saveAbandonedCart() {
        if (this.isLoading) {
            return;
        }

        this.isLoading = true;

        const { ajax_url, nonce } = this.quillcrmAbandonedCart;

        fetch(ajax_url, {
            method: 'POST',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                action: 'quillcrm_save_abandoned_cart',
                nonce,
                fields: JSON.stringify(this.fieldsValues),
            }),
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                this.isLoading = false;
            })
            .catch(error => {
                console.error('Error:', error);
                this.isLoading = false;
            });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new CheckoutFormHandler();
});
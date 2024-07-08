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
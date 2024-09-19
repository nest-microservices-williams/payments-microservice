import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from 'src/config';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripe_secret);

  async createPaymentSession() {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_intent_data: {
        metadata: {},
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'T-shirt',
            },
            unit_amount: 2000, // $20.00,
          },
          quantity: 2,
        },
      ],
      success_url: `http://localhost:3003/payments/success`,
      cancel_url: `http://localhost:3003/payments/cancel`,
    });

    return session;
  }
}

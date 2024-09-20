import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import type { Request, Response } from 'express';
import { envs } from 'src/config';
import { PaymentSessionDto } from './dto/payment-session.dto';
import { CustomRpcException } from 'src/common/exceptions/rpc.exception';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripe_secret);
  private readonly logger = new Logger(PaymentsService.name);

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    try {
      const { currency, items, orderId } = paymentSessionDto;

      const lineItems = items.map((item) => ({
        price_data: {
          currency,
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      }));

      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        payment_intent_data: {
          metadata: {
            orderId,
          },
        },
        line_items: lineItems,
        success_url: envs.stripe_success_url,
        cancel_url: envs.stripe_cancel_url,
      });

      return session;
    } catch (error) {
      this.logger.error(error.message);
      throw new CustomRpcException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Error creating payment session',
      });
    }
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        envs.stripe_webhook_secret,
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case 'charge.succeeded':
        const { metadata } = event.data.object;
        const orderId = metadata.orderId;
        console.log({ metadata, orderId });
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json({ sig, event });
  }
}

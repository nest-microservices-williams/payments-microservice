import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import type { Request, Response } from 'express';
import type { ClientProxy } from '@nestjs/microservices';
import { CustomRpcException } from 'src/common/exceptions/rpc.exception';
import { envs, NATS_SERVICE } from 'src/config';
import { PaymentSessionDto } from './dto/payment-session.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripe_secret);
  private readonly logger = new Logger(PaymentsService.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

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

      return {
        id: session.id,
        cancelUrl: session.cancel_url,
        successUrl: session.success_url,
        url: session.url,
      };
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
        const { id, metadata, receipt_url } = event.data.object;
        const orderId = metadata.orderId;

        const payload = {
          stripePaymentId: id,
          orderId,
          receiptUrl: receipt_url,
        };

        this.client.emit('payment.succeeded', payload);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return res.status(200).json({ sig, event });
  }
}

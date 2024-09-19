import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from 'src/config';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripe_secret);
}

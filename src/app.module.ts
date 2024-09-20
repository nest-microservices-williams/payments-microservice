import { Module } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';
import { NatsModule } from './transports/nats.module';

@Module({
  imports: [PaymentsModule, NatsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}

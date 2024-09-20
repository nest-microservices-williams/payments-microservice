import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export class CustomRpcException extends RpcException {
  constructor({
    message,
    statusCode = HttpStatus.BAD_REQUEST,
    error = 'Bad Request',
  }: {
    message: string;
    statusCode?: HttpStatus;
    error?: string;
  }) {
    super({ statusCode, error, message });
  }
}

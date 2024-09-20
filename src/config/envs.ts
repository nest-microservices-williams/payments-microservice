import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  STRIPE_SECRET: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_SUCCESS_URL: string;
  STRIPE_CANCEL_URL: string;
}

const envVarsSchema = joi.object<EnvVars>({
  PORT: joi.number().default(3000),
  STRIPE_SECRET: joi.string().required(),
  STRIPE_WEBHOOK_SECRET: joi.string().required(),
  STRIPE_SUCCESS_URL: joi.string().uri().required(),
  STRIPE_CANCEL_URL: joi.string().uri().required(),
});

function validateEnv<T>(
  schema: joi.ObjectSchema<T>,
  env: NodeJS.ProcessEnv = process.env,
): T {
  const { value, error } = schema.validate(env, {
    allowUnknown: true,
    convert: true,
  });

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return value;
}

type LowerCaseKeys<T> = {
  [K in keyof T as Lowercase<string & K>]: T[K];
};

const validatedEnv = validateEnv(envVarsSchema);

export const envs: LowerCaseKeys<EnvVars> = {
  port: validatedEnv.PORT,
  stripe_secret: validatedEnv.STRIPE_SECRET,
  stripe_webhook_secret: validatedEnv.STRIPE_WEBHOOK_SECRET,
  stripe_success_url: validatedEnv.STRIPE_SUCCESS_URL,
  stripe_cancel_url: validatedEnv.STRIPE_CANCEL_URL,
};

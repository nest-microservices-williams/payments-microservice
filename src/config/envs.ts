import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  STRIPE_SECRET: string;
  STRIPE_WEBHOOK_SECRET: string;
  // DATABASE_URL: string;
}

const envVarsSchema = joi.object<EnvVars>({
  PORT: joi.number().default(3000),
  STRIPE_SECRET: joi.string().required(),
  STRIPE_WEBHOOK_SECRET: joi.string().required(),
  // DATABASE_URL: joi.string().required(),
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
  // database_url: validatedEnv.DATABASE_URL,
};

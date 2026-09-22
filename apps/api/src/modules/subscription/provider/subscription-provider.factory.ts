import {
  readSubscriptionProviderEnvironment,
  validateSubscriptionProviderEnvironment,
  type SubscriptionProviderEnvironmentInput,
} from "./subscription-provider.config.js";
import {
  MockSubscriptionProvider,
  type MockSubscriptionProviderOptions,
} from "./mock-subscription-provider.js";
import type { ISubscriptionProvider } from "./subscription-provider.types.js";

export interface SubscriptionProviderFactoryOptions {
  environment?: SubscriptionProviderEnvironmentInput;
  fixtures?: MockSubscriptionProviderOptions["fixtures"];
  now?: MockSubscriptionProviderOptions["now"];
}

export function createSubscriptionProvider(
  options: SubscriptionProviderFactoryOptions = {},
): ISubscriptionProvider {
  const environment =
    options.environment ?? readSubscriptionProviderEnvironment(process.env);
  const config = validateSubscriptionProviderEnvironment(environment);

  return new MockSubscriptionProvider({
    config,
    fixtures: options.fixtures,
    now: options.now,
  });
}

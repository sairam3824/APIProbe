"use server";

import { checkApiKey as checkApiKeyLogic, testModel as testModelLogic } from "./api-checker";

export async function validateApiKeyAction(providerId: string, apiKey: string) {
  return await checkApiKeyLogic(providerId, apiKey);
}

export async function testSpecificModelAction(providerId: string, apiKey: string, modelId: string) {
  return await testModelLogic(providerId, apiKey, modelId);
}

export function createAuthHeader(apiKey: string, apiSecret: string): string {
  const credentials = `${apiKey}:${apiSecret}`
  return `Basic ${Buffer.from(credentials).toString("base64")}`
}

export function createTokenAuthHeader(username: string, apiKey: string): string {
  return `token ${username}:${apiKey}`
}

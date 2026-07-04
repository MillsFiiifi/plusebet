declare module 'web-push' {
  interface WebPushSubscription {
    endpoint: string
    keys: { p256dh: string; auth: string }
  }
  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string,
  ): void
  export function sendNotification(
    subscription: WebPushSubscription,
    payload?: string,
  ): Promise<unknown>
  export function generateVAPIDKeys(): { publicKey: string; privateKey: string }
  const _default: {
    setVapidDetails: typeof setVapidDetails
    sendNotification: typeof sendNotification
    generateVAPIDKeys: typeof generateVAPIDKeys
  }
  export default _default
}

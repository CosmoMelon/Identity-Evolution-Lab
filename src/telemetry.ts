export const goatCounterEvent = (path: string, event: boolean = false) => {
  try {
    if ((window as any).goatcounter && (window as any).goatcounter.count) {
      (window as any).goatcounter.count({
        path: path,
        event: event,
      })
    }
  } catch (error) {
    console.error('GoatCounter Error:', error)
  }
}

export const simpleAnalyticsEvent = (eventName: string, metadata?: any) => {
  try {
    if ((window as any).sa_event) {
      (window as any).sa_event(eventName, metadata)
    }
  } catch (error) {
    console.error('SimpleAnalytics Error:', error)
  }
}

type NetworkListener = (isOnline: boolean) => void;

class NetworkStateManager {
  private isOnlineState: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners = new Set<NetworkListener>();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.update(true));
      window.addEventListener('offline', () => this.update(false));
    }
  }

  public isOnline(): boolean {
    return this.isOnlineState;
  }

  public subscribe(cb: NetworkListener): () => void {
    this.listeners.add(cb);
    cb(this.isOnlineState);
    return () => this.listeners.delete(cb);
  }

  private update(online: boolean) {
    this.isOnlineState = online;
    this.listeners.forEach((cb) => cb(online));
  }
}

export const networkState = new NetworkStateManager();

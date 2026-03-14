import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface WebSocketConfig {
  url: string;
  namespace: string;
}

export const WS_CONFIG = new InjectionToken<WebSocketConfig>('WS_CONFIG');

export const websocketConfig: WebSocketConfig = {
  url: environment.apiUrl.replace('/api', ''),
  namespace: '/events',
};

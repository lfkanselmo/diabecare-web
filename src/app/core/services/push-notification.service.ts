import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {

    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/push`;

    async requestPermissionAndSubscribe(): Promise<boolean> {
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                console.warn('Push no soportado en este navegador');
                return false;
            }

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return false;

            const registration = await navigator.serviceWorker.ready;
            const publicKey = await this.getVapidPublicKey();
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array(publicKey) as ArrayBuffer
            });

            const key = subscription.getKey('p256dh');
            const auth = subscription.getKey('auth');

            await firstValueFrom(this.http.post(`${this.baseUrl}/subscribe`, {
                endpoint: subscription.endpoint,
                p256dh: key ? btoa(String.fromCharCode(...new Uint8Array(key))) : '',
                auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : ''
            }));

            return true;
        } catch (err) {
            console.error('Error suscribiendo push:', err);
            return false;
        }
    }

    async unsubscribe(): Promise<void> {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (!subscription) return;

            await firstValueFrom(this.http.delete(`${this.baseUrl}/unsubscribe`, {
                body: { endpoint: subscription.endpoint }
            }));

            await subscription.unsubscribe();
        } catch (err) {
            console.error('Error cancelando suscripción push:', err);
        }
    }

    private async getVapidPublicKey(): Promise<string> {
        const res = await firstValueFrom(this.http.get<{ publicKey: string }>(
            `${this.baseUrl}/vapid-public-key`
        ));
        return res.publicKey;
    }

    private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const buffer = new ArrayBuffer(rawData.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < rawData.length; i++) {
            view[i] = rawData.charCodeAt(i);
        }
        return buffer;
    }
}
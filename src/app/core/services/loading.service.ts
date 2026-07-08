import { Injectable, signal } from '@angular/core';

const SHOW_DELAY_MS = 300;

@Injectable({ providedIn: 'root' })
export class LoadingService {

    readonly visible = signal(false);

    private pendingCount = 0;
    private showTimer: ReturnType<typeof setTimeout> | null = null;

    show(): void {
        this.pendingCount++;

        if (this.pendingCount === 1 && this.showTimer === null) {
            this.showTimer = setTimeout(() => {
                if (this.pendingCount > 0) {
                    this.visible.set(true);
                }
                this.showTimer = null;
            }, SHOW_DELAY_MS);
        }
    }

    hide(): void {
        this.pendingCount = Math.max(0, this.pendingCount - 1);

        if (this.pendingCount === 0) {
            if (this.showTimer !== null) {
                clearTimeout(this.showTimer);
                this.showTimer = null;
            }
            this.visible.set(false);
        }
    }
}

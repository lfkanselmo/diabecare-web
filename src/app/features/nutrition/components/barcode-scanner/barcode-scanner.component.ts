import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe } from '@jsverse/transloco';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslocoPipe,
  ],
  templateUrl: './barcode-scanner.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './barcode-scanner.component.scss',
})
export class BarcodeScannerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoElement!: ElementRef<HTMLVideoElement>;

  private readonly dialogRef = inject(MatDialogRef<BarcodeScannerComponent>);
  private controls: IScannerControls | null = null;

  starting = signal(true);
  errorMessage = signal<string | null>(null);

  async ngAfterViewInit(): Promise<void> {
    const reader = new BrowserMultiFormatReader();

    try {
      this.controls = await reader.decodeFromVideoDevice(
        undefined,
        this.videoElement.nativeElement,
        (result, error) => {
          this.starting.set(false);
          if (result) {
            this.dialogRef.close(result.getText());
          }
          // "error" se dispara en CADA frame sin código detectado — es el
          // funcionamiento normal de zxing mientras escanea, no un fallo real.
          void error;
        },
      );
    } catch {
      this.starting.set(false);
      this.errorMessage.set('nutrition.barcodeScanner.cameraError');
    }
  }

  ngOnDestroy(): void {
    this.controls?.stop();
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

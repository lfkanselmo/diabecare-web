import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [RouterLink, MatIconModule, TranslocoPipe],
  templateUrl: './privacy-policy.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './privacy-policy.component.scss',
})
export class PrivacyPolicyComponent {
  readonly sectionCount = 10;
  readonly sections = Array.from({ length: this.sectionCount }, (_, i) => i + 1);
}

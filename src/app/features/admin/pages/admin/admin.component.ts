import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { SystemConfigService } from '../../../../core/services/system-config.service';
import { AdminUserResponse } from '../../models/admin-user.model';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    DatePipe,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    TranslocoPipe,
  ],
  templateUrl: './admin.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly transloco = inject(TranslocoService);
  readonly systemConfig = inject(SystemConfigService);

  readonly currentUserId = this.authService.getUserId();
  readonly displayedColumns = ['email', 'role', 'status', 'createdAt', 'actions'];

  users = signal<AdminUserResponse[]>([]);
  usersLoading = signal(true);
  totalElements = signal(0);
  pageIndex = signal(0);
  pageSize = signal(20);
  armedRoleChangeUserId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadUsers();
    this.systemConfig.load();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  onArmRoleChange(userId: string): void {
    this.armedRoleChangeUserId.set(userId);
  }

  onCancelRoleChange(): void {
    this.armedRoleChangeUserId.set(null);
  }

  onConfirmRoleChange(user: AdminUserResponse): void {
    const newRole = user.role === 'ADMIN' ? 'PATIENT' : 'ADMIN';

    this.adminService.changeUserRole(user.id, newRole).subscribe({
      next: () => {
        this.armedRoleChangeUserId.set(null);
        this.notificationService.success(this.transloco.translate('admin.users.roleChanged'));
        this.loadUsers();
      },
      error: () => {
        this.armedRoleChangeUserId.set(null);
        this.notificationService.danger(this.transloco.translate('admin.users.roleChangeError'));
      },
    });
  }

  onReloadConfig(): void {
    this.systemConfig.reload();
    this.notificationService.success(this.transloco.translate('admin.config.reloaded'));
  }

  private loadUsers(): void {
    this.usersLoading.set(true);
    this.adminService.getUsers(this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.users.set(page.content);
        this.totalElements.set(page.totalElements);
        this.usersLoading.set(false);
      },
      error: () => this.usersLoading.set(false),
    });
  }
}

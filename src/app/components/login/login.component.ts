import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  username = '';
  password = '';
  isLoading = false;
  showPassword = false;

  // ---------- TOAST SYSTEM ----------
  toasts: any[] = [];
  toastId = 0;

  constructor(private authService: AuthService) {}

  showToast(message: string, type: 'error' | 'success' = 'error') {

    const id = ++this.toastId;

    const toast = {
      id,
      message,
      type,
      hide: false
    };

    // NEWEST ON TOP
    this.toasts.unshift(toast);

    // enforce MAX 5 immediately
    if (this.toasts.length > 5) {
      const last = this.toasts[this.toasts.length - 1];
      this.closeToast(last.id, false);   // remove without animation
    }

    // auto close (with animation)
    setTimeout(() => this.closeToast(id), 3500);
  }

  closeToast(id: number, animate: boolean = true) {
    const toast = this.toasts.find(t => t.id === id);
    if (!toast) return;

    if (animate) {
      toast.hide = true;
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== id);
      }, 250);
    } else {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }
  }

  // ---------- LOGIN ----------
  onLogin(): void {

    const trimmedUsername = this.username.trim();
    const trimmedPassword = this.password.trim();

    if (!trimmedUsername && !trimmedPassword) {
      this.showToast('Please enter username and password');
      return;
    }

    if (!trimmedUsername) {
      this.showToast('Please enter username');
      return;
    }

    if (!trimmedPassword) {
      this.showToast('Please enter password');
      return;
    }

    this.isLoading = true;

    this.authService.login(trimmedUsername, trimmedPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showToast('Login successful!', 'success');
      },

      error: (error) => {
        this.isLoading = false;
        this.showToast('Login failed. Please check your credentials.');
      }
    });
  }
}

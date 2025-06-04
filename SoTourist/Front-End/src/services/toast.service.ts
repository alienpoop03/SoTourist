import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastController: ToastController) {}

  async showSuccess(message: string, duration: number = 3000, position: 'top' | 'bottom' | 'middle' = 'top') {
    const toast = await this.toastController.create({
      message,
      duration,
      position,
      color: 'success',
      animated: true,
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  async showError(message: string, duration: number = 3000, position: 'top' | 'bottom' | 'middle' = 'top') {
    const toast = await this.toastController.create({
      message,
      duration,
      position,
      color: 'danger',
      animated: true,
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  async showWarning(message: string, duration: number = 3000, position: 'top' | 'bottom' | 'middle' = 'top') {
    const toast = await this.toastController.create({
      message,
      duration,
      position,
      color: 'warning',
      animated: true,
      cssClass: 'custom-toast'
    });
    await toast.present();
  }
} 

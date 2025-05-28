import { ToastController } from '@ionic/angular';

export async function showSuccessToast(toastController: ToastController, message: string) {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color: 'success',
    animated: true,
    cssClass: 'success-toast'
  });
  await toast.present();
}

export async function showErrorToast(toastController: ToastController, message: string) {
  const toast = await toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color: 'danger',
    animated: true,
    cssClass: 'error-toast'
  });
  await toast.present();
}
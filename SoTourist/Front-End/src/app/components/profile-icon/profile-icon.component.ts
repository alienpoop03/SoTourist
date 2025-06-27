import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { convertFileToBase64 } from 'src/app/utils/image-utils';
import { ActionSheetController } from '@ionic/angular';

@Component({
  selector: 'app-profile-icon',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './profile-icon.component.html',
  styleUrls: ['./profile-icon.component.scss']
})
export class ProfileIconComponent implements OnInit, OnChanges {

  @Input({ required: true }) userId!: string;
  @Input() size = 100;
  @Input() editable = false;
  @Input() forcePlaceholder: boolean = false;
  @Input() src: string | null = null;

  @Output() changed = new EventEmitter<string>();

  image: SafeUrl | null = null;
  private isActionSheetOpen = false;

  constructor(
    private sanitizer: DomSanitizer,
    private auth: AuthService,
    private actionSheetCtrl: ActionSheetController
  ) {}

  // lifecycle
  ngOnInit(): void {
    if (this.userId) {
      this.loadImageFromBackend();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && this.userId) {
      this.loadImageFromBackend();
    }
    // Gestione src opzionale (aggiorna preview live)
    if (changes['src'] && this.src) {
      this.image = this.sanitizer.bypassSecurityTrustUrl(this.src);
    }
  }

  // Handler apertura action sheet/modifica/elimina foto
  async triggerFileInput() {
    if (!this.editable || this.isActionSheetOpen) return;

    this.isActionSheetOpen = true;

    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Gestisci foto profilo',
      buttons: [
        {
          text: 'Modifica foto',
          icon: 'image-outline',
          role: 'custom-modify'
        },
        {
          text: 'Elimina foto',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.deleteImage();
          }
        },
        {
          text: 'Annulla',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();

    const result = await actionSheet.onDidDismiss();
    this.isActionSheetOpen = false;

    if (result.role === 'custom-modify') {
      document.getElementById('fileInput')?.click();
    }
  }

  async onImageSelected(evt: Event): Promise<void> {
    if (!this.editable) return;

    const file = (evt.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    const base64 = await convertFileToBase64(file);

    // Salva su backend
    this.auth.updateProfileImage(this.userId, base64).subscribe({
      next: () => console.log('Immagine profilo aggiornata'),
      error: err => console.error('Errore salvataggio immagine profilo', err)
    });

    // Aggiorna preview
    this.image = this.sanitizer.bypassSecurityTrustUrl(base64);
    this.changed.emit(base64);
  }

  // Carica immagine profilo dal backend
  private loadImageFromBackend(): void {
    this.auth.getProfileImage(this.userId).subscribe({
      next: (res: { base64: string }) => {
        if (res?.base64) {
          this.image = this.sanitizer.bypassSecurityTrustUrl(res.base64);
        } else {
          this.image = null;
        }
      },
      error: () => {
        this.image = null;
      }
    });
  }

  // Cancella immagine profilo dal backend
  deleteImage() {
    if (!this.userId) return;
    console.log('Elimino la foto per userId:', this.userId);
    this.auth.updateProfileImage(this.userId, "").subscribe({
      next: res => {
        console.log('Risposta eliminazione:', res);
        this.image = null;
        this.changed.emit('');
      },
      error: err => {
        console.error('Errore eliminazione foto:', err);
      }
    });
  }
}
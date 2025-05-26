/*import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { convertFileToBase64 } from 'src/app/utils/image-utils';

@Component({
  selector: 'app-profile-icon',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './profile-icon.component.html',
  styleUrls: ['./profile-icon.component.scss']
})
export class ProfileIconComponent {
  @Input() src: string | null = null;
  @Input() editable: boolean = false;
  @Output() changed = new EventEmitter<string>();
  @Input() size: number = 80;
  @Input() navigateTo: string | null = null;
  
  username: string = '';
  email: string = '';
  password: string = '';
  profileImageUrl: string | null = null;
  

  triggerFileInput() {
    if (this.editable) {
      document.getElementById('fileInput')?.click();
    }
  }

  /*onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files?.[0]) {
      const reader = new FileReader();
      reader.onload = e => {
        const result = (e.target as any).result;
        this.changed.emit(result);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  async onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (file) {
      const base64 = await convertFileToBase64(file);
      this.src = base64;
      this.changed.emit(base64); // 🔁 notifica al parent
    }
  }

  saveProfile() {
    const profile = {
      username: this.username,
      email: this.email,
      password: this.password,
      profileImageUrl: this.profileImageUrl
    };

    localStorage.setItem('userProfile', JSON.stringify(profile));
    console.log('Profilo salvato', profile);
  }

  ngOnInit() {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
      const parsed = JSON.parse(saved);
      this.username = parsed.username;
      this.email = parsed.email;
      this.password = parsed.password;
      this.profileImageUrl = parsed.profileImageUrl;
    }
}
}*/
// src/app/components/profile-icon/profile-icon.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { convertFileToBase64 } from 'src/app/utils/image-utils';

@Component({
  selector: 'app-profile-icon',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './profile-icon.component.html',
  styleUrls: ['./profile-icon.component.scss']
})
export class ProfileIconComponent implements OnInit {
  /** obbligatorio */
  @Input({ required: true }) userId!: string;
  @Input() size = 100;
  @Input() editable = false;

  /** opzionale: se il padre vuole settare un’immagine all’avvio */
  @Input() src: string | null = null;

  /** notifica il padre quando cambia */
  @Output() changed = new EventEmitter<string>();

  image: SafeUrl | null = null;

  constructor(
    private sanitizer: DomSanitizer,
    private auth: AuthService
  ) {}

  /* ------------ lifecycle ------------ */
  ngOnInit(): void {
    if (this.userId) {
      this.loadImageFromBackend();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userId'] && this.userId) {
      this.loadImageFromBackend();
    }
  }

  /* ------------ UI handlers ------------ */
  triggerFileInput(): void {
    if (this.editable) {
      document.getElementById('fileInput')?.click();
    }
  }

  async onImageSelected(evt: Event): Promise<void> {
    const file = (evt.target as HTMLInputElement)?.files?.[0];
    if (!file) return;

    const base64 = await convertFileToBase64(file);

    /* salva su backend */
    this.auth.updateProfileImage(this.userId, base64).subscribe({
      next: () => console.log('✅ immagine salvata'),
      error: err => console.error('Errore salvataggio', err)
    });

    /* aggiorna preview */
    this.image = this.sanitizer.bypassSecurityTrustUrl(base64);
    this.changed.emit(base64);
  }

  /* ------------ helpers ------------ */
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
}


import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';

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

  username: string = '';
  email: string = '';
  password: string = '';
  profileImageUrl: string | null = null;
  @Input() size: number = 80;
  @Input() navigateTo: string | null = null;

  triggerFileInput() {
    if (this.editable) {
      document.getElementById('fileInput')?.click();
    }
  }

  onImageSelected(event: Event) {
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
}

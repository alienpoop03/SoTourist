import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-generation-overlay',
  templateUrl: './generation-overlay.component.html',
  styleUrls: ['./generation-overlay.component.scss'],
  standalone: true,
})
export class GenerationOverlayComponent  {
  @Input() message: string | null = null;
  constructor() { }

}

import { Component, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter, Input  } from '@angular/core';
import Litepicker from 'litepicker';

@Component({
  selector: 'app-range-calendar-lite',
  standalone: true,
  templateUrl: './range-calendar-lite.component.html',
  styleUrls: ['./range-calendar-lite.component.scss']
})
export class RangeCalendarLiteComponent implements AfterViewInit {
  @Input() minDate!: string | Date;
  @ViewChild('calendarContainer', { static: true }) calendarContainer!: ElementRef;
  @Output() datesSelected = new EventEmitter<{ from: string, to: string }>();
  picker!: Litepicker;

  ngAfterViewInit(): void {
    this.picker = new Litepicker({
      element: this.calendarContainer.nativeElement,
      inlineMode: true,
      singleMode: false,
      numberOfMonths: 1,
      numberOfColumns: 1,
      allowRepick: true,
      selectForward: true,
      lang: 'it-IT',
      minDate: this.minDate, // ✅ ECCOLO QUI!
      setup: (picker) => {
        picker.on('selected', (start, end) => {
          this.datesSelected.emit({
            from: start.format('YYYY-MM-DD'),
            to: end.format('YYYY-MM-DD')
          });
        });
      }
    });

    // Mostra sempre il calendario appena montato
    setTimeout(() => {
      this.picker.show();
    }, 10);
  }
}

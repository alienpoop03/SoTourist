import { Component, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter } from '@angular/core';
import Litepicker from 'litepicker';

@Component({
  selector: 'app-range-calendar-lite',
  standalone: true,
  template: `<div #calendarContainer id="calendarContainer"></div>`,
  styleUrls: ['./range-calendar-lite.component.scss']
})
export class RangeCalendarLiteComponent implements AfterViewInit {

  @ViewChild('calendarContainer', { static: true }) calendarContainer!: ElementRef;
  @Output() datesSelected = new EventEmitter<{ from: string, to: string }>();
  picker!: Litepicker;

  ngAfterViewInit(): void {
  this.picker = new Litepicker({
    element: this.calendarContainer.nativeElement,
    inlineMode: true,
    singleMode: false,
    numberOfMonths: 1,
    numberOfColumns: 0.5,
    allowRepick: true,
    selectForward: true,
    lang: 'en-US',
    setup: (picker) => {
      picker.on('selected', (start, end) => {
        this.datesSelected.emit({
          from: start.format('YYYY-MM-DD'),
          to: end.format('YYYY-MM-DD')
        });
      });
    }
  });

  // 👇 override diretto sul DOM appena viene montato
  setTimeout(() => {
    const root = this.calendarContainer.nativeElement.querySelector('.litepicker');
    if (root) {
      root.style.width = '100%';
      root.style.maxWidth = '100%';
    }
  }, 50);

  this.picker.show();
}

}

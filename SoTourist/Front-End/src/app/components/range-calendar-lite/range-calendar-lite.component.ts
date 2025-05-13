import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Output,
  Input,
  EventEmitter
} from '@angular/core';
import Litepicker from 'litepicker';

@Component({
  selector: 'app-range-calendar-lite',
  standalone: true,
  templateUrl: './range-calendar-lite.component.html',
  styleUrls: ['./range-calendar-lite.component.scss']
})
export class RangeCalendarLiteComponent implements AfterViewInit {
  @ViewChild('calendarContainer', { static: true }) calendarContainer!: ElementRef;
  @Output() datesSelected = new EventEmitter<{ from: string, to: string }>();
  @Input() startFromDate!: string; // Es. '2025-05-13'


  ngAfterViewInit() {
    new Litepicker({
      element: this.calendarContainer.nativeElement,
      singleMode: false,
      inlineMode: true,
      format: 'YYYY-MM-DD',
      numberOfMonths: 12,
      numberOfColumns: 1,
      autoApply: true,
      minDate: this.startFromDate,

      setup: (pickerInstance: any) => {
        pickerInstance.on('selected', (start: any, end: any) => {
          console.log('🔍 Valori grezzi ricevuti da Litepicker:', start, end);

          const fromDate = start?.dateInstance;
          const toDate = end?.dateInstance;

          console.log('✅ Dopo conversione:', fromDate, toDate);

          if (!fromDate || !toDate || isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return;

          this.datesSelected.emit({
            from: fromDate.toISOString().split('T')[0],
            to: toDate.toISOString().split('T')[0]
          });
        });
      }




    });
  }


}

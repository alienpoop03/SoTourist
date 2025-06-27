import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-toggle',
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ToggleComponent),
    multi: true
  }]
})
export class ToggleComponent implements ControlValueAccessor {
  @Input() checked = false;
  @Output() change = new EventEmitter<boolean>();

  private onChange = (_: any) => {};
  private onTouched = () => {};

  toggle() {
    this.checked = !this.checked;
    this.onChange(this.checked);
    this.change.emit(this.checked);
  }

  writeValue(val: any): void {
    this.checked = val;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
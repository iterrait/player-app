import { FormControl, FormGroup } from '@angular/forms';

export type MediaGroup = FormGroup<{
  objectType: FormControl<string | null>;
  objectValue: FormControl<string | null>;
  time: FormControl<number | null>;
}>;

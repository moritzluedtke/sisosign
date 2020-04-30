import { NgModule } from '@angular/core';
import {
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule
} from '@angular/material';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
    imports: [
        MatButtonModule,
        MatCardModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDividerModule,
        MatCheckboxModule,
        MatTooltipModule
    ],
    exports: [
        MatButtonModule,
        MatCardModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDividerModule,
        MatCheckboxModule,
        MatTooltipModule
    ],
})
export class CustomMaterialModule {
}

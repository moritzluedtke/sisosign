import { NgModule } from '@angular/core';
import { MatButtonModule, MatCardModule, MatInputModule, MatFormFieldModule, MatDividerModule } from '@angular/material';
import { FormsModule } from '@angular/forms';

@NgModule({
    imports: [
        MatButtonModule,
        MatCardModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDividerModule
    ],
    exports: [
        MatButtonModule,
        MatCardModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDividerModule
    ],
})
export class CustomMaterialModule { }

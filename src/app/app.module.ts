import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MainCalcComponent } from './components/main-calc/main-calc.component';
import { CustomMaterialModule } from './custom-material/custom-material.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SettingsDialogComponent } from './components/settings-dialog/settings-dialog.component';

@NgModule({
    declarations: [
        AppComponent,
        MainCalcComponent,
        SettingsDialogComponent
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        CustomMaterialModule,
        FlexLayoutModule
    ],
    entryComponents: [
        SettingsDialogComponent
    ],
    providers: [],
    bootstrap: [ AppComponent ]
})
export class AppModule {
}

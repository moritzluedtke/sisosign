import { Component, Inject, OnInit } from '@angular/core';
import { LocalStorageKeys } from '../../global-constants/local-storage-keys.model';
import { Util } from '../../util/util.component';
import { TimeUtil } from '../../util/time-util.component';
import { Pausenregelung } from '../../model/pausenregelung.model';
import { Einstempelverhalten } from '../../model/einstempelverhalten.model';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-settings-dialog',
    templateUrl: './settings-dialog.component.html',
    styleUrls: [ './settings-dialog.component.scss' ],
})
export class SettingsDialogComponent implements OnInit {
    taeglicheArbeitszeit: string;
    einstempelZurueckdatierungInMinuten: string;
    firstTime: boolean;
    isJetztOptionActivatedByDefault: boolean;
    selectedPausenregelung: Pausenregelung;
    selectedEinstempelVerhalten: string;
    lowerArbeitszeitLimit = TimeUtil.parseRawTime('06:00');
    upperArbeitszeitLimit = TimeUtil.parseRawTime('10:00');
    pausenlaengeFormFieldControl: UntypedFormControl;
    taeglicheArbeitszeitFormFieldControl: UntypedFormControl;

    constructor(public dialogRef: MatDialogRef<SettingsDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.firstTime = data.firstTime;
    }

    ngOnInit(): void {
        this.pausenlaengeFormFieldControl = new UntypedFormControl('', [ Validators.required ]);
        this.taeglicheArbeitszeitFormFieldControl = new UntypedFormControl('', [ Validators.required ]);
        if (this.firstTime) {
            this.pausenlaengeFormFieldControl.markAsTouched();
            this.taeglicheArbeitszeitFormFieldControl.markAsTouched();
        }

        this.taeglicheArbeitszeit = localStorage.getItem(LocalStorageKeys.TAEGLICHE_ARBEITSZEIT_KEY);
        this.taeglicheArbeitszeitFormFieldControl.setValue(this.taeglicheArbeitszeit);
        this.pausenlaengeFormFieldControl.setValue(JSON.parse(localStorage.getItem(LocalStorageKeys.PAUSENLAENGE_KEY)));
        this.selectedPausenregelung = Pausenregelung[localStorage.getItem(LocalStorageKeys.PAUSENREGELUNG_KEY)];
        this.selectedEinstempelVerhalten = Einstempelverhalten[localStorage.getItem(LocalStorageKeys.EINSTEMEPELVERHALTEN)];
        this.isJetztOptionActivatedByDefault = JSON.parse(localStorage.getItem(LocalStorageKeys.JETZT_OPTION_ACTIVATED_BY_DEFAULT_KEY));
        this.einstempelZurueckdatierungInMinuten = localStorage.getItem(LocalStorageKeys.EINSTEMPEL_ZURUECKDATIERUNG_IN_MINUTEN_KEY);
    }

    public onPausenregelungChange() {
        this.pausenlaengeFormFieldControl.markAsTouched();

        if (this.selectedPausenregelung == 'LAW') {
            this.pausenlaengeFormFieldControl.disable()
        } else {
            this.pausenlaengeFormFieldControl.enable()
        }
    }

    public saveAndClose() {
        localStorage.setItem(LocalStorageKeys.TAEGLICHE_ARBEITSZEIT_KEY, String(this.taeglicheArbeitszeit));
        localStorage.setItem(LocalStorageKeys.PAUSENLAENGE_KEY, String(this.pausenlaengeFormFieldControl.value));
        localStorage.setItem(LocalStorageKeys.JETZT_OPTION_ACTIVATED_BY_DEFAULT_KEY, String(this.isJetztOptionActivatedByDefault));
        localStorage.setItem(LocalStorageKeys.PAUSENREGELUNG_KEY, String(this.selectedPausenregelung));
        localStorage.setItem(LocalStorageKeys.EINSTEMEPELVERHALTEN, String(this.selectedEinstempelVerhalten));
        localStorage.setItem(LocalStorageKeys.EINSTEMPEL_ZURUECKDATIERUNG_IN_MINUTEN_KEY, this.einstempelZurueckdatierungInMinuten);

        this.dialogRef.close();
    }

    public isAnyInputInvalid(): boolean {
        return Util.isEmpty(this.taeglicheArbeitszeitFormFieldControl.value)
            || (Util.isEmpty(this.pausenlaengeFormFieldControl.value) && this.selectedPausenregelung === Pausenregelung.CLASSIC);
    }

    public checkForIllegalArbeitszeitInput() {
        const oldValue = this.taeglicheArbeitszeit;
        const newValue = this.taeglicheArbeitszeitFormFieldControl.value;

        const newTime = TimeUtil.parseRawTime(newValue);

        if (TimeUtil.isABeforeOrEqualToB(newTime, this.lowerArbeitszeitLimit) || TimeUtil.isAAfterB(newTime, this.upperArbeitszeitLimit)) {
            this.taeglicheArbeitszeitFormFieldControl.setValue(oldValue);
        } else {
            this.taeglicheArbeitszeit = this.taeglicheArbeitszeitFormFieldControl.value;
        }
    }


}

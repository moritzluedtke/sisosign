import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LocalStorageKeys } from '../../global-constants/local-storage-keys.model';
import { Util } from '../../util/util.component';
import { TimeUtil } from '../../util/time-util.component';
import { Pausenregelung } from '../../model/pausenregelung.model';
import { Einstempelverhalten } from '../../model/einstempelverhalten.model';

@Component({
    selector: 'app-settings-dialog',
    templateUrl: './settings-dialog.component.html',
    styleUrls: [ './settings-dialog.component.scss' ]
})
export class SettingsDialogComponent implements OnInit {
    taeglicheArbeitszeitInput: string;
    taeglicheArbeitszeit: string;
    pausenlaenge: string;
    einstempelZurueckdatierungInMinuten: string;
    firstTime: boolean;
    isJetztOptionActivatedByDefault: boolean;
    selectedPausenregelung: string;
    selectedEinstempelVerhalten: string;
    lowerArbeitszeitLimit = TimeUtil.parseRawTime('06:00');
    upperArbeitszeitLimit = TimeUtil.parseRawTime('10:00');

    constructor(public dialogRef: MatDialogRef<SettingsDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.firstTime = data.firstTime;
    }

    ngOnInit(): void {
        this.taeglicheArbeitszeit = localStorage.getItem(LocalStorageKeys.TAEGLICHE_ARBEITSZEIT_KEY);
        this.taeglicheArbeitszeitInput = this.taeglicheArbeitszeit;
        this.pausenlaenge = localStorage.getItem(LocalStorageKeys.PAUSENLAENGE_KEY);
        this.selectedPausenregelung = Pausenregelung[localStorage.getItem(LocalStorageKeys.PAUSENREGELUNG_KEY)];
        this.selectedEinstempelVerhalten = Einstempelverhalten[localStorage.getItem(LocalStorageKeys.EINSTEMEPELVERHALTEN)];
        this.isJetztOptionActivatedByDefault = JSON.parse(localStorage.getItem(LocalStorageKeys.JETZT_OPTION_ACTIVATED_BY_DEFAULT_KEY));
        this.einstempelZurueckdatierungInMinuten = localStorage.getItem(LocalStorageKeys.EINSTEMPEL_ZURUECKDATIERUNG_IN_MINUTEN_KEY);
    }

    public saveAndClose() {
        localStorage.setItem(LocalStorageKeys.TAEGLICHE_ARBEITSZEIT_KEY, this.taeglicheArbeitszeit);
        localStorage.setItem(LocalStorageKeys.PAUSENLAENGE_KEY, this.pausenlaenge);
        localStorage.setItem(LocalStorageKeys.JETZT_OPTION_ACTIVATED_BY_DEFAULT_KEY, String(this.isJetztOptionActivatedByDefault));
        localStorage.setItem(LocalStorageKeys.PAUSENREGELUNG_KEY, String(this.selectedPausenregelung));
        localStorage.setItem(LocalStorageKeys.EINSTEMEPELVERHALTEN, String(this.selectedEinstempelVerhalten));
        localStorage.setItem(LocalStorageKeys.EINSTEMPEL_ZURUECKDATIERUNG_IN_MINUTEN_KEY, this.einstempelZurueckdatierungInMinuten);

        this.dialogRef.close();
    }

    public isAnyInputInvalid(): boolean {
        return Util.isEmpty(this.taeglicheArbeitszeitInput) || Util.isEmpty(this.pausenlaenge);
    }

    public checkForIllegalArbeitszeitInput() {
        const oldValue = this.taeglicheArbeitszeit;
        const newValue = this.taeglicheArbeitszeitInput;

        const newTime = TimeUtil.parseRawTime(newValue);

        if (TimeUtil.isABeforeOrEqualToB(newTime, this.lowerArbeitszeitLimit) || TimeUtil.isAAfterB(newTime, this.upperArbeitszeitLimit)) {
            this.taeglicheArbeitszeitInput = oldValue;
        } else {
            this.taeglicheArbeitszeit = this.taeglicheArbeitszeitInput;
        }
    }


}

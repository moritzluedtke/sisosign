import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LocalStorageKeys } from '../global-constants/local-storage-keys.model';
import { Util } from '../util/util.component';

@Component({
    selector: 'app-settings-dialog',
    templateUrl: './settings-dialog.component.html'
})
export class SettingsDialogComponent implements OnInit {
    taeglicheArbeitszeit: string;
    pausenlaenge: string;
    firstTime: boolean;
    showFirstTimeText = true;

    constructor(public dialogRef: MatDialogRef<SettingsDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {
        this.firstTime = data.firstTime;
    }

    ngOnInit(): void {
        this.taeglicheArbeitszeit = localStorage.getItem(LocalStorageKeys.TAEGLICHE_ARBEITSZEIT_KEY);
        this.pausenlaenge = localStorage.getItem(LocalStorageKeys.PAUSENLAENGE_KEY);
    }

    public saveAndClose() {
        localStorage.setItem(LocalStorageKeys.TAEGLICHE_ARBEITSZEIT_KEY, this.taeglicheArbeitszeit);
        localStorage.setItem(LocalStorageKeys.PAUSENLAENGE_KEY, this.pausenlaenge);

        this.dialogRef.close();
    }

    public isAnyInputInvalid(): boolean {
        return Util.isEmpty(this.taeglicheArbeitszeit) || Util.isEmpty(this.pausenlaenge);
    }

}

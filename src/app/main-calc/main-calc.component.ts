import { ApplicationRef, Component, OnInit } from '@angular/core';
import { interval } from 'rxjs';
import { Richtung, Tendenz } from '../model/tendenz.model';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LocalStorageKeys } from '../global-constants/local-storage-keys.model';
import { Util } from '../util/util.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppVersionService } from '../service/app-version.service';

@Component({
    selector: 'app-main-calc',
    templateUrl: './main-calc.component.html',
    styleUrls: [ './main-calc.component.css' ]
})
export class MainCalcComponent implements OnInit {

    regelarbeitszeitNetto = new Date();
    regelarbeitszeitPlusMittagspause = new Date();
    pauseInMinutes: number;

    readonly RELEASE_NOTE_URL = 'https://github.com/moritzluedtke/sisosign/releases';
    readonly ISSUES_URL = 'https://github.com/moritzluedtke/sisosign/issues';
    readonly SOURCE_CODE_URL = 'https://github.com/moritzluedtke/sisosign';
    readonly SNACKBAR_NEW_VERSION_RELEASED_TEXT =
        `SISOSIGN v${ this.appVersionService.getAppVersion() } ist jetzt live! Viel Spaß mit den neuen Features :)`;
    readonly SNACKBAR_NEW_VERSION_RELEASED_BUTTON_TEXT = 'Cool!';
    readonly SETTINGS_DIALOG_WIDTH = '300px';
    readonly TIME_SPLIT_SEPARATOR = ':00 GMT';
    readonly TWENTY_SECONDS = 20_000;
    readonly EINSTELLUNGEN_TOOLTIP = 'Einstellungen';
    readonly RELEASE_NOTES_TOOLTIP = 'Release Notes';
    readonly ISSUES_TOOLTIP = 'GitHub Issues';
    readonly SOURCE_CODE_TOOLTIP = 'Source Code';
    readonly WAS_WAERE_WENN_TOOLTIP = '"Was wäre wenn?" an-/ausschalten';
    readonly NETTOARBEITSZEIT_LESS_THAN_LENGTH_OF_PAUSE_TOOLTIP =
        'Du hast vermutlich noch weniger Minuten als die Länge der Pause gearbeitet. ' +
        'Daher steht die Arbeitszeit noch auf 0.';

    tendenz: Tendenz;
    wasWaereWennTendenz: Tendenz;

    areSollarbeitszeitenBerechnet = false;
    isNettoArbeitszeitBerechnet = false;
    isWasWaereWennNettoArbeitszeitBerechnet = false;
    isJetztOptionActivated = false;
    isWasWaereWennActivated = false;
    showHelpForZeroNettoarbeitszeit = false;
    wasWaereWennShowHelpForZeroNettoarbeitszeit = false;

    wasWaereWennEinstempelzeitFromInput = '';
    wasWaereWennAusstempelzeitFromInput = '';
    wasWaereWennPausenzeitFromInput = '';
    einstempelzeitFromInput = '';
    ausstempelzeitFromInput = '';

    sixHourWorkingTime = new Date();
    normalWorkingTime = new Date();
    eightHourWorkingTime = new Date();
    tenHourWorkingTime = new Date();

    sixHourWorkingLabel: string;
    regelArbeitszeitLabel: string;
    eightHourWorkingLabel: string;
    tenHourLabel: string;
    nettoArbeitszeitLabel: string;
    wasWaereWennNettoArbeitszeitLabel: string;
    tendenzLabel: string;
    wasWaereWennTendenzLabel: string;

    constructor(public dialog: MatDialog,
                public snackbar: MatSnackBar,
                public appVersionService: AppVersionService,
                private appRef: ApplicationRef) {
        this.showNewVersionSnackbar();

        if (this.loadDefaultValuesFromLocalStorage()) {
            this.berechneEverything();
        } else {
            this.openSettingsDialog(true);
        }
    }

    private static parseRawTime(rawTime: string): Date {
        const hours = Number(rawTime.split(':')[0]);
        const minutes = Number(rawTime.split(':')[1]);

        const parsedDate = new Date();
        parsedDate.setHours(hours);
        parsedDate.setMinutes(minutes);
        parsedDate.setSeconds(0);
        parsedDate.setMilliseconds(0);

        return parsedDate;
    }

    private static addHoursAndMinutesTo(resultingTime: Date, hours: number, minutes: number, baseTime: Date) {
        resultingTime.setHours(baseTime.getHours() + hours);
        resultingTime.setMinutes(baseTime.getMinutes() + minutes);

        // only here, to set seconds to zero in order to split the label based on that
        resultingTime.setSeconds(baseTime.getSeconds());
    }

    private static getTimeDifference(fromTime: Date, toTime: Date): Date {
        // reset seconds and Milliseconds as they are not considered during calculation
        fromTime.setSeconds(0);
        toTime.setSeconds(0);
        fromTime.setMilliseconds(0);
        toTime.setMilliseconds(0);

        const differenceAsDate = new Date(toTime.getTime() - fromTime.getTime());
        const newDate = new Date();

        newDate.setHours(differenceAsDate.getTime() / (1000 * 60 * 60));
        newDate.setMinutes((differenceAsDate.getTime() / (1000 * 60)) % 60);

        // only here, to set seconds to zero in order to split the label based on that
        newDate.setSeconds(0);

        return newDate;
    }

    private static isGivenDateNotToday(input: Date) {
        const today = new Date();
        return today.getDay() !== input.getDay()
            || today.getMonth() !== input.getMonth()
            || today.getFullYear() !== input.getFullYear();
    }

    private static isBruttoArbeitszeitBelowMittagspausenLength(nettoArbeitszeit: Date, pausenlaengeInMinutes: number): boolean {
        return nettoArbeitszeit.getHours() === 0 && nettoArbeitszeit.getMinutes() <= pausenlaengeInMinutes;
    }

    private static berechneNettoArbeitszeit(einstempelzeitFromUiInput: string,
                                            ausstempelzeitFromUiInput: string,
                                            pausenlaengeInMinutes: number): Date {
        if (Util.isEmpty(einstempelzeitFromUiInput)
            || Util.isEmpty(ausstempelzeitFromUiInput)
            || Util.isNumberEmpty(pausenlaengeInMinutes)) {
            return;
        }

        const einstempelzeitTime = MainCalcComponent.parseRawTime(einstempelzeitFromUiInput);
        const ausstempelzeitTime = MainCalcComponent.parseRawTime(ausstempelzeitFromUiInput);

        const bruttoArbeitszeit = MainCalcComponent.getTimeDifference(einstempelzeitTime, ausstempelzeitTime);

        const nettoArbeitszeit = bruttoArbeitszeit;

        if (MainCalcComponent.isBruttoArbeitszeitBelowMittagspausenLength(bruttoArbeitszeit, pausenlaengeInMinutes)) {
            nettoArbeitszeit.setMinutes(0);
        } else {
            nettoArbeitszeit.setMinutes(bruttoArbeitszeit.getMinutes() - pausenlaengeInMinutes);
        }

        return nettoArbeitszeit;
    }

    ngOnInit(): void {
        interval(this.TWENTY_SECONDS).subscribe(() => {
            if (this.isJetztOptionActivated) {
                this.setAusstempelzeitFromInputToNow();
                this.berechneNettoArbeitszeitWithDefaultPausenlaenge();
            }
        });
    }

    private showNewVersionSnackbar(): void {
        const lastUsedAppVersion = localStorage.getItem(LocalStorageKeys.LAST_USED_APP_VERSION_KEY);
        const currentAppVersion = this.appVersionService.getAppVersion();

        if (lastUsedAppVersion !== currentAppVersion) {
            this.appVersionService.setNewVersionPresentTo(true);

            this.openNewVersionSnackbar().afterDismissed().subscribe(() => {
                console.log('Now!');

                localStorage.setItem(LocalStorageKeys.LAST_USED_APP_VERSION_KEY, currentAppVersion);
                this.appVersionService.setNewVersionPresentTo(false);
                console.log(this.appVersionService.isNewVersionPresent());
                this.appRef.tick();

            });
        }
    }

    private openNewVersionSnackbar() {
        return this.snackbar.open(this.SNACKBAR_NEW_VERSION_RELEASED_TEXT, this.SNACKBAR_NEW_VERSION_RELEASED_BUTTON_TEXT,
            { panelClass: 'custom-snack-bar-container' });
    }

    private setAusstempelzeitFromInputToNow(): void {
        const ausstempelzeitTime = new Date();

        const minutes = ausstempelzeitTime.getMinutes().toString();
        const minutesWithLeadingZero = minutes.length === 1 ? '0' + minutes : minutes;
        const hours = ausstempelzeitTime.getHours().toString();
        const hoursWithLeadingZero = hours.length === 1 ? '0' + hours : hours;

        this.ausstempelzeitFromInput = hoursWithLeadingZero + ':' + minutesWithLeadingZero;
    }

    private berechneEverything(): void {
        this.berechneSollarbeitszeiten();
        this.berechneNettoArbeitszeitWithDefaultPausenlaenge();
        this.berechneWasWareWennNettoArbeitszeit();
    }

    private berechneSollarbeitszeiten(): void {
        if (Util.isEmpty(this.einstempelzeitFromInput)) {
            return;
        }

        const einstempelzeitTime = MainCalcComponent.parseRawTime(this.einstempelzeitFromInput);

        MainCalcComponent.addHoursAndMinutesTo(
            this.sixHourWorkingTime, 6, this.pauseInMinutes, einstempelzeitTime);
        MainCalcComponent.addHoursAndMinutesTo(
            this.eightHourWorkingTime, 8, this.pauseInMinutes, einstempelzeitTime);
        MainCalcComponent.addHoursAndMinutesTo(
            this.tenHourWorkingTime, 10, this.pauseInMinutes, einstempelzeitTime);

        MainCalcComponent.addHoursAndMinutesTo(
            this.normalWorkingTime,
            this.regelarbeitszeitPlusMittagspause.getHours(),
            this.regelarbeitszeitPlusMittagspause.getMinutes(),
            einstempelzeitTime);

        this.sixHourWorkingLabel = this.convertDateToTimeString(this.sixHourWorkingTime);
        this.regelArbeitszeitLabel = this.convertDateToTimeString(this.normalWorkingTime);
        this.eightHourWorkingLabel = this.convertDateToTimeString(this.eightHourWorkingTime);
        this.tenHourLabel = this.convertDateToTimeString(this.tenHourWorkingTime);

        this.areSollarbeitszeitenBerechnet = true;
    }

    private berechneWasWareWennNettoArbeitszeit(): void {
        const nettoArbeitszeit = MainCalcComponent.berechneNettoArbeitszeit(
            this.wasWaereWennEinstempelzeitFromInput,
            this.wasWaereWennAusstempelzeitFromInput,
            Number(this.wasWaereWennPausenzeitFromInput));

        if (Util.isObjectPresent(nettoArbeitszeit)) {
            this.isWasWaereWennNettoArbeitszeitBerechnet = true;
            this.setWasWaereWennNettoArbeitszeitLabelTo(nettoArbeitszeit);
            this.wasWaereWennShowHelpForZeroNettoarbeitszeit = nettoArbeitszeit.getHours() === 0 && nettoArbeitszeit.getMinutes() === 0;

            this.wasWaereWennTendenz = this.berechneTendenz(nettoArbeitszeit);
            this.setWasWaereWennTendenzLabelTo(this.wasWaereWennTendenz.time);
        }
    }

    private berechneNettoArbeitszeitWithDefaultPausenlaenge(): void {
        const nettoArbeitszeit = MainCalcComponent.berechneNettoArbeitszeit(
            this.einstempelzeitFromInput,
            this.ausstempelzeitFromInput,
            this.pauseInMinutes);

        if (Util.isObjectPresent(nettoArbeitszeit)) {
            this.isNettoArbeitszeitBerechnet = true;
            this.setNettoArbeitszeitLabelTo(nettoArbeitszeit);
            this.showHelpForZeroNettoarbeitszeit = nettoArbeitszeit.getHours() === 0 && nettoArbeitszeit.getMinutes() === 0;

            this.tendenz = this.berechneTendenz(nettoArbeitszeit);
            this.setTendenzTimeLabelTo(this.tendenz.time);
        }
    }

    private berechneTendenz(nettoArbeitszeit: Date): Tendenz {
        let tendenzTime = MainCalcComponent.getTimeDifference(
            this.regelarbeitszeitNetto, nettoArbeitszeit);
        let richtung = Richtung.PLUS;

        if (this.isNettoArbeitszeitBelowRegelarbeitszeit(nettoArbeitszeit)) {
            tendenzTime = MainCalcComponent.getTimeDifference(nettoArbeitszeit, this.regelarbeitszeitNetto);
            richtung = Richtung.MINUS;
        }

        return new Tendenz(tendenzTime, richtung);
    }

    private isNettoArbeitszeitBelowRegelarbeitszeit(nettoArbeitszeit: Date): boolean {
        return nettoArbeitszeit.getHours() < this.regelarbeitszeitNetto.getHours()
            || (nettoArbeitszeit.getHours() === this.regelarbeitszeitNetto.getHours() &&
                nettoArbeitszeit.getMinutes() < this.regelarbeitszeitNetto.getMinutes());
    }

    setNettoArbeitszeitLabelTo(newTime: Date): void {
        this.nettoArbeitszeitLabel = this.convertDateToTimeString(newTime);
    }

    setWasWaereWennNettoArbeitszeitLabelTo(newTime: Date): void {
        this.wasWaereWennNettoArbeitszeitLabel = this.convertDateToTimeString(newTime);
    }

    setTendenzTimeLabelTo(newTime: Date): void {
        this.tendenzLabel = this.convertDateToTimeString(newTime);
    }

    setWasWaereWennTendenzLabelTo(newTime: Date): void {
        this.wasWaereWennTendenzLabel = this.convertDateToTimeString(newTime);
    }

    private convertDateToTimeString(time: Date): string {
        return time.toTimeString().split(this.TIME_SPLIT_SEPARATOR)[0];
    }

    public handleJetztOption(): void {
        if (!this.isJetztOptionActivated) {
            this.setAusstempelzeitFromInputToNow();
            this.berechneNettoArbeitszeitWithDefaultPausenlaenge();
        }
    }

    public handleUserInputKeyPress(): void {
        this.saveEinstempelzeitToLocalStorage();
        this.berechneSollarbeitszeiten();
        this.berechneNettoArbeitszeitWithDefaultPausenlaenge();
        this.berechneWasWareWennNettoArbeitszeit();
    }

    public openSettingsDialog(firstTime: boolean): void {
        const dialogRef = this.dialog.open(SettingsDialogComponent, {
            width: this.SETTINGS_DIALOG_WIDTH,
            data: { firstTime },
            disableClose: firstTime
        });
        dialogRef.afterClosed().subscribe(() => {
            this.loadDefaultValuesFromLocalStorage();
            this.berechneEverything();
        });
    }

    public loadDefaultValuesFromLocalStorage(): boolean {
        const pausenlaenge = localStorage.getItem(LocalStorageKeys.PAUSENLAENGE_KEY);
        const taeglicheArbeitszeitString = localStorage.getItem(LocalStorageKeys.TAEGLICHE_ARBEITSZEIT_KEY);
        const wasWaereWennActivated = localStorage.getItem(LocalStorageKeys.WAS_WAERE_WENN_ACTIVATED_KEY);
        const einstempelzeitRaw = localStorage.getItem(LocalStorageKeys.EINSTEMPELZEIT_RAW_KEY);
        const lastUpdateOnEinstempelzeit = localStorage.getItem(LocalStorageKeys.LAST_UPDATE_ON_EINSTEMPELZEIT_KEY);

        if (Util.isEmpty(wasWaereWennActivated)) {
            this.isWasWaereWennActivated = false;
        } else {
            this.isWasWaereWennActivated = JSON.parse(wasWaereWennActivated);
        }

        if (Util.isEmpty(einstempelzeitRaw) || MainCalcComponent.isGivenDateNotToday(new Date(lastUpdateOnEinstempelzeit))) {
            localStorage.removeItem(LocalStorageKeys.EINSTEMPELZEIT_RAW_KEY);
            localStorage.removeItem(LocalStorageKeys.LAST_UPDATE_ON_EINSTEMPELZEIT_KEY);
        } else {
            this.einstempelzeitFromInput = einstempelzeitRaw;
        }

        if (Util.isNotEmpty(pausenlaenge)
            && Util.isNotEmpty(taeglicheArbeitszeitString)) {
            this.pauseInMinutes = Number(pausenlaenge);
            this.updateRegelarbeitszeit(taeglicheArbeitszeitString);

            return true;
        }

        return false;
    }

    private saveEinstempelzeitToLocalStorage() {
        localStorage.setItem(LocalStorageKeys.EINSTEMPELZEIT_RAW_KEY, this.einstempelzeitFromInput);
        localStorage.setItem(LocalStorageKeys.LAST_UPDATE_ON_EINSTEMPELZEIT_KEY, new Date().toISOString());
    }

    private updateRegelarbeitszeit(taeglicheArbeitszeitString: string) {
        this.regelarbeitszeitNetto = MainCalcComponent.parseRawTime(taeglicheArbeitszeitString);
        MainCalcComponent.addHoursAndMinutesTo(
            this.regelarbeitszeitPlusMittagspause, 0, this.pauseInMinutes, this.regelarbeitszeitNetto);
    }

    public redirectPageTo(url: string): void {
        window.open(url);
    }

    public toggleWasWareWenn(): void {
        this.isWasWaereWennActivated = !this.isWasWaereWennActivated;
        localStorage.setItem(LocalStorageKeys.WAS_WAERE_WENN_ACTIVATED_KEY, `${ this.isWasWaereWennActivated }`);
    }

}

import { Component, OnInit } from '@angular/core';
import { interval } from 'rxjs';
import { Polarity, TendenzRichtung } from '../model/tendenz.model';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LocalStorageKeys } from '../global-constants/local-storage-keys.model';
import { Util } from '../util/util.component';

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
    readonly EMPTY = '';
    readonly TIME_SPLIT_SEPARATOR = ':00 GMT';
    readonly TWENTY_SECONDS = 20_000;
    readonly EINSTELLUNGEN_TOOLTIP = 'Einstellungen';
    readonly RELEASE_NOTES_TOOLTIP = 'Release Notes';
    readonly ISSUES_TOOLTIP = 'GitHub Issues';
    readonly SOURCE_CODE_TOOLTIP = 'Source Code';
    readonly WAS_WAERE_WENN_TOOLTIP = '"Was wäre wenn?" an-/ausschalten';
    readonly NETTOARBEITSZEIT_LESS_THAN_LENGTH_OF_PAUSE_TOOLTIP =
        'Du hast vermutlich noch weniger Minuten als die Länge der Mittagspause gearbeitet. ' +
        'Daher steht die Arbeitszeit noch auf 0h.';

    nettoArbeitszeit = new Date();
    tendenzRichtung: TendenzRichtung;

    areSollarbeitszeitenBerechnet = false;
    isNettoArbeitszeitBerechnet = false;
    isJetztOptionActivated = false;
    isWasWaereWennActivated = false;
    showHelpForZeroNettoarbeitszeit = false;

    einstempelzeitTime: Date;
    ausstempelzeitTime: Date;
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
    tendenzLabel: string;

    constructor(public dialog: MatDialog) {
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

    ngOnInit(): void {
        interval(this.TWENTY_SECONDS).subscribe(x => {
            if (this.isJetztOptionActivated) {
                this.setAusstempelzeitFromInputToNow();
                this.berechneNettoArbeitszeit();
            }
        });
    }

    private setAusstempelzeitFromInputToNow(): void {
        this.ausstempelzeitTime = new Date();

        const minutes = this.ausstempelzeitTime.getMinutes().toString();
        const minutesWithLeadingZero = minutes.length === 1 ? '0' + minutes : minutes;
        const hours = this.ausstempelzeitTime.getHours().toString();
        const hoursWithLeadingZero = hours.length === 1 ? '0' + hours : hours;

        this.ausstempelzeitFromInput = hoursWithLeadingZero + ':' + minutesWithLeadingZero;
    }

    private berechneEverything(): void {
        this.berechneSollarbeitszeiten();
        this.berechneNettoArbeitszeit();
    }

    private berechneSollarbeitszeiten(): void {
        this.loadDefaultValuesFromLocalStorage();

        if (Util.isEmpty(this.einstempelzeitFromInput)) {
            return;
        }

        this.einstempelzeitTime = MainCalcComponent.parseRawTime(this.einstempelzeitFromInput);

        MainCalcComponent.addHoursAndMinutesTo(
            this.sixHourWorkingTime, 6, this.pauseInMinutes, this.einstempelzeitTime);
        MainCalcComponent.addHoursAndMinutesTo(
            this.eightHourWorkingTime, 8, this.pauseInMinutes, this.einstempelzeitTime);
        MainCalcComponent.addHoursAndMinutesTo(
            this.tenHourWorkingTime, 10, this.pauseInMinutes, this.einstempelzeitTime);

        MainCalcComponent.addHoursAndMinutesTo(
            this.normalWorkingTime,
            this.regelarbeitszeitPlusMittagspause.getHours(),
            this.regelarbeitszeitPlusMittagspause.getMinutes(),
            this.einstempelzeitTime);

        this.sixHourWorkingLabel = this.convertDateToTimeString(this.sixHourWorkingTime);
        this.regelArbeitszeitLabel = this.convertDateToTimeString(this.normalWorkingTime);
        this.eightHourWorkingLabel = this.convertDateToTimeString(this.eightHourWorkingTime);
        this.tenHourLabel = this.convertDateToTimeString(this.tenHourWorkingTime);

        this.areSollarbeitszeitenBerechnet = true;
    }

    private berechneNettoArbeitszeit(): void {
        this.loadDefaultValuesFromLocalStorage();

        if (this.areInputsEmpty()) {
            return;
        }

        this.einstempelzeitTime = MainCalcComponent.parseRawTime(this.einstempelzeitFromInput);
        this.ausstempelzeitTime = MainCalcComponent.parseRawTime(this.ausstempelzeitFromInput);

        this.nettoArbeitszeit = MainCalcComponent.getTimeDifference(this.einstempelzeitTime, this.ausstempelzeitTime);

        if (this.isNettoArbeitszeitBelowMittagspausenLength(this.nettoArbeitszeit)) {
            this.nettoArbeitszeit.setMinutes(0);
            this.showHelpForZeroNettoarbeitszeit = true;
        } else {
            this.nettoArbeitszeit.setMinutes(this.nettoArbeitszeit.getMinutes() - this.pauseInMinutes);
            this.showHelpForZeroNettoarbeitszeit = false;
        }

        this.setNettoArbeitszeitLabelTo(this.nettoArbeitszeit);

        this.berechneTendenz();

        this.isNettoArbeitszeitBerechnet = true;
    }

    private berechneTendenz(): void {
        let tendenzTime = MainCalcComponent.getTimeDifference(
            this.regelarbeitszeitNetto, this.nettoArbeitszeit);
        let polarity = Polarity.PLUS;

        if (this.isNettoArbeitszeitBelowRegelarbeitszeit(this.nettoArbeitszeit)) {
            tendenzTime = MainCalcComponent.getTimeDifference(this.nettoArbeitszeit, this.regelarbeitszeitNetto);
            polarity = Polarity.MINUS;
        }

        this.tendenzRichtung = new TendenzRichtung(tendenzTime, polarity);

        this.setTendenzLabelTo(this.tendenzRichtung.time);
    }

    private isNettoArbeitszeitBelowRegelarbeitszeit(nettoArbeitszeit: Date): boolean {
        return nettoArbeitszeit.getHours() < this.regelarbeitszeitNetto.getHours()
            || (nettoArbeitszeit.getHours() === this.regelarbeitszeitNetto.getHours() &&
                nettoArbeitszeit.getMinutes() < this.regelarbeitszeitNetto.getMinutes());
    }

    private isNettoArbeitszeitBelowMittagspausenLength(nettoArbeitszeit: Date): boolean {
        return nettoArbeitszeit.getHours() === 0 && nettoArbeitszeit.getMinutes() <= this.pauseInMinutes;
    }

    private areInputsEmpty(): boolean {
        return this.einstempelzeitFromInput === this.EMPTY || this.ausstempelzeitFromInput === '';
    }

    setNettoArbeitszeitLabelTo(newTime: Date): void {
        this.nettoArbeitszeitLabel = this.convertDateToTimeString(newTime);
    }

    setTendenzLabelTo(newTime: Date): void {
        this.tendenzLabel = this.convertDateToTimeString(newTime);
    }

    private convertDateToTimeString(time: Date): string {
        return time.toTimeString().split(this.TIME_SPLIT_SEPARATOR)[0];
    }

    public handleJetztOption(): void {
        if (!this.isJetztOptionActivated) {
            this.setAusstempelzeitFromInputToNow();
            this.berechneNettoArbeitszeit();
        }
    }

    public handleUserInputKeyPress(): void {
        this.berechneSollarbeitszeiten();
        this.berechneNettoArbeitszeit();
    }

    public openSettingsDialog(firstTime: boolean): void {
        const dialogRef = this.dialog.open(SettingsDialogComponent, { width: '300px', data: { firstTime }, disableClose: firstTime });
        dialogRef.afterClosed().subscribe(() => {
            this.berechneEverything();
        });
    }

    public loadDefaultValuesFromLocalStorage(): boolean {
        const pausenlaenge = localStorage.getItem(LocalStorageKeys.PAUSENLAENGE_KEY);
        const taeglicheArbeitszeitString = localStorage.getItem(LocalStorageKeys.TAEGLICHE_ARBEITSZEIT_KEY);
        const wasWaereWennActivated = localStorage.getItem(LocalStorageKeys.WAS_WAERE_WENN_ACTIVATED_KEY);

        if (Util.isEmpty(wasWaereWennActivated)) {
            this.isWasWaereWennActivated = false;
        } else {
            this.isWasWaereWennActivated = Boolean(wasWaereWennActivated);
        }

        if (Util.isNotEmpty(pausenlaenge)
            && Util.isNotEmpty(taeglicheArbeitszeitString)) {
            this.pauseInMinutes = Number(pausenlaenge);
            this.updateRegelarbeitszeit(taeglicheArbeitszeitString);

            return true;
        }

        return false;
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

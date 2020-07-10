import { Component, OnInit } from '@angular/core';
import { interval } from 'rxjs';
import { Polarity, Tendenz } from '../model/tendenz.model';

@Component({
    selector: 'app-main-calc',
    templateUrl: './main-calc.component.html',
    styleUrls: [ './main-calc.component.css' ]
})
export class MainCalcComponent implements OnInit {

    readonly EMPTY = '';
    readonly TIME_SPLIT_SEPERATOR = ':00 GMT';
    readonly MITTAGSPAUSE_IN_MINUTES = 45;
    readonly TWENTY_SECONDS = 20_000;
    readonly NETTOARBEITSZEIT_LESS_THAN_45_MINUTES_TOOLTIP =
        'Du hast vermutlich noch weniger als ' + this.MITTAGSPAUSE_IN_MINUTES +
        ' Minuten (Länge der Mittagspause) gearbeitet.';
    readonly REGELARBEITSZEIT_NETTO = new Date();
    readonly REGELARBEITSZEIT_PLUS_MITTAGSPAUSE = new Date();

    nettoArbeitszeit = new Date();
    tendenz: Tendenz;

    areSollarbeitszeitenBerechnet = false;
    isNettoArbeitszeitBerechnet = false;
    isJetztOptionActivated = false;
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

    constructor() {
        this.REGELARBEITSZEIT_NETTO.setHours(7);
        this.REGELARBEITSZEIT_NETTO.setMinutes(36);

        MainCalcComponent.addHoursAndMinutesTo(
            this.REGELARBEITSZEIT_PLUS_MITTAGSPAUSE, 0, this.MITTAGSPAUSE_IN_MINUTES, this.REGELARBEITSZEIT_NETTO);
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

    private berechneSollarbeitszeiten(): void {
        if (this.einstempelzeitFromInput === this.EMPTY) {
            return;
        }

        this.einstempelzeitTime = MainCalcComponent.parseRawTime(this.einstempelzeitFromInput);

        MainCalcComponent.addHoursAndMinutesTo(this.sixHourWorkingTime, 6, 45, this.einstempelzeitTime);
        MainCalcComponent.addHoursAndMinutesTo(this.normalWorkingTime, 8, 21, this.einstempelzeitTime);
        MainCalcComponent.addHoursAndMinutesTo(this.eightHourWorkingTime, 8, 45, this.einstempelzeitTime);
        MainCalcComponent.addHoursAndMinutesTo(this.tenHourWorkingTime, 10, 45, this.einstempelzeitTime);

        this.sixHourWorkingLabel = this.convertDateToTimeString(this.sixHourWorkingTime);
        this.regelArbeitszeitLabel = this.convertDateToTimeString(this.normalWorkingTime);
        this.eightHourWorkingLabel = this.convertDateToTimeString(this.eightHourWorkingTime);
        this.tenHourLabel = this.convertDateToTimeString(this.tenHourWorkingTime);

        this.areSollarbeitszeitenBerechnet = true;
    }

    private berechneNettoArbeitszeit(): void {
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
            this.nettoArbeitszeit.setMinutes(this.nettoArbeitszeit.getMinutes() - this.MITTAGSPAUSE_IN_MINUTES);
            this.showHelpForZeroNettoarbeitszeit = false;
        }

        this.setNettoArbeitszeitLabelTo(this.nettoArbeitszeit);

        this.berechneTendenz();

        this.isNettoArbeitszeitBerechnet = true;
    }

    private berechneTendenz(): void {
        let tendenzTime = MainCalcComponent.getTimeDifference(
            this.REGELARBEITSZEIT_NETTO, this.nettoArbeitszeit);
        let polarity = Polarity.PLUS;

        if (this.isNettoArbeitszeitBelowRegelarbeitszeit(this.nettoArbeitszeit)) {
            tendenzTime = MainCalcComponent.getTimeDifference(this.nettoArbeitszeit, this.REGELARBEITSZEIT_NETTO);
            polarity = Polarity.MINUS;
        }

        this.tendenz = new Tendenz(tendenzTime, polarity);

        this.setTendenzLabelTo(this.tendenz.time);
    }

    private isNettoArbeitszeitBelowRegelarbeitszeit(nettoArbeitszeit: Date): boolean {
        return nettoArbeitszeit.getHours() < this.REGELARBEITSZEIT_NETTO.getHours()
            || (nettoArbeitszeit.getHours() === this.REGELARBEITSZEIT_NETTO.getHours() &&
                nettoArbeitszeit.getMinutes() < this.REGELARBEITSZEIT_NETTO.getMinutes());
    }

    private isNettoArbeitszeitBelowMittagspausenLength(nettoArbeitszeit: Date): boolean {
        return nettoArbeitszeit.getHours() === 0 && nettoArbeitszeit.getMinutes() <= this.MITTAGSPAUSE_IN_MINUTES;
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
        return time.toTimeString().split(this.TIME_SPLIT_SEPERATOR)[0];
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

}

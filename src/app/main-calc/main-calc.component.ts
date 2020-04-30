import { Component, OnInit } from '@angular/core';
import { interval } from 'rxjs';

@Component({
    selector: 'app-main-calc',
    templateUrl: './main-calc.component.html',
    styleUrls: ['./main-calc.component.css']
})
export class MainCalcComponent implements OnInit {

    readonly NETTOARBEITSZEIT_LESS_THAN_45_MINUTES_TOOLTIP =
        'Du hast vermutlich noch weniger als 45 Minuten (Länge der Mittagspause) gearbeitet.';
    readonly TIME_SPLIT_SEPERATOR = ':00 GMT';
    readonly LUNCH_BREAK_IN_MINUTES = 45;
    readonly TWENTY_SECONDS = 20_000;

    isSollarbeitszeitBerechnet = false;
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

    constructor() {
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

    private berechneSollarbeitszeiten() {
        if (this.einstempelzeitFromInput === '') {
            return;
        }

        this.einstempelzeitTime = MainCalcComponent.parseRawTime(this.einstempelzeitFromInput);

        MainCalcComponent.addHoursAndMinutesTo(this.sixHourWorkingTime, 6, 45, this.einstempelzeitTime);
        MainCalcComponent.addHoursAndMinutesTo(this.normalWorkingTime, 8, 21, this.einstempelzeitTime);
        MainCalcComponent.addHoursAndMinutesTo(this.eightHourWorkingTime, 8, 45, this.einstempelzeitTime);
        MainCalcComponent.addHoursAndMinutesTo(this.tenHourWorkingTime, 10, 45, this.einstempelzeitTime);

        this.sixHourWorkingLabel = this.sixHourWorkingTime.toTimeString().split(this.TIME_SPLIT_SEPERATOR)[0];
        this.regelArbeitszeitLabel = this.normalWorkingTime.toTimeString().split(this.TIME_SPLIT_SEPERATOR)[0];
        this.eightHourWorkingLabel = this.eightHourWorkingTime.toTimeString().split(this.TIME_SPLIT_SEPERATOR)[0];
        this.tenHourLabel = this.tenHourWorkingTime.toTimeString().split(this.TIME_SPLIT_SEPERATOR)[0];

        this.isSollarbeitszeitBerechnet = true;
    }

    private berechneNettoArbeitszeit() {
        if (this.einstempelzeitFromInput === '' || this.ausstempelzeitFromInput === '') {
            return;
        }

        this.einstempelzeitTime = MainCalcComponent.parseRawTime(this.einstempelzeitFromInput);
        this.ausstempelzeitTime = MainCalcComponent.parseRawTime(this.ausstempelzeitFromInput);

        const nettoArbeitszeit = MainCalcComponent.getTimeDifference(this.einstempelzeitTime, this.ausstempelzeitTime);

        if (nettoArbeitszeit.getHours() === 0 && nettoArbeitszeit.getMinutes() <= this.LUNCH_BREAK_IN_MINUTES) {
            nettoArbeitszeit.setMinutes(0);
            this.showHelpForZeroNettoarbeitszeit = true;
        } else {
            nettoArbeitszeit.setMinutes(nettoArbeitszeit.getMinutes() - this.LUNCH_BREAK_IN_MINUTES);
            this.showHelpForZeroNettoarbeitszeit = false;
        }

        this.setNettoArbeitszeitLabelTo(nettoArbeitszeit);

        this.isNettoArbeitszeitBerechnet = true;
    }

    setNettoArbeitszeitLabelTo(newTime: Date): void {
        this.nettoArbeitszeitLabel = newTime.toTimeString().split(this.TIME_SPLIT_SEPERATOR)[0];
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

    public handleBerechneSollarbeitszeitenClick(): void {
        this.berechneSollarbeitszeiten();
    }

    public handleBerechneNettoarbeitszeitClick(): void {
        this.berechneNettoArbeitszeit();
    }

    public handleKeyEnterOnEinstempelzeitInput(): void {
        this.berechneNettoArbeitszeit();
    }

    public handleKeyEnterOnAusstempelzeitInput(): void {
        this.berechneNettoArbeitszeit();
    }
}

import { Component } from '@angular/core';

@Component({
    selector: 'app-main-calc',
    templateUrl: './main-calc.component.html',
    styleUrls: ['./main-calc.component.css']
})
export class MainCalcComponent {

    private readonly TIME_SPLIT_SEPERATOR = ':00 GMT';
    private readonly LUNCH_BREAK_IN_MINUTES = 45;

    isSollarbeitszeitBerechnet = false;
    isNettoArbeitszeitBerechnet = false;

    rawEinstempelzeitTime: Date;
    rawAusstempelzeitTime: Date;

    rawEinstempelzeit = '';
    rawAusstempelzeit = '';

    sixHour45MinutesWorkingTime = new Date();
    normalWorkingTime = new Date();
    eightHourWorkingTime = new Date();
    tenHourWorkingTime = new Date();

    sixHour45MinutesWorkingLabel: string;
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
        console.log(fromTime);
        console.log(toTime);

        const differenceAsDate = new Date(toTime.getTime() - fromTime.getTime());
        const newDate = new Date();

        newDate.setHours(differenceAsDate.getTime() / (1000 * 60 * 60));
        newDate.setMinutes((differenceAsDate.getTime() / (1000 * 60)) % 60);
        newDate.setSeconds(0);

        return newDate;
    }

    public handleKeyEnterOnSollarbeitszeitenInput(): void {
        this.berechneSollarbeitszeiten();
    }

    public berechneSollarbeitszeiten() {
        if (this.rawEinstempelzeit === '') {
            return;
        }

        this.rawEinstempelzeitTime = MainCalcComponent.parseRawTime(this.rawEinstempelzeit);

        MainCalcComponent.addHoursAndMinutesTo(this.sixHour45MinutesWorkingTime, 6, 45, this.rawEinstempelzeitTime);
        MainCalcComponent.addHoursAndMinutesTo(this.normalWorkingTime, 8, 21, this.rawEinstempelzeitTime);
        MainCalcComponent.addHoursAndMinutesTo(this.eightHourWorkingTime, 8, 45, this.rawEinstempelzeitTime);
        MainCalcComponent.addHoursAndMinutesTo(this.tenHourWorkingTime, 10, 45, this.rawEinstempelzeitTime);

        this.sixHour45MinutesWorkingLabel =
            this.sixHour45MinutesWorkingTime.toTimeString().split(this.TIME_SPLIT_SEPERATOR)[0];
        this.regelArbeitszeitLabel = this.normalWorkingTime.toTimeString().split(this.TIME_SPLIT_SEPERATOR)[0];
        this.eightHourWorkingLabel = this.eightHourWorkingTime.toTimeString().split(this.TIME_SPLIT_SEPERATOR)[0];
        this.tenHourLabel = this.tenHourWorkingTime.toTimeString().split(this.TIME_SPLIT_SEPERATOR)[0];

        this.isSollarbeitszeitBerechnet = true;
    }

    public berechneNettoArbeitszeit() {
        if (this.rawEinstempelzeit === '' || this.rawAusstempelzeit === '') {
            return;
        }

        this.rawEinstempelzeitTime = MainCalcComponent.parseRawTime(this.rawEinstempelzeit);
        this.rawAusstempelzeitTime = MainCalcComponent.parseRawTime(this.rawAusstempelzeit);

        const nettoArbeitszeit = MainCalcComponent.getTimeDifference(
            this.rawEinstempelzeitTime,
            this.rawAusstempelzeitTime);

        nettoArbeitszeit.setMinutes(nettoArbeitszeit.getMinutes() - this.LUNCH_BREAK_IN_MINUTES);

        this.nettoArbeitszeitLabel = nettoArbeitszeit.toTimeString().split(this.TIME_SPLIT_SEPERATOR)[0];

        this.isNettoArbeitszeitBerechnet = true;
    }


    private handleKeyEnterOnEinstempelzeitInput() {
        this.berechneNettoArbeitszeit();
    }

    private handleKeyEnterOnAusstempelzeitInput() {
        this.berechneNettoArbeitszeit();
    }
}

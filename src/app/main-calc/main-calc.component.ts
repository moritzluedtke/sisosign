import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-main-calc',
    templateUrl: './main-calc.component.html',
    styleUrls: ['./main-calc.component.css']
})
export class MainCalcComponent {

    isCalculated = false;
    clockInTime: Date;
    rawClockInTime = '';
    normalWorkingTime = new Date();
    eightHourWorkingTime = new Date();
    tenHourWorkingTime = new Date();
    normalWorkingLabel: string;
    eightHourWorkingLabel: string;
    tenHourLabel: string;

    constructor() { }


    public calculateTimes() {
        if (this.rawClockInTime === '') {
            return;
        }

        this.isCalculated = true;
        this.clockInTime = this.parseRawTime(this.rawClockInTime);

        this.addTimeTo(this.normalWorkingTime, 8, 21);
        this.addTimeTo(this.eightHourWorkingTime, 8, 45);
        this.addTimeTo(this.tenHourWorkingTime, 10, 45);

        this.normalWorkingLabel = this.normalWorkingTime.toTimeString().split(':00 GMT')[0];
        this.eightHourWorkingLabel = this.eightHourWorkingTime.toTimeString().split(':00 GMT')[0];
        this.tenHourLabel = this.tenHourWorkingTime.toTimeString().split(':00 GMT')[0];
    }

    private addTimeTo(time: Date, hours: number, minutes: number) {
        time.setHours(this.clockInTime.getHours());
        time.setMinutes(this.clockInTime.getMinutes());
        time.setSeconds(this.clockInTime.getSeconds());
        time.setMilliseconds(this.clockInTime.getMilliseconds());

        time.setHours(time.getHours() + hours);
        time.setMinutes(time.getMinutes() + minutes);
    }

    private parseRawTime(rawTime: string): Date {
        const hours = Number(rawTime.split(':')[0]);
        const minutes = Number(rawTime.split(':')[1]);


        const date = new Date();
        date.setHours(hours);
        date.setMinutes(minutes);
        date.setSeconds(0);
        date.setMilliseconds(0);

        return date;
    }

}

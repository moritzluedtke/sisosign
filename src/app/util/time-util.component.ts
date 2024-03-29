export class TimeUtil {

    static parseRawTime(rawTime: string): Date {
        const hours = Number(rawTime.split(':')[0]);
        const minutes = Number(rawTime.split(':')[1]);

        const parsedDate = new Date();
        parsedDate.setHours(hours);
        parsedDate.setMinutes(minutes);
        parsedDate.setSeconds(0);
        parsedDate.setMilliseconds(0);

        return parsedDate;
    }

    static getTimeDifference(fromTime: Date, toTime: Date): Date {
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

    static addHoursAndMinutesTo(baseTime: Date, hoursToAdd: number, minutesToAdd: number, resultingTime: Date) {
        resultingTime.setHours(baseTime.getHours() + hoursToAdd);
        resultingTime.setMinutes(baseTime.getMinutes() + minutesToAdd);

        // only here, to set seconds to zero in order to split the label based on that
        resultingTime.setSeconds(baseTime.getSeconds());
    }

    static subtractHoursAndMinuteFrom(baseTime: Date, hoursToSubtract: number, minutesToSubtract: number, resultingTime: Date) {
        resultingTime.setHours(baseTime.getHours() - hoursToSubtract);
        resultingTime.setMinutes(baseTime.getMinutes() - minutesToSubtract);

        // only here, to set seconds to zero in order to split the label based on that
        resultingTime.setSeconds(baseTime.getSeconds());
    }

    static isNotToday(input: Date) {
        const today = new Date();
        return today.getDay() !== input.getDay()
            || today.getMonth() !== input.getMonth()
            || today.getFullYear() !== input.getFullYear();
    }

    static isABeforeOrEqualToB(a: Date, b: Date): boolean {
        if (a.getHours() === b.getHours() && a.getMinutes() === b.getMinutes()) {
            return false;
        }
        return a.getHours() < b.getHours() ||
            (a.getHours() === b.getHours() && a.getMinutes() < b.getMinutes())
    }

    static isAAfterB(a: Date, b: Date) {
        return b.getHours() < a.getHours() ||
            (a.getHours() === b.getHours() && b.getMinutes() < a.getMinutes());
    }

    static isAAfterOrEqualtToB(a: Date, b: Date) {
        return b.getHours() < a.getHours() ||
            (a.getHours() === b.getHours() && b.getMinutes() <= a.getMinutes());
    }

    /*
    * Only checks hours and minutes.
    * Incl. from; Exl. to
    */
    static isBetween(dateToCheck: Date, from: Date, to: Date) {
        return (from.getHours() <= dateToCheck.getHours() && dateToCheck.getHours() < to.getHours())
            || (from.getHours() === dateToCheck.getHours()
                && from.getMinutes() <= dateToCheck.getMinutes()
                && dateToCheck.getMinutes() < to.getMinutes());
    }

    /*
     * Copies date and time.
     */
    static copyDate(copyFrom: Date): Date {
        const newDate = new Date();

        newDate.setDate(copyFrom.getDate());

        newDate.setHours(copyFrom.getHours());
        newDate.setMinutes(copyFrom.getMinutes());
        newDate.setSeconds(copyFrom.getSeconds());

        return newDate;
    }
}

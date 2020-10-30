export enum Richtung {
    PLUS = '+',
    MINUS = '-'
}

export class Tendenz {
    constructor(public time: Date, public richtung: Richtung) {
    }
}

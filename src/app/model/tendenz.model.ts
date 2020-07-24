export enum Polarity {
    PLUS = '+',
    MINUS = '-'
}

export class Tendenz {
    constructor(public time: Date, public polarity: Polarity) {
    }
}

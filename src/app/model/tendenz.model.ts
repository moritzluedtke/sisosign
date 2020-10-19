export enum Polarity {
    PLUS = '+',
    MINUS = '-'
}

export class TendenzRichtung {
    constructor(public time: Date, public polarity: Polarity) {
    }
}

export class Util {

    public static isNotEmpty(value: string): boolean {
        return !Util.isEmpty(value);
    }

    public static isEmpty(value: string): boolean {
        return value === null || value === undefined || value === '';
    }

}

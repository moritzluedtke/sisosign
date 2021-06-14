import { ApplicationRef, Component, OnInit } from '@angular/core';
import { interval } from 'rxjs';
import { Richtung, Tendenz } from '../../model/tendenz.model';
import { SettingsDialogComponent } from '../settings-dialog/settings-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { LocalStorageKeys } from '../../global-constants/local-storage-keys.model';
import { Util } from '../../util/util.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppVersionService } from '../../service/app-version.service';
import { Pausenregelung } from '../../model/pausenregelung.model';
import { TimeUtil } from '../../util/time-util.component';
import { Einstempelverhalten } from '../../model/einstempelverhalten.model';

@Component({
    selector: 'app-main-calc',
    templateUrl: './main-calc.component.html',
    styleUrls: [ './main-calc.component.scss' ]
})
export class MainCalcComponent implements OnInit {

    readonly RELEASE_NOTE_URL = 'https://github.com/moritzluedtke/sisosign/releases';
    readonly ISSUES_URL = 'https://github.com/moritzluedtke/sisosign/issues';
    readonly SOURCE_CODE_URL = 'https://github.com/moritzluedtke/sisosign';
    readonly SNACKBAR_NEW_VERSION_RELEASED_TEXT =
        `SISOSIGN v${ this.appVersionService.getAppVersion() } ist jetzt live!\n\n` +
        'Die Release Notes sind im Menü verlinkt.\n' +
        'Viel Spaß mit der neuen Version :)';
    readonly SNACKBAR_NEW_VERSION_RELEASED_BUTTON_TEXT = 'Cool!';
    readonly SETTINGS_DIALOG_WIDTH = '500px';
    readonly TIME_SPLIT_SEPARATOR = ':00 GMT';
    readonly TWENTY_SECONDS_IN_MS = 20_000;
    readonly EINSTELLUNGEN_TOOLTIP = 'Einstellungen';
    readonly RELEASE_NOTES_TOOLTIP = 'Release Notes';
    readonly ISSUES_TOOLTIP = 'GitHub Issues';
    readonly SOURCE_CODE_TOOLTIP = 'Source Code';
    readonly WAS_WAERE_WENN_TOOLTIP = '"Was wäre wenn?" an-/ausschalten';
    readonly JETZT_EINSTEMPELN_TOOLTIP = 'Jetzt einstempeln';
    readonly NETTOARBEITSZEIT_LESS_THAN_LENGTH_OF_PAUSE_TOOLTIP =
        'Du hast vermutlich noch weniger Minuten als die Länge der Pause gearbeitet. ' +
        'Daher steht die Arbeitszeit noch auf 0.';
    readonly SIX_HOURS = 6;

    regelarbeitszeitNetto = new Date();
    regelarbeitszeitPlusMittagspause = new Date();
    pausenlaengeInMinutes: number;
    gesetzlichePauseForSixToNineHoursOfBruttoArbeitszeit = 30;
    gesetzlichePauseForOverNineOfBruttoArbeitszeit = 45;
    additionalGesetzlichePauseAfterNineHours = 15;
    einstempelZurueckdatierungInMinutes: number;

    sixHoursAsDate = TimeUtil.parseRawTime('06:00');
    sixHoursPlusGesetzlichePauseAsDate = TimeUtil.parseRawTime(`06:${ this.gesetzlichePauseForSixToNineHoursOfBruttoArbeitszeit }`);
    nineHoursAsDate = TimeUtil.parseRawTime('09:00');
    nineHoursPlusGesetzlichePauseAsDate = TimeUtil.parseRawTime(`09:${ this.additionalGesetzlichePauseAfterNineHours }`);
    nineHoursMinusFirstPartOfGesetzlichePauseAsDate =
        TimeUtil.parseRawTime(`08:${ this.gesetzlichePauseForSixToNineHoursOfBruttoArbeitszeit }`);

    tendenz: Tendenz;
    wasWaereWennTendenz: Tendenz;

    selectedPausenregelung: Pausenregelung;
    selectedEinstempelverhalten: Einstempelverhalten;

    areSollarbeitszeitenBerechnet = false;
    isNettoArbeitszeitBerechnet = false;
    isWasWaereWennNettoArbeitszeitBerechnet = false;
    isJetztOptionActivated = false;
    isWasWaereWennActivated = false;
    areSettingsOpened = false;

    wasWaereWennShowHelpForZeroNettoarbeitszeit = false;
    wasWaereWennEinstempelzeitFromInput = '';
    wasWaereWennAusstempelzeitFromInput = '';
    wasWaereWennPausenzeitFromInput = '';

    einstempelzeitInput = '';
    ausstempelzeitInput = '';

    sechsNettostundenAusstempeluhrzeit = new Date();
    regelarbeitszeitAusstempeluhrzeit = new Date();
    achtStundenAusstempeluhrzeit = new Date();
    zehnStundenAusstempeluhrzeit = new Date();

    sixHourWorkingLabel: string;
    regelarbeitszeitLabel: string;
    eightHourWorkingLabel: string;
    tenHourWorkingLabel: string;
    nettoArbeitszeitLabel: string;
    tendenzLabel: string;
    wasWaereWennNettoArbeitszeitLabel: string;
    wasWaereWennTendenzLabel: string;

    constructor(public dialog: MatDialog,
                public snackbar: MatSnackBar,
                public appVersionService: AppVersionService,
                private appRef: ApplicationRef) {
        this.showNewVersionSnackbar();

        console.log('constructor');
        console.log('einstempelzeit: ' + this.einstempelzeitInput);

        if (this.loadDefaultValuesFromLocalStorage()) {
            console.log('einstempelzeit: ' + this.einstempelzeitInput);
            this.berechneEverything();
            console.log('einstempelzeit: ' + this.einstempelzeitInput);
        } else {
            this.openSettingsDialog(true);
        }
    }

    private static isBruttoArbeitszeitBelowMittagspausenLength(nettoArbeitszeit: Date, pausenlaengeInMinutes: number): boolean {
        return nettoArbeitszeit.getHours() === 0 && nettoArbeitszeit.getMinutes() <= pausenlaengeInMinutes;
    }

    private static berechneNettoArbeitszeitFrom(einstempelzeitFromUiInput: string,
                                                ausstempelzeitFromUiInput: string,
                                                pausenlaengeInMinutes: number): Date {
        if (Util.isEmpty(einstempelzeitFromUiInput)
            || Util.isEmpty(ausstempelzeitFromUiInput)
            || Util.isNumberEmpty(pausenlaengeInMinutes)) {
            return;
        }

        const einstempelzeitTime = TimeUtil.parseRawTime(einstempelzeitFromUiInput);
        const ausstempelzeitTime = TimeUtil.parseRawTime(ausstempelzeitFromUiInput);

        const bruttoArbeitszeit = TimeUtil.getTimeDifference(einstempelzeitTime, ausstempelzeitTime);

        const nettoArbeitszeit = bruttoArbeitszeit;

        if (MainCalcComponent.isBruttoArbeitszeitBelowMittagspausenLength(bruttoArbeitszeit, pausenlaengeInMinutes)) {
            nettoArbeitszeit.setMinutes(0);
        } else {
            nettoArbeitszeit.setMinutes(bruttoArbeitszeit.getMinutes() - pausenlaengeInMinutes);
        }

        return nettoArbeitszeit;
    }

    ngOnInit(): void {
        interval(this.TWENTY_SECONDS_IN_MS).subscribe(() => {
            if (this.isJetztOptionActivated) {
                this.setAusstempelzeitInputToNow();
                this.berechneNettoArbeitszeit();
            }
        });
    }

    private showNewVersionSnackbar(): void {
        const lastUsedAppVersion = localStorage.getItem(LocalStorageKeys.LAST_USED_APP_VERSION_KEY);
        const currentAppVersion = this.appVersionService.getAppVersion();

        if (lastUsedAppVersion !== currentAppVersion) {
            this.appVersionService.setNewVersionPresentTo(true);

            this.openNewVersionSnackbar().afterDismissed().subscribe(() => {
                localStorage.setItem(LocalStorageKeys.LAST_USED_APP_VERSION_KEY, currentAppVersion);
                this.appVersionService.setNewVersionPresentTo(false);
                this.rerenderPage();
            });
        }
    }

    private rerenderPage(): void {
        this.appRef.tick();
    }

    private openNewVersionSnackbar() {
        return this.snackbar.open(this.SNACKBAR_NEW_VERSION_RELEASED_TEXT, this.SNACKBAR_NEW_VERSION_RELEASED_BUTTON_TEXT,
            { panelClass: 'custom-snack-bar-container' });
    }

    private setAusstempelzeitInputToNow(): void {
        const ausstempelzeitTime = new Date();

        const minutes = ausstempelzeitTime.getMinutes().toString();
        const minutesWithLeadingZero = minutes.length === 1 ? '0' + minutes : minutes;
        const hours = ausstempelzeitTime.getHours().toString();
        const hoursWithLeadingZero = hours.length === 1 ? '0' + hours : hours;

        this.ausstempelzeitInput = hoursWithLeadingZero + ':' + minutesWithLeadingZero;
    }

    public berechneEverything(): void {
        this.saveEinstempelzeitToLocalStorage();

        if (Util.isEmpty(this.einstempelzeitInput)) {
            this.areSollarbeitszeitenBerechnet = false;
            this.isNettoArbeitszeitBerechnet = false;
        } else {
            this.berechneSollarbeitszeiten();
            this.berechneNettoArbeitszeit();
            this.berechneWasWareWennNettoArbeitszeit();
        }
    }

    private berechneSollarbeitszeiten(): void {
        if (Util.isEmpty(this.einstempelzeitInput)) {
            return;
        }

        const einstempelzeitTime = TimeUtil.parseRawTime(this.einstempelzeitInput);

        switch (this.selectedPausenregelung) {
            case Pausenregelung.LAW: {
                this.addHoursAndMinutesAccordingToLawPausenregelung(einstempelzeitTime);
                break;
            }
            case Pausenregelung.CLASSIC: {
                this.addHoursAndMinutesAccordingToClassicPausenregelung(einstempelzeitTime);
                break;
            }
        }

        this.setSollarbeitszeitsLabel();
    }

    private setSollarbeitszeitsLabel() {
        this.sixHourWorkingLabel = this.convertDateToTimeString(this.sechsNettostundenAusstempeluhrzeit);
        this.regelarbeitszeitLabel = this.convertDateToTimeString(this.regelarbeitszeitAusstempeluhrzeit);
        this.eightHourWorkingLabel = this.convertDateToTimeString(this.achtStundenAusstempeluhrzeit);
        this.tenHourWorkingLabel = this.convertDateToTimeString(this.zehnStundenAusstempeluhrzeit);

        this.areSollarbeitszeitenBerechnet = true;
    }

    private addHoursAndMinutesAccordingToLawPausenregelung(einstempelzeitTime: Date) {
        TimeUtil.addHoursAndMinutesTo(einstempelzeitTime, 6, this.gesetzlichePauseForSixToNineHoursOfBruttoArbeitszeit,
            this.sechsNettostundenAusstempeluhrzeit);
        TimeUtil.addHoursAndMinutesTo(einstempelzeitTime, 8, this.gesetzlichePauseForSixToNineHoursOfBruttoArbeitszeit,
            this.achtStundenAusstempeluhrzeit);
        TimeUtil.addHoursAndMinutesTo(einstempelzeitTime, 10, this.gesetzlichePauseForOverNineOfBruttoArbeitszeit,
            this.zehnStundenAusstempeluhrzeit);

        const regelarbeitszeitMitPause = new Date();
        regelarbeitszeitMitPause.setHours(this.regelarbeitszeitNetto.getHours());
        regelarbeitszeitMitPause.setMinutes(this.regelarbeitszeitNetto.getMinutes());

        if (TimeUtil.isBetween(this.regelarbeitszeitNetto, this.sixHoursAsDate, this.nineHoursAsDate)) {
            regelarbeitszeitMitPause.setMinutes(
                this.regelarbeitszeitNetto.getMinutes() + this.gesetzlichePauseForSixToNineHoursOfBruttoArbeitszeit);
        } else {
            regelarbeitszeitMitPause.setMinutes(
                this.regelarbeitszeitNetto.getMinutes() + this.gesetzlichePauseForOverNineOfBruttoArbeitszeit);
        }

        TimeUtil.addHoursAndMinutesTo(einstempelzeitTime, regelarbeitszeitMitPause.getHours(), regelarbeitszeitMitPause.getMinutes(),
            this.regelarbeitszeitAusstempeluhrzeit);
    }

    private addHoursAndMinutesAccordingToClassicPausenregelung(einstempelzeitTime: Date) {
        TimeUtil.addHoursAndMinutesTo(einstempelzeitTime, 6, this.pausenlaengeInMinutes, this.sechsNettostundenAusstempeluhrzeit);
        TimeUtil.addHoursAndMinutesTo(einstempelzeitTime, 8, this.pausenlaengeInMinutes, this.achtStundenAusstempeluhrzeit);
        TimeUtil.addHoursAndMinutesTo(einstempelzeitTime, 10, this.pausenlaengeInMinutes, this.zehnStundenAusstempeluhrzeit);

        TimeUtil.addHoursAndMinutesTo(einstempelzeitTime,
            this.regelarbeitszeitPlusMittagspause.getHours(),
            this.regelarbeitszeitPlusMittagspause.getMinutes(),
            this.regelarbeitszeitAusstempeluhrzeit);
    }

    private berechneWasWareWennNettoArbeitszeit(): void {
        const nettoArbeitszeit = MainCalcComponent.berechneNettoArbeitszeitFrom(
            this.wasWaereWennEinstempelzeitFromInput,
            this.wasWaereWennAusstempelzeitFromInput,
            Number(this.wasWaereWennPausenzeitFromInput));

        if (Util.isObjectPresent(nettoArbeitszeit)) {
            this.isWasWaereWennNettoArbeitszeitBerechnet = true;
            this.setWasWaereWennNettoArbeitszeitLabelTo(nettoArbeitszeit);
            this.wasWaereWennShowHelpForZeroNettoarbeitszeit = nettoArbeitszeit.getHours() === 0 && nettoArbeitszeit.getMinutes() === 0;

            this.wasWaereWennTendenz = this.berechneTendenz(nettoArbeitszeit);
            this.setWasWaereWennTendenzLabelTo(this.wasWaereWennTendenz.time);
        }
    }

    private berechneNettoArbeitszeit(): void {
        const nettoArbeitszeit =
            this.berechneNettoArbeitszeitConsideringPausenregelung(
                this.einstempelzeitInput, this.ausstempelzeitInput, this.pausenlaengeInMinutes);

        if (Util.isObjectPresent(nettoArbeitszeit)) {
            this.isNettoArbeitszeitBerechnet = true;
            this.setNettoArbeitszeitLabelTo(nettoArbeitszeit);

            this.tendenz = this.berechneTendenz(nettoArbeitszeit);
            this.setTendenzTimeLabelTo(this.tendenz.time);
        }
    }

    private berechneNettoArbeitszeitConsideringPausenregelung(einstempelzeitFromUiInput: string,
                                                              ausstempelzeitFromUiInput: string,
                                                              pausenlaengeInMinutes: number): Date {
        if (Util.isEmpty(einstempelzeitFromUiInput)
            || Util.isEmpty(ausstempelzeitFromUiInput)
            || Util.isNumberEmpty(pausenlaengeInMinutes)) {
            return;
        }

        const einstempelzeitDate = TimeUtil.parseRawTime(einstempelzeitFromUiInput);
        const ausstempelzeitDate = TimeUtil.parseRawTime(ausstempelzeitFromUiInput);

        const bruttoArbeitszeitDate = TimeUtil.getTimeDifference(einstempelzeitDate, ausstempelzeitDate);

        if (bruttoArbeitszeitDate.getHours() < this.SIX_HOURS) {
            return bruttoArbeitszeitDate;
        }

        switch (this.selectedPausenregelung) {
            case Pausenregelung.LAW: {
                return this.calculateNettoarbeitszeitBerechnungForLawPausenregelung(bruttoArbeitszeitDate);
            }
            case Pausenregelung.CLASSIC: {
                return this.calculateNettoarbeitszeitBerechnungForClassicPausenregelung(bruttoArbeitszeitDate, pausenlaengeInMinutes);
            }
        }
    }

    private calculateNettoarbeitszeitBerechnungForLawPausenregelung(bruttoArbeitszeit: Date): Date {
        const nettoArbeitszeit = TimeUtil.copyDate(bruttoArbeitszeit);

        if (TimeUtil.isBetween(bruttoArbeitszeit, this.sixHoursAsDate, this.sixHoursPlusGesetzlichePauseAsDate)) {
            return this.sixHoursAsDate;
        } else if (TimeUtil.isBetween(bruttoArbeitszeit, this.nineHoursAsDate, this.nineHoursPlusGesetzlichePauseAsDate)) {
            // Während die Pausenzeit erweitert wird von 30m auf 45m bleibt die Nettoarbeitszeit gleich, also fix 9h - 30m
            return this.nineHoursMinusFirstPartOfGesetzlichePauseAsDate;
        } else if (TimeUtil.isBetween(bruttoArbeitszeit, this.sixHoursPlusGesetzlichePauseAsDate, this.nineHoursAsDate)) {
            nettoArbeitszeit.setMinutes(bruttoArbeitszeit.getMinutes() - this.gesetzlichePauseForSixToNineHoursOfBruttoArbeitszeit);
        } else if (TimeUtil.isAAfterOrEqualtToB(bruttoArbeitszeit, this.nineHoursPlusGesetzlichePauseAsDate)) {
            nettoArbeitszeit.setMinutes(bruttoArbeitszeit.getMinutes() - this.gesetzlichePauseForOverNineOfBruttoArbeitszeit);
        }
        return nettoArbeitszeit;
    }

    private calculateNettoarbeitszeitBerechnungForClassicPausenregelung(bruttoArbeitszeit: Date, pausenlaengeInMinutes: number): Date {
        const nettoArbeitszeit = bruttoArbeitszeit;
        const sixHoursPlusPause = TimeUtil.copyDate(this.sixHoursAsDate);
        sixHoursPlusPause.setMinutes(sixHoursPlusPause.getMinutes() + this.pausenlaengeInMinutes);

        if (TimeUtil.isBetween(bruttoArbeitszeit, this.sixHoursAsDate, sixHoursPlusPause)) {
            return this.sixHoursAsDate;
        } else {
            nettoArbeitszeit.setMinutes(bruttoArbeitszeit.getMinutes() - pausenlaengeInMinutes);
            return nettoArbeitszeit;
        }
    }

    private berechneTendenz(nettoArbeitszeit: Date): Tendenz {
        let tendenzTime = TimeUtil.getTimeDifference(this.regelarbeitszeitNetto, nettoArbeitszeit);
        let richtung = Richtung.PLUS;

        if (this.isNettoArbeitszeitBelowRegelarbeitszeit(nettoArbeitszeit)) {
            tendenzTime = TimeUtil.getTimeDifference(nettoArbeitszeit, this.regelarbeitszeitNetto);
            richtung = Richtung.MINUS;
        }

        return new Tendenz(tendenzTime, richtung);
    }

    private isNettoArbeitszeitBelowRegelarbeitszeit(nettoArbeitszeit: Date): boolean {
        return nettoArbeitszeit.getHours() < this.regelarbeitszeitNetto.getHours()
            || (nettoArbeitszeit.getHours() === this.regelarbeitszeitNetto.getHours() &&
                nettoArbeitszeit.getMinutes() < this.regelarbeitszeitNetto.getMinutes());
    }

    public setNettoArbeitszeitLabelTo(newTime: Date): void {
        this.nettoArbeitszeitLabel = this.convertDateToTimeString(newTime);
    }

    public setWasWaereWennNettoArbeitszeitLabelTo(newTime: Date): void {
        this.wasWaereWennNettoArbeitszeitLabel = this.convertDateToTimeString(newTime);
    }

    public setTendenzTimeLabelTo(newTime: Date): void {
        this.tendenzLabel = this.convertDateToTimeString(newTime);
    }

    public setWasWaereWennTendenzLabelTo(newTime: Date): void {
        this.wasWaereWennTendenzLabel = this.convertDateToTimeString(newTime);
    }

    private convertDateToTimeString(time: Date): string {
        return time.toTimeString().split(this.TIME_SPLIT_SEPARATOR)[0];
    }

    public handleJetztOption(): void {
        if (!this.isJetztOptionActivated) {
            this.setAusstempelzeitInputToNow();
            this.berechneNettoArbeitszeit();
        }
    }

    public handleUserInputKeyPress(): void {
        this.berechneEverything();
    }

    public openSettingsDialog(firstTime: boolean): void {
        if (!this.areSettingsOpened) {
            this.areSettingsOpened = true;
            const dialogRef = this.dialog.open(SettingsDialogComponent, {
                width: this.SETTINGS_DIALOG_WIDTH,
                data: { firstTime },
                disableClose: firstTime
            });
            dialogRef.afterClosed().subscribe(() => {
                this.areSettingsOpened = false;
                this.loadDefaultValuesFromLocalStorage();
                this.berechneEverything();
            });
        }
    }

    public jetztEinstempeln(): void {
        this.setEinstempelzeitToNow()
        this.berechneEverything();
    }

    private setEinstempelzeitToNow(): void {
        const now = new Date();
        now.setSeconds(0); // workaround to make convertDateToTimeString splitting on TIME_SPLIT_SEPERATOR work
        const newEinstempelzeit = new Date();

        TimeUtil.subtractHoursAndMinuteFrom(now, 0, this.einstempelZurueckdatierungInMinutes, newEinstempelzeit);

        this.einstempelzeitInput = this.convertDateToTimeString(newEinstempelzeit);
    }

    public loadDefaultValuesFromLocalStorage(): boolean {
        const pausenlaenge = localStorage.getItem(LocalStorageKeys.PAUSENLAENGE_KEY);
        const savedPausenregelung = Pausenregelung[localStorage.getItem(LocalStorageKeys.PAUSENREGELUNG_KEY)];
        const taeglicheArbeitszeitString = localStorage.getItem(LocalStorageKeys.TAEGLICHE_ARBEITSZEIT_KEY);

        this.loadJetztOptionActivatedByDefault();
        this.loadWasWaereWennActivated();
        this.loadEinstempelverhalten();
        this.loadEinstempelzeit(); // has to load after loadEinstempelverhalten()

        if (savedPausenregelung === undefined) {
            this.selectedPausenregelung = Pausenregelung.CLASSIC;
            this.savePausenregelungToLocalStorage();
        } else {
            this.selectedPausenregelung = savedPausenregelung;
        }

        if (Util.isNotEmpty(pausenlaenge)
            && Util.isNotEmpty(taeglicheArbeitszeitString)) {
            this.pausenlaengeInMinutes = Number(pausenlaenge);
            this.updateRegelarbeitszeit(taeglicheArbeitszeitString);

            return true;
        }

        return false;
    }

    private loadJetztOptionActivatedByDefault() {
        const isJetztOptionActivatedAsDefault = JSON.parse(localStorage.getItem(LocalStorageKeys.JETZT_OPTION_ACTIVATED_BY_DEFAULT_KEY));

        if (isJetztOptionActivatedAsDefault) {
            this.handleJetztOption();
            this.isJetztOptionActivated = isJetztOptionActivatedAsDefault;
        }
    }

    private loadWasWaereWennActivated() {
        const wasWaereWennActivated = localStorage.getItem(LocalStorageKeys.WAS_WAERE_WENN_ACTIVATED_KEY);

        if (Util.isEmpty(wasWaereWennActivated)) {
            this.isWasWaereWennActivated = false;
        } else {
            this.isWasWaereWennActivated = JSON.parse(wasWaereWennActivated);
        }
    }

    private loadEinstempelzeit() {
        const einstempelzeitRaw = localStorage.getItem(LocalStorageKeys.EINSTEMPELZEIT_RAW_KEY);
        const lastUpdateOnEinstempelzeit = localStorage.getItem(LocalStorageKeys.LAST_UPDATE_ON_EINSTEMPELZEIT_KEY);
        this.einstempelzeitInput = einstempelzeitRaw;

        if (Util.isEmpty(einstempelzeitRaw) || TimeUtil.isNotToday(new Date(lastUpdateOnEinstempelzeit))) {
            localStorage.removeItem(LocalStorageKeys.EINSTEMPELZEIT_RAW_KEY);
            localStorage.removeItem(LocalStorageKeys.LAST_UPDATE_ON_EINSTEMPELZEIT_KEY);
            this.einstempelzeitInput = '';
        }

        if (this.selectedEinstempelverhalten === Einstempelverhalten.AUTOMATIC
            && TimeUtil.isNotToday(new Date(lastUpdateOnEinstempelzeit))) {
                this.setEinstempelzeitToNow();
        }
    }

    private loadEinstempelverhalten() {
        const einstempelverhalten = Einstempelverhalten[localStorage.getItem(LocalStorageKeys.EINSTEMEPELVERHALTEN)];

        if (einstempelverhalten === undefined) {
            this.selectedEinstempelverhalten = Einstempelverhalten.MANUAL
            this.einstempelZurueckdatierungInMinutes = 0;

            localStorage.setItem(LocalStorageKeys.EINSTEMEPELVERHALTEN, Einstempelverhalten.MANUAL);
            localStorage.setItem(LocalStorageKeys.EINSTEMPEL_ZURUECKDATIERUNG_IN_MINUTEN_KEY, '0');
        } else {
            this.selectedEinstempelverhalten = einstempelverhalten;
            this.einstempelZurueckdatierungInMinutes =
                Number(localStorage.getItem(LocalStorageKeys.EINSTEMPEL_ZURUECKDATIERUNG_IN_MINUTEN_KEY));
        }
    }

    private saveEinstempelzeitToLocalStorage() {
        localStorage.setItem(LocalStorageKeys.EINSTEMPELZEIT_RAW_KEY, this.einstempelzeitInput);
        localStorage.setItem(LocalStorageKeys.LAST_UPDATE_ON_EINSTEMPELZEIT_KEY, new Date().toISOString());
    }

    private savePausenregelungToLocalStorage() {
        localStorage.setItem(LocalStorageKeys.PAUSENREGELUNG_KEY, String(this.selectedPausenregelung));
    }

    private updateRegelarbeitszeit(taeglicheArbeitszeitString: string) {
        this.regelarbeitszeitNetto = TimeUtil.parseRawTime(taeglicheArbeitszeitString);
        TimeUtil.addHoursAndMinutesTo(this.regelarbeitszeitNetto, 0, this.pausenlaengeInMinutes, this.regelarbeitszeitPlusMittagspause);
    }

    public openNewTab(url: string): void {
        window.open(url);
    }

    public toggleWasWareWenn(): void {
        this.isWasWaereWennActivated = !this.isWasWaereWennActivated;
        localStorage.setItem(LocalStorageKeys.WAS_WAERE_WENN_ACTIVATED_KEY, `${ this.isWasWaereWennActivated }`);
    }

    public isEinstempelverhaltenAutomatic(): boolean {
        return this.selectedEinstempelverhalten === Einstempelverhalten.AUTOMATIC;
    }

}

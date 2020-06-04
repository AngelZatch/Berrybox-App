import { Component, OnInit, EventEmitter } from '@angular/core';

import { ThemeService } from 'app/shared/services/theme.service';
import { AuthSubject } from 'app/shared/models/session.model';
import { AuthService } from 'app/core/auth/auth.service';
import { environment } from 'environments/environment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PictureUploaderComponent } from 'app/shared/components/picture-uploader/picture-uploader.component';
import { UserService } from 'app/shared/services/user.service';

@Component({
    selector: 'app-user-settings',
    templateUrl: './user-settings.component.html',
    styleUrls: ['./user-settings.component.scss'],
    providers: []
})
export class UserSettingsComponent implements OnInit {
    public currentTab = 'account';

    public close: EventEmitter<any> = new EventEmitter();

    public isDarkThemeEnabled = true;

    public session: AuthSubject = AuthService.getAuthSubject();
    public pictureLocation: string

    public color: string

    constructor(
        private modalService: NgbModal,
        private themeService: ThemeService,
        private userService: UserService
    ) { }

    ngOnInit() {
        if (this.session.settings.theme === 'light') {
            this.isDarkThemeEnabled = false;
        }
        this.pictureLocation = `${environment.amazonBuckets}/${environment.profilePictureBuckets}/${this.session.settings.picture}`
        this.color = this.session.settings.color ?? '#DF62A9';
    }

    closeSettings() {
        this.close.emit();
    }

    toggleDarkTheme() {
        if (this.isDarkThemeEnabled === true) {
            this.themeService.toggleLight()
            this.isDarkThemeEnabled = false
        } else {
            this.themeService.toggleDark()
            this.isDarkThemeEnabled = true
        }
    }

    saveChatColor() {
        this.userService.updateSettings({ color: this.color }).subscribe(
            () => {
                this.session.settings.color = this.color;
                localStorage.setItem('BBOX-user', JSON.stringify(this.session));
                console.log('Color saved.');
            }
        );
    }

    toggleColorBlindMode() {
        this.userService.updateSettings({ isColorblind: this.session.settings.isColorblind }).subscribe(
            () => {
                localStorage.setItem('BBOX-user', JSON.stringify(this.session));
                console.log('Saved.');
            }
        )
    }

    openPictureUploader() {
        const modalRef = this.modalService.open(PictureUploaderComponent)
    }
}

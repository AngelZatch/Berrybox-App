import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { BoxWidgetComponent } from './shared/components/box-widget/box-widget.component';
import { HomeComponent } from './shared/components/home/home.component';
import { UserComponent } from './shared/components/user/user.component';
import { BoxFormComponent } from './shared/components/box-form/box-form.component';
import { LikesComponent } from './shared/components/likes/likes.component';

// Auth component
import { NavComponent } from './core/nav/nav.component'; // Exceptional, so it can benefit from the auth directive
import { LoginFormComponent } from './shared/components/login-form/login-form.component';
import { SignupFormComponent } from './shared/components/signup-form/signup-form.component';

/* Feature Modules */
import { JukeboxModule } from './modules/jukebox/jukebox.module';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    declarations: [
        AppComponent,
        BoxWidgetComponent,
        HomeComponent,
        UserComponent,
        BoxFormComponent,
        LikesComponent,
        LoginFormComponent,
        SignupFormComponent,
        NavComponent
    ],
    imports: [
        AppRoutingModule,
        BrowserModule,
        SharedModule,
        CoreModule,
        JukeboxModule,
        NgbModule.forRoot()
    ],
    exports: [
        AppComponent
    ],
    providers: [],
    bootstrap: [AppComponent],
    entryComponents: [
        BoxFormComponent,
        LoginFormComponent,
        SignupFormComponent
    ]
})
export class AppModule { }

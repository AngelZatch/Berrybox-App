import { Component, OnInit } from '@angular/core';

import { User } from 'app/shared/models/user.model';
import { BoxService, ActiveSubscriber } from 'app/shared/services/box.service';
import { Observable } from 'rxjs';
import { Box } from 'app/shared/models/box.model';
import { JukeboxService } from '../../jukebox.service';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-userlist',
    templateUrl: './userlist.component.html',
    styleUrls: ['./userlist.component.scss'],
    providers: [BoxService]
})
export class UserlistComponent implements OnInit {
    box: Box;

    pictureLocation = `${environment.amazonBuckets}/${environment.profilePictureBuckets}`

    users$: Observable<Array<ActiveSubscriber>>

    admin: ActiveSubscriber
    moderators: Array<ActiveSubscriber>
    vips: Array<ActiveSubscriber>
    community: Array<ActiveSubscriber>

    constructor(
        private jukeboxService: JukeboxService,
        private boxService: BoxService
    ) { }

    ngOnInit() {
        this.jukeboxService.getBox().subscribe(
            (box: Box) => {
                this.box = box
                this.getCommunity()
            }
        )
    }

    getCommunity() {
        this.boxService.users(this.box._id).subscribe(
            (subscribers) => {
                this.admin = subscribers.find((subscriber) => subscriber._id === this.box.creator._id)
                this.moderators = subscribers.filter((subscriber) => subscriber.role === 'moderator')
                this.vips = subscribers.filter((subscriber) => subscriber.role === 'vip')
                this.community = subscribers.filter((subscriber) => subscriber.role === 'simple')
            }
        )
    }

}

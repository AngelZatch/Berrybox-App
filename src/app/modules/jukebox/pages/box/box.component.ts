import { Component, OnInit, HostListener } from '@angular/core';
import { BoxService } from './../../../../shared/services/box.service';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

import { JukeboxService } from './../../jukebox.service';
import { AuthService } from 'app/core/auth/auth.service';
import { Box } from 'app/shared/models/box.model';
import { filter } from 'rxjs/operators';
import { AuthSubject } from 'app/shared/models/session.model';
import { BoxFormComponent } from 'app/shared/components/box-form/box-form.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PlaylistSelectorComponent } from 'app/shared/components/playlist-selector/playlist-selector.component';
import { PlaylistService } from 'app/shared/services/playlist.service';
import { ToastrService } from 'ngx-toastr';
import { QueueItem, SyncPacket, FeedbackMessage } from '@teamberry/muscadine';
import { SubmissionPayload } from 'app/shared/models/playlist-payload.model';

@Component({
    selector: 'app-box',
    templateUrl: './box.component.html',
    styleUrls: ['./box.component.scss'],
    providers: [BoxService]
})
export class BoxComponent implements OnInit {
    /**
     * Token of the box. Unique indentifier (ObjectID from MongoDB)
     *
     * @type {string}
     * @memberof BoxComponent
     */
    token: string;

    /**
     * Box itself
     *
     * @type {Box}
     * @memberof BoxComponent
     */
    box: Box;

    /**
     * Loading flag to hide or show parts of the DOM depending on their state of readiness
     *
     * @memberof BoxComponent
     */
    loading = true;

    /**
     * The currently playing video in the box. Gets refreshed by sockets and sent to the player and mood widgets
     *
     * @memberof BoxComponent
     */
    currentVideo: QueueItem = null;

    /**
     * Connected user. Obtained from the auth service
     *
     * @type {User}
     * @memberof BoxComponent
     */
    user: AuthSubject = AuthService.getAuthSubject();

    connectionStatus = 'offline';
    isDraggingMiniature = false;


    constructor(
        private boxService: BoxService,
        private jukeboxService: JukeboxService,
        private playlistService: PlaylistService,
        private modalService: NgbModal,
        private route: ActivatedRoute,
        private toastr: ToastrService
    ) { }

    ngOnInit() {
        this.route.params.subscribe(params => {
            this.token = params.token;
            this.loadBox();
            this.monitorConnectionStatus();
            this.listenForBoxChanges();
        });
    }

    /**
     * Loads the details of the box
     *
     * Only if you're the creator of the box. Else, you just connect to the jukeboxService and get the box from there
     *
     * @memberof BoxComponent
     */
    loadBox() {
        this.boxService.show(this.token).subscribe(
            (box: Box) => {
                this.box = box;
                // Start box once it's loaded
                this.jukeboxService.startBox(this.box);
                this.connectToSyncStream();
                this.loading = false;
            }
        );
    }

    monitorConnectionStatus() {
        this.jukeboxService.getConnection().subscribe(
            (status: string) => {
                this.connectionStatus = status;
            }
        )
    }

    listenForBoxChanges() {
        this.jukeboxService.getBox().subscribe(
            (updatedBox: Box) => {
                this.box = updatedBox
            }
        )
    }

    /**
     * This is where the real-time stuff happens.
     * The box will connect to the server via socket and start synchronising with other users.
     *
     * @memberof BoxComponent
     */
    connectToSyncStream() {
        this.jukeboxService.getBoxStream()
            .pipe(
                filter((syncPacket: SyncPacket) => syncPacket.box === this.box._id)
            )
            .subscribe(
                (syncPacket: SyncPacket) => {
                    this.currentVideo = syncPacket?.item ?? null;
                },
                error => {
                    console.error(error);
                }
            );
    }


    /**
     * Actions when the player changes state
     *
     * @param {*} event
     * @memberof BoxComponent
     */
    onPlayerStateChange(event: any) {
        if (event === 'ready') {
            this.connectToSyncStream();
        }
    }

    /**
     * Sends a command to skip the currently playing video
     *
     * @memberof BoxComponent
     */
    skipVideo() {
        this.jukeboxService.skipVideo();
    }

    openBoxSettings() {
        if (this.jukeboxService.evaluateCommandPower()) {
            const modalRef = this.modalService.open(BoxFormComponent, { size: 'xl' })
            modalRef.componentInstance.title = `Edit Box Settings`
            modalRef.componentInstance.box = _.cloneDeep(this.box)
        }
    }

    addToPlaylist() {
        const modalRef = this.modalService.open(PlaylistSelectorComponent)
        modalRef.componentInstance.selectedPlaylist$.subscribe(
            (playlistId: string) => {
                this.playlistService.addVideoToPlaylist(playlistId, { videoId: this.currentVideo.video._id }).toPromise()
                this.toastr.success('Video added', 'Success')
            }
        )
    }

    handleMiniatureDrag(isDraggingMiniature: boolean) {
        this.isDraggingMiniature = isDraggingMiniature;
        if (isDraggingMiniature) {
            this.activePanel = 'queue'
        }
    }

    submitFromMiniature(miniatureSource: string) {
        try {
            const miniatureUrl = /src="?([^"\s]+)"?\s*/.exec(miniatureSource);

            if (!miniatureUrl) {
                this.handleMiniatureError();
                return;
            }

            const extractedLink = new RegExp(/ytimg.com\/vi\/([a-z0-9\-\_]+)\//i).exec(miniatureUrl[1]);

            if (!extractedLink) {
                this.handleMiniatureError();
                return;
            }

            const video: SubmissionPayload = {
                link: extractedLink[1],
                userToken: this.user._id,
                boxToken: this.box._id
            }

            this.jukeboxService.submitVideo(video);
        } catch (error) {
            this.handleMiniatureError();
        }
    }

    handleMiniatureError() {
        const message: FeedbackMessage = new FeedbackMessage({
            contents: 'The miniature image is corrupted or not from YouTube. Please retry with a miniature from YouTube.',
            scope: this.box._id,
            time: new Date(),
            context: 'error'
        });
        this.jukeboxService.postMessageToStream(message);
    }
}

import { Injectable } from "@angular/core";

import { Video } from './video.model';

@Injectable()
export class PlaylistVideo {
    _id: string;
    endTime: number;
    ignored: boolean;
    startTime: number;
    submittedAt: number;
    submitted_by: {
        _id: string;
        name: string;
    };
    video: Video;
}
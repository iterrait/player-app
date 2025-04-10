import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { IMaskModule } from 'angular-imask';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';

import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AnimationBackgroundComponent } from '$components/animation-background/animation-background.component';
import { HlsMediaObjectCompponent } from '$components/media-objects/hls-media-object/hls-media-object.compponent';
import { SingleImageMediaObjectComponent } from '$components/media-objects/single-image-media-object/single-image-media-object.component';
import { SingleVideoMediaObjectComponent } from '$components/media-objects/single-video-media-object/single-video-media-object.component';
import { SlotMediaObjectComponent } from '$components/media-objects/slot-media-object/slot-media-object.component';
import { PlaylistItemComponent } from '$components/playlist-item/playlist-item.component';
import { SimpleBackgroundComponent } from '$components/simple-background/simple-background.component';
import { AboutComponent } from './pages/about/about.component';
import { HomeComponent } from './pages/home/home.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { PlayerSettingsComponent } from './pages/settings/player-settings/player-settings.component';
import { PlaylistSettingsComponent } from './pages/settings/playlist-settings/playlist-settings.component';

@NgModule({
  declarations: [
    AboutComponent,
    AppComponent,
    HomeComponent,
    PlayerSettingsComponent,
    PlaylistSettingsComponent,
    SettingsComponent,
  ],
  imports: [
    AnimationBackgroundComponent,
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    DragDropModule,
    FormsModule,
    IMaskModule,
    HlsMediaObjectCompponent,
    HttpClientModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    MatProgressBarModule,
    MatTabsModule,
    NgxMatTimepickerModule,
    PlaylistItemComponent,
    ReactiveFormsModule,
    SingleImageMediaObjectComponent,
    SingleVideoMediaObjectComponent,
    SimpleBackgroundComponent,
    SlotMediaObjectComponent,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }

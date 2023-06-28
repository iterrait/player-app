import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { PlaylistItemComponent } from './components/playlist-item/playlist-item.component';
import { SimpleBackgroundComponent } from './components/simple-background/simple-background.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { HomeComponent } from './pages/home/home.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    SettingsComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatOptionModule,
    NgxMatTimepickerModule,
    PlaylistItemComponent,
    ReactiveFormsModule,
    SimpleBackgroundComponent,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

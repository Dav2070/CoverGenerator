import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { NgxFileHelpersModule } from 'ngx-file-helpers'

import { AppComponent } from './app.component'

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule,
		NgbModule,
		NgxFileHelpersModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }

import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'
import { FormsModule } from '@angular/forms'
import { NgbModule } from '@ng-bootstrap/ng-bootstrap'
import { NgxFileHelpersModule } from 'ngx-file-helpers'

import { AppComponent } from './app.component'

@NgModule({
	declarations: [
		AppComponent
	],
	imports: [
		BrowserModule,
		FormsModule,
		NgbModule,
		NgxFileHelpersModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }
